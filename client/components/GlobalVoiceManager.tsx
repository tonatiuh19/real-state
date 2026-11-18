import React, { useEffect, useRef, useCallback, useState } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import * as AblyLib from "ably";
import { getSharedAblyClient } from "@/lib/ably-client";
import { Phone, PhoneOff, PhoneIncoming, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setDeviceStatus,
  setDeviceError,
  setVoiceAvailable,
  requestVoiceReconnect,
  notifyCallAnswered,
  endOutboundCall,
  resolveOutboundCallName,
  fetchVoiceToken,
  updateVoiceAvailability,
  lookupContact,
} from "@/store/slices/voiceSlice";
import type { VoiceTokenRejection } from "@/store/slices/voiceSlice";
import VoiceCallPanel from "@/components/VoiceCallPanel";
import { VoiceDeviceProvider } from "@/contexts/VoiceDeviceContext";
import { logger } from "@/lib/logger";
import VoiceErrorAlert from "@/components/VoiceErrorAlert";
import {
  applyInputDevice,
  backoffDelayMs,
  describeVoiceError,
  getSavedMicId,
  isMicError,
  preflightMicrophone,
  type VoiceErrorInfo,
} from "@/utils/voiceErrors";

/** Max attempts for token fetch / register before giving up (≈1+2+4 s of backoff). */
const MAX_VOICE_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GlobalVoiceManager — mounted once inside AdminLayout so the Twilio Device
 * stays alive on every admin page. Renders the ringing notification and active
 * call panel as fixed overlays.
 */
const GlobalVoiceManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessionToken } = useAppSelector((s) => s.brokerAuth);
  const isAvailable = useAppSelector((s) => s.voice.isAvailable);
  const outboundCall = useAppSelector((s) => s.voice.outboundCall);
  const deviceStatus = useAppSelector((s) => s.voice.deviceStatus);
  const deviceError = useAppSelector((s) => s.voice.deviceError);
  const reconnectNonce = useAppSelector((s) => s.voice.reconnectNonce);

  // Latest availability for async setup/retry code (avoids stale closures).
  const isAvailableRef = useRef(isAvailable);
  isAvailableRef.current = isAvailable;
  const deviceStatusRef = useRef(deviceStatus);
  deviceStatusRef.current = deviceStatus;

  const deviceRef = useRef<Device | null>(null);
  // Prevents the [isAvailable] effect from calling register() before setup() completes.
  const deviceReadyRef = useRef(false);
  // Mirrors ringingCall state for use inside event listeners (no stale closure).
  const ringingCallRef = useRef<Call | null>(null);
  // Tracks the CallSid of the current ringing call so Ably dismissal can match it.
  const ringingCallSidRef = useRef<string | null>(null);
  // Tracks whether the broker is already busy with another call (active inbound
  // or outbound). Used inside the Twilio "incoming" handler to reject a second
  // simultaneous call — two concurrent WebRTC calls compete for the same mic
  // and silently mute the first call's outgoing audio on Chrome/macOS.
  const busyRef = useRef(false);

  const [ringingCall, setRingingCall] = useState<Call | null>(null);
  const [ringingPhone, setRingingPhone] = useState<string>("");
  const [ringingClientName, setRingingClientName] = useState<string | null>(
    null,
  );
  const [ringingClientId, setRingingClientId] = useState<number | null>(null);
  const [activeIncomingCall, setActiveIncomingCall] = useState<Call | null>(
    null,
  );
  // Mic preflight failure while a call is ringing (shown on the ringing card).
  const [ringingError, setRingingError] = useState<VoiceErrorInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  // Session-only dismissal for the "offline for calls" / device error banners.
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Tracks the Device's audio helper so inbound VoiceCallPanel can switch devices
  const [deviceAudio, setDeviceAudio] = useState<Device["audio"] | null>(null);

  // POST /api/voice/availability — called ONLY from registered/unregistered events.
  const reportAvailability = useCallback(
    (available: boolean) => {
      dispatch(updateVoiceAvailability(available));
    },
    [dispatch],
  );

  /**
   * Fetch a voice token with bounded exponential backoff. Non-retryable
   * failures (402 quota, 401/403) stop immediately. The mapped reason is
   * stored in voiceSlice.deviceError so the UI can explain it.
   */
  const fetchToken = useCallback(
    async (
      isCancelled: () => boolean = () => false,
    ): Promise<string | null> => {
      for (let attempt = 0; attempt < MAX_VOICE_ATTEMPTS; attempt++) {
        try {
          const token = await dispatch(fetchVoiceToken()).unwrap();
          return token;
        } catch (rej) {
          const r = (rej ?? {}) as Partial<VoiceTokenRejection>;
          const info = describeVoiceError({
            status: typeof r.status === "number" ? r.status : 0,
            message: r.message,
          });
          dispatch(setDeviceError(info));
          logger.warn(
            `[GlobalVoiceManager] Token fetch failed (attempt ${attempt + 1}/${MAX_VOICE_ATTEMPTS}):`,
            info.code,
            info.message,
          );
          if (!info.retryable || attempt === MAX_VOICE_ATTEMPTS - 1) break;
          await sleep(backoffDelayMs(attempt));
          if (isCancelled()) return null;
        }
      }
      return null;
    },
    [dispatch],
  );

  /** register() with bounded exponential backoff; sets status "error" + reason on final failure. */
  const registerWithRetry = useCallback(
    async (device: Device, isCancelled: () => boolean = () => false) => {
      for (let attempt = 0; attempt < MAX_VOICE_ATTEMPTS; attempt++) {
        if (isCancelled() || !isAvailableRef.current) return;
        if (device.state === Device.State.Registered) return;
        try {
          await device.register();
          return;
        } catch (err) {
          const info = describeVoiceError(err);
          logger.warn(
            `[GlobalVoiceManager] register() failed (attempt ${attempt + 1}/${MAX_VOICE_ATTEMPTS}):`,
            err,
          );
          if (!info.retryable || attempt === MAX_VOICE_ATTEMPTS - 1) {
            dispatch(setDeviceError(info));
            dispatch(setDeviceStatus("error"));
            return;
          }
          await sleep(backoffDelayMs(attempt));
        }
      }
    },
    [dispatch],
  );

  // Keep `busyRef` in sync so the Twilio "incoming" handler (which captures
  // refs, not state) knows whether to reject a concurrent inbound call.
  useEffect(() => {
    busyRef.current = !!activeIncomingCall || !!outboundCall;
  }, [activeIncomingCall, outboundCall]);

  // When an outbound call is dispatched without a client name (e.g. from the dialpad),
  // look up the phone number so the panel shows the real name instead of the raw number.
  useEffect(() => {
    if (!outboundCall || outboundCall.clientName) return;
    const { phone } = outboundCall;
    dispatch(lookupContact(phone))
      .unwrap()
      .then((data) => {
        if (data.found) {
          dispatch(
            resolveOutboundCallName({
              clientName: data.client_name ?? null,
              clientId: data.client_id ?? null,
            }),
          );
        }
      })
      .catch(() => {});
  }, [outboundCall?.phone, dispatch]);

  // Create the Device once per session token.
  useEffect(() => {
    if (!sessionToken) return;

    let device: Device | null = null;
    let cancelled = false;
    const isCancelled = () => cancelled;

    const setup = async () => {
      // Reset any stale DB availability from a previous session/tab before we start.
      reportAvailability(false);
      dispatch(setDeviceStatus("connecting"));

      const token = await fetchToken(isCancelled);
      if (cancelled) return;
      if (!token) {
        logger.error("[GlobalVoiceManager] Failed to fetch voice token");
        dispatch(setDeviceStatus("error"));
        return;
      }

      device = new Device(token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        closeProtection: true,
        maxAverageBitrate: 40000,
        enableImprovedSignalingErrorPrecision: true,
        // Reject inbound calls while the broker is already on another call.
        // Two concurrent WebRTC calls fight over the microphone and the active
        // call's outgoing audio gets muted. The second caller falls through
        // to dial-status → voicemail / other available bankers instead.
        allowIncomingWhileBusy: false,
      } as ConstructorParameters<typeof Device>[1]);
      deviceRef.current = device;

      // Expose the single Device instance for inbound audio + outbound connect().
      setDeviceAudio(device.audio);
      // changes — never before register() / unregister() completes. This prevents
      // the race where DB says available but no Device endpoint is registered yet.
      device.on("registered", () => {
        logger.log("[GlobalVoiceManager] Device registered ✅");
        dispatch(setDeviceStatus("registered"));
        reportAvailability(true);
      });

      device.on("unregistered", () => {
        logger.log("[GlobalVoiceManager] Device unregistered");
        dispatch(setDeviceStatus("idle"));
        reportAvailability(false);
      });

      device.on("error", async (err) => {
        logger.error("[GlobalVoiceManager] Device error:", err);
        const info = describeVoiceError(err);
        const current = device;
        if (!current) return;
        // Mic errors belong to a specific call — VoiceCallPanel shows them.
        // Don't mark the whole Device as broken when it's still registered.
        if (isMicError(info) && current.state === Device.State.Registered) {
          return;
        }
        dispatch(setDeviceError(info));
        if (info.category === "token") {
          const newToken = await fetchToken(isCancelled);
          if (newToken && !cancelled) {
            current.updateToken(newToken);
            if (isAvailableRef.current) registerWithRetry(current, isCancelled);
            return;
          }
        } else if (
          info.retryable &&
          current.state !== Device.State.Registered &&
          isAvailableRef.current
        ) {
          dispatch(setDeviceStatus("connecting"));
          registerWithRetry(current, isCancelled);
          return;
        }
        if (current.state !== Device.State.Registered) {
          dispatch(setDeviceStatus("error"));
        }
      });

      device.on("tokenAboutToExpire", async () => {
        logger.log("[GlobalVoiceManager] Token about to expire — refreshing");
        try {
          const newToken = await fetchToken(isCancelled);
          if (newToken) {
            device?.updateToken(newToken);
          } else {
            logger.error("[GlobalVoiceManager] Token refresh returned null");
          }
        } catch (err) {
          logger.error(
            "[GlobalVoiceManager] tokenAboutToExpire refresh failed:",
            err,
          );
        }
      });

      device.on("tokenExpired", async () => {
        logger.warn("[GlobalVoiceManager] Token expired — refreshing");
        try {
          const newToken = await fetchToken(isCancelled);
          if (newToken) {
            device?.updateToken(newToken);
          } else {
            logger.error(
              "[GlobalVoiceManager] Token refresh returned null after expiry — voice calls may fail",
            );
            dispatch(setDeviceStatus("error"));
          }
        } catch (err) {
          logger.error(
            "[GlobalVoiceManager] tokenExpired refresh failed:",
            err,
          );
          dispatch(setDeviceStatus("error"));
        }
      });

      // ── Incoming call ─────────────────────────────────────────────
      device.on("incoming", (call: Call) => {
        // Guard: if already on/handling a call, reject so the caller falls
        // through to dial-status (→ voicemail or another available banker).
        // Accepting a second call while one is active causes the browser to
        // re-acquire the mic for the new PeerConnection and silently mutes
        // the first call's outgoing audio.
        if (ringingCallRef.current || busyRef.current) {
          logger.warn(
            "[GlobalVoiceManager] Busy — rejecting incoming call so it routes to voicemail/next banker",
          );
          call.reject();
          return;
        }

        const from =
          call.parameters?.From || call.customParameters?.get("from") || "";
        logger.log("[GlobalVoiceManager] Incoming call from:", from);
        ringingCallRef.current = call;
        ringingCallSidRef.current = call.parameters?.CallSid ?? null;
        setRingingPhone(from);
        setRingingClientName(null);
        setRingingClientId(null);
        setRingingCall(call);
        setRingingError(null);

        // Look up the caller's client record by phone number
        if (from) {
          dispatch(lookupContact(from))
            .unwrap()
            .then((data) => {
              if (data.found) {
                setRingingClientName(data.client_name ?? null);
                setRingingClientId(data.client_id ?? null);
              }
            })
            .catch(() => {});
        }

        const clearRinging = () => {
          ringingCallRef.current = null;
          ringingCallSidRef.current = null;
          setRingingCall(null);
          setRingingPhone("");
          setRingingClientName(null);
          setRingingClientId(null);
        };

        call.on("cancel", clearRinging);
        call.on("reject", clearRinging);
        call.on("disconnect", () => {
          ringingCallRef.current = null;
          setActiveIncomingCall(null);
        });
      });

      // ── Register based on current availability preference ─────────
      // Mark ready so the [isAvailable] toggle effect can take over from here.
      deviceReadyRef.current = true;
      if (isAvailableRef.current) {
        registerWithRetry(device, isCancelled);
      } else {
        dispatch(setDeviceStatus("idle"));
      }
    };

    setup();

    return () => {
      cancelled = true;
      deviceReadyRef.current = false;
      device?.removeAllListeners();
      device?.destroy();
      deviceRef.current = null;
      setDeviceAudio(null);
      dispatch(setDeviceStatus("idle"));
      reportAvailability(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, reconnectNonce]);

  // Handle availability toggle.
  // On initial mount this fires too, but deviceReadyRef.current is false then
  // so the device operations are skipped until setup() completes.
  useEffect(() => {
    if (!deviceReadyRef.current || !deviceRef.current) {
      // Setup previously failed (e.g. token error) — going available rebuilds it.
      if (isAvailable && deviceStatusRef.current === "error") {
        dispatch(requestVoiceReconnect());
      }
      return;
    }
    const device = deviceRef.current;

    if (isAvailable) {
      setBannerDismissed(false);
      dispatch(setDeviceStatus("connecting"));
      registerWithRetry(device);
    } else {
      device.unregister().catch(() => {});
      if (ringingCallRef.current) {
        ringingCallRef.current.reject();
        ringingCallRef.current = null;
        setRingingCall(null);
        setRingingPhone("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable]);

  // Subscribe to Ably voice:incoming so we hear when another broker accepts.
  // When that happens, immediately dismiss this broker's ringing notification
  // without waiting for the Twilio SDK cancel event (which may lag under load).
  useEffect(() => {
    if (!sessionToken) return;
    let channel: AblyLib.RealtimeChannel | null = null;

    const connect = async () => {
      try {
        const ablyClient = await getSharedAblyClient(sessionToken);
        if (!ablyClient) return;

        channel = ablyClient.channels.get("voice:incoming");
        await channel.subscribe("call-answered", (msg) => {
          const { callSid } = (msg.data ?? {}) as { callSid?: string };
          // Only act if we're currently showing a ringing notification AND
          // the announced SID matches our ringing call (or no SID to match against).
          if (
            ringingCallRef.current &&
            (!callSid || ringingCallSidRef.current === callSid)
          ) {
            logger.log(
              "[GlobalVoiceManager] Ably: call answered by another broker — dismissing ringing UI",
            );
            // Tell the Twilio SDK to close this leg so audio resources are freed.
            ringingCallRef.current.reject();
            ringingCallRef.current = null;
            ringingCallSidRef.current = null;
            setRingingCall(null);
            setRingingPhone("");
            setRingingClientName(null);
            setRingingClientId(null);
          }
        });
      } catch {
        // Graceful degradation — the Twilio SDK cancel event is the fallback
      }
    };

    connect();

    return () => {
      // Detach only our subscription — do NOT close the shared singleton
      channel?.unsubscribe("call-answered");
    };
  }, [sessionToken]);

  const handleAccept = async () => {
    if (!ringingCall || accepting) return;
    const call = ringingCall;
    setAccepting(true);
    setRingingError(null);
    // Preflight the mic so a blocked/busy mic shows guidance instead of
    // accepting a call that immediately fails with 31401/31402.
    const preflight = await preflightMicrophone(getSavedMicId());
    setAccepting(false);
    if (!preflight.ok) {
      logger.warn(
        "[GlobalVoiceManager] Mic preflight failed:",
        preflight.error,
      );
      setRingingError(preflight.error);
      return;
    }
    // Caller may have hung up while we were checking the mic.
    if (ringingCallRef.current !== call) return;
    await applyInputDevice(deviceRef.current?.audio, preflight.deviceId);
    // Grab SID before clearing refs
    const sid = ringingCallSidRef.current;
    // Pass rtcConstraints so echo-cancellation / noise-suppression / AGC apply
    // to the actual WebRTC audio track the recipient hears, not just the meter.
    call.accept({
      rtcConstraints: {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      },
    });
    setActiveIncomingCall(call);
    ringingCallRef.current = null;
    ringingCallSidRef.current = null;
    setRingingCall(null);
    // Immediately notify all other online brokers via Ably to dismiss their ringing UI
    if (sid) dispatch(notifyCallAnswered(sid));
  };

  const handleDecline = () => {
    if (!ringingCall) return;
    ringingCall.reject();
    ringingCallRef.current = null;
    setRingingCall(null);
    setRingingError(null);
    setRingingPhone("");
    setRingingClientName(null);
    setRingingClientId(null);
  };

  const handleCloseActive = () => {
    setActiveIncomingCall(null);
    setRingingPhone("");
    setRingingClientName(null);
    setRingingClientId(null);
  };

  if (!sessionToken) return null;

  const showStatusBanner =
    !bannerDismissed && !ringingCall && !activeIncomingCall;

  return (
    <VoiceDeviceProvider deviceRef={deviceRef}>
      {/* Ringing notification */}
      {ringingCall && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-green-300 shadow-2xl rounded-2xl p-4 w-80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-full">
                  <PhoneIncoming className="h-5 w-5 text-green-600" />
                </div>
                <span className="absolute inset-0 rounded-full animate-ping bg-green-300 opacity-50" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Incoming Call
                </p>
                {ringingClientName ? (
                  <>
                    <p className="text-sm font-medium text-green-700 truncate">
                      {ringingClientName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ringingPhone || "Unknown number"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">
                    {ringingPhone || "Unknown number"}
                  </p>
                )}
              </div>
            </div>
            {ringingError && (
              <VoiceErrorAlert
                error={ringingError}
                defaultExpanded
                onRetry={handleAccept}
                retryLabel="Check mic & accept"
              />
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm gap-1.5"
                onClick={handleAccept}
                disabled={accepting}
              >
                <Phone className="h-4 w-4" />
                {accepting ? "Checking mic…" : "Accept"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-9 text-sm gap-1.5"
                onClick={handleDecline}
              >
                <PhoneOff className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offline-for-calls / device error status — never silently off */}
      {showStatusBanner && !isAvailable && (
        <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur pl-3 pr-1.5 py-1.5 shadow-lg sm:w-auto">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
            </span>
            <PhoneOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground truncate">
              You're offline for calls
            </span>
            <Button
              size="sm"
              className="h-7 rounded-full px-3 text-xs bg-green-600 hover:bg-green-700 text-white ml-auto"
              onClick={() => dispatch(setVoiceAvailable(true))}
            >
              Go available
            </Button>
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {showStatusBanner &&
        isAvailable &&
        deviceStatus === "error" &&
        deviceError && (
          <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 sm:w-80 z-40 shadow-xl rounded-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
            <VoiceErrorAlert
              error={deviceError}
              onRetry={() => dispatch(requestVoiceReconnect())}
              retryLabel="Reconnect"
              onDismiss={() => setBannerDismissed(true)}
            />
          </div>
        )}

      {/* Active call panel after accepting */}
      {activeIncomingCall && (
        <div className="fixed bottom-6 left-6 z-50 w-80 animate-in slide-in-from-bottom-4 duration-300">
          <VoiceCallPanel
            phone={ringingPhone || "Unknown"}
            clientName={ringingClientName || ringingPhone || "Client"}
            clientId={ringingClientId ?? undefined}
            activeCall={activeIncomingCall}
            direction="inbound"
            deviceAudio={deviceAudio}
            onClose={handleCloseActive}
          />
        </div>
      )}

      {/* Persistent outbound call panel — rendered here so it survives page navigation */}
      {outboundCall && (
        <div className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <VoiceCallPanel
            phone={outboundCall.phone}
            clientName={outboundCall.clientName}
            clientId={outboundCall.clientId}
            applicationId={outboundCall.applicationId}
            onClose={() => dispatch(endOutboundCall())}
          />
        </div>
      )}
    </VoiceDeviceProvider>
  );
};

export default GlobalVoiceManager;
