import React, { useState, useEffect, useRef, useCallback } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import axios from "axios";
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  Mic,
  MicOff,
  Volume2,
  Volume1,
  VolumeX,
  Settings2,
  X,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useAppSelector } from "@/store/hooks";
import type { VoiceLogRequest } from "@shared/api";

export type CallState =
  | "idle"
  | "initializing"
  | "connecting"
  | "ringing"
  | "in-call"
  | "ending"
  | "ended"
  | "error";

interface VoiceCallPanelProps {
  /** Phone number to call (E.164 preferred) */
  phone: string;
  /** Display name shown in the panel */
  clientName?: string | null;
  clientId?: number | null;
  applicationId?: number | null;
  onClose: () => void;
  /**
   * When provided, the panel manages an already-accepted incoming call
   * instead of dialling a new outbound call.
   */
  activeCall?: Call | null;
  /** Direction to record in the call log. Defaults to "outbound". */
  direction?: "inbound" | "outbound";
  /**
   * The Twilio Device's audio helper — required for inbound calls where the
   * Device lives in GlobalVoiceManager. Outbound calls use their own device.
   */
  deviceAudio?: Device["audio"] | null;
}

const VoiceCallPanel: React.FC<VoiceCallPanelProps> = ({
  phone,
  clientName,
  clientId,
  applicationId,
  onClose,
  activeCall,
  direction = "outbound",
  deviceAudio,
}) => {
  const { sessionToken } = useAppSelector((s) => s.brokerAuth);

  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [callState, setCallState] = useState<CallState>(
    activeCall ? "in-call" : "idle",
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);

  // Device selection
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState("default");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("default");
  const [micLevel, setMicLevel] = useState(0); // 0–100 for live mic meter
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const supportsSinkId =
    typeof (document.createElement("audio") as any).setSinkId === "function";

  const formattedDuration = `${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(duration % 60).padStart(2, "0")}`;

  // Live microphone level meter — shows the broker whether their mic is picking up audio.
  // Uses the Web Audio API to read RMS volume from the active input stream.
  const stopMicMeter = useCallback(() => {
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    micAnalyserRef.current = null;
    // Stop all tracks so the browser releases the OS mic indicator
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    micAudioCtxRef.current?.close();
    micAudioCtxRef.current = null;
    setMicLevel(0);
  }, []);

  const startMicMeter = useCallback(
    async (deviceId: string) => {
      // Always stop the previous meter first so we don't leak streams
      stopMicMeter();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio:
            deviceId !== "default" ? { deviceId: { exact: deviceId } } : true,
        });
        micStreamRef.current = stream;
        const ctx = new AudioContext();
        micAudioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        micAnalyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const rms = Math.sqrt(
            data.reduce((s, v) => s + v * v, 0) / data.length,
          );
          setMicLevel(Math.min(100, Math.round((rms / 128) * 100)));
          micRafRef.current = requestAnimationFrame(tick);
        };
        micRafRef.current = requestAnimationFrame(tick);
      } catch {
        // Mic meter is cosmetic — don't block the call
      }
    },
    [stopMicMeter],
  );
  const getAudioHelper = useCallback(
    () => deviceAudio ?? deviceRef.current?.audio ?? null,
    [deviceAudio],
  );

  // Enumerate available audio devices and keep the list live while the call is active.
  // Bluetooth devices (AirPods, etc.) fire a 'devicechange' event when they connect —
  // we re-enumerate immediately so they appear in the picker without a page reload.
  // If the OS switches the default input (e.g. AirPods just connected and became the
  // new default), we also transparently re-apply the currently selected device so the
  // Twilio stream stays on whatever the user picked.
  useEffect(() => {
    if (callState !== "in-call") return;

    const enumerate = () => {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          setMicDevices(devices.filter((d) => d.kind === "audioinput"));
          setSpeakerDevices(devices.filter((d) => d.kind === "audiooutput"));
        })
        .catch(() => {});
    };

    const handleDeviceChange = () => {
      enumerate();
      // Re-apply the selected input device so Twilio doesn't silently stay
      // on the old one after the OS switches defaults (common with AirPods).
      const audio = getAudioHelper();
      if (audio) {
        audio.setInputDevice(selectedMicId).catch(() => {});
      }
    };

    enumerate();
    startMicMeter(selectedMicId);
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      stopMicMeter();
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
    };
  }, [callState, getAudioHelper, selectedMicId, startMicMeter, stopMicMeter]);

  const handleMicChange = useCallback(
    async (deviceId: string) => {
      setSelectedMicId(deviceId);
      const audio = getAudioHelper();
      if (!audio) return;
      try {
        await audio.setInputDevice(deviceId);
        startMicMeter(deviceId);
      } catch (e) {
        logger.error("[VoiceCallPanel] Failed to set input device:", e);
      }
    },
    [getAudioHelper, startMicMeter],
  );

  const handleSpeakerChange = useCallback(
    async (deviceId: string) => {
      setSelectedSpeakerId(deviceId);
      const audio = getAudioHelper();
      if (!audio) return;
      try {
        await audio.speakerDevices.set([deviceId]);
      } catch (e) {
        logger.error("[VoiceCallPanel] Failed to set speaker device:", e);
      }
    },
    [getAudioHelper],
  );

  // Log the call to the server after it ends
  const logCall = useCallback(
    async (status: string, durationSec: number, sid?: string | null) => {
      try {
        const payload: VoiceLogRequest = {
          phone,
          duration: durationSec,
          call_status: status,
          call_sid: sid ?? undefined,
          client_id: clientId ?? undefined,
          application_id: applicationId ?? undefined,
          client_name: clientName ?? undefined,
          direction,
        };
        await axios.post("/api/voice/log", payload, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      } catch (err) {
        logger.error("[VoiceCallPanel] Failed to log call:", err);
      }
    },
    [phone, clientId, applicationId, clientName, direction, sessionToken],
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, [stopTimer]);

  const cleanupDevice = useCallback(() => {
    stopTimer();
    stopMicMeter();
    if (callRef.current) {
      callRef.current.removeAllListeners();
      callRef.current = null;
    }
    if (deviceRef.current) {
      deviceRef.current.removeAllListeners();
      deviceRef.current.destroy();
      deviceRef.current = null;
    }
  }, [stopTimer, stopMicMeter]);

  const handleHangUp = useCallback(
    (status = "completed") => {
      setCallState("ending");
      stopTimer();
      const sid = callSid;
      const dur = duration;
      if (callRef.current) {
        callRef.current.disconnect();
      }
      logCall(status, dur, sid).finally(() => {
        cleanupDevice();
        setCallState("ended");
      });
    },
    [callSid, duration, logCall, stopTimer, cleanupDevice],
  );

  const initiateCall = useCallback(async () => {
    setCallState("initializing");
    setErrorMsg(null);

    try {
      // 1. Fetch Access Token
      const { data } = await axios.post<{ success: boolean; token: string }>(
        "/api/voice/token",
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      if (!data.success || !data.token) throw new Error("Token fetch failed");

      // 2. Create Device with HD audio settings
      const device = new Device(data.token, {
        logLevel: 1,
        // Opus first for HD wideband audio (~16 kHz), PCMU as PSTN fallback
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        // Keep the WebSocket alive during brief network drops (mobile switching
        // from WiFi to cellular is the main cause of "low quality" reports)
        closeProtection: true,
        // Opus can use up to 40 kbps for wideband voice — big improvement over
        // the 8 kbps PCMU default on poor connections
        maxAverageBitrate: 40000,
        // Surface precise error codes in the error handler so we can show
        // actionable messages (e.g. mic blocked vs network error)
        enableImprovedSignalingErrorPrecision: true,
      });
      deviceRef.current = device;

      device.on("error", (err) => {
        logger.error("[VoiceCallPanel] Device error:", err);
        setErrorMsg(err.message || "Device error");
        setCallState("error");
        cleanupDevice();
      });

      await device.register();

      setCallState("connecting");

      // 3. Place call
      const call = await device.connect({
        params: { To: phone },
      });
      callRef.current = call;

      call.on("ringing", () => setCallState("ringing"));

      call.on("accept", async (c: Call) => {
        setCallSid(c.parameters?.CallSid ?? null);
        setCallState("in-call");
        startTimer();

        // Immediately enumerate and apply the best available audio devices.
        // Without this, Twilio may use a low-quality or wrong device (e.g. the
        // built-in laptop mic instead of a headset that was already plugged in).
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const mics = devices.filter((d) => d.kind === "audioinput");
          const speakers = devices.filter((d) => d.kind === "audiooutput");
          setMicDevices(mics);
          setSpeakerDevices(speakers);

          const audio = deviceRef.current?.audio ?? null;
          if (audio) {
            // Prefer a headset/external mic; fall back to "default"
            const headsetMic = mics.find((d) =>
              /headset|headphone|airpod|bluetooth|external/i.test(d.label),
            );
            const micId = headsetMic?.deviceId ?? "default";
            setSelectedMicId(micId);
            await audio.setInputDevice(micId).catch(() => {});

            // Apply speaker too (only on browsers that support setSinkId)
            if (supportsSinkId) {
              const headsetSpeaker = speakers.find((d) =>
                /headset|headphone|airpod|bluetooth|external/i.test(d.label),
              );
              const speakerId = headsetSpeaker?.deviceId ?? "default";
              setSelectedSpeakerId(speakerId);
              await audio.speakerDevices.set([speakerId]).catch(() => {});
            }
          }
        } catch {
          // Non-fatal — user can manually pick devices in the audio settings
        }
      });

      call.on("disconnect", () => {
        stopTimer();
        setCallState("ended");
        logCall("completed", duration, callSid).finally(cleanupDevice);
      });

      call.on("cancel", () => {
        stopTimer();
        setCallState("ended");
        logCall("no-answer", duration, callSid).finally(cleanupDevice);
      });

      call.on("error", (err: Error) => {
        logger.error("[VoiceCallPanel] Call error:", err);
        setErrorMsg(err.message || "Call error");
        stopTimer();
        setCallState("error");
        logCall("failed", duration, callSid).finally(cleanupDevice);
      });
    } catch (err: any) {
      logger.error("[VoiceCallPanel] Failed to initiate call:", err);
      setErrorMsg(
        err?.response?.data?.error || err?.message || "Failed to start call",
      );
      setCallState("error");
      cleanupDevice();
    }
  }, [
    sessionToken,
    phone,
    startTimer,
    stopTimer,
    cleanupDevice,
    logCall,
    duration,
    callSid,
  ]);

  // Auto-start call when component mounts (outbound only)
  useEffect(() => {
    if (activeCall) {
      // Incoming call already accepted — wire up event listeners & start timer
      callRef.current = activeCall;
      setCallSid(activeCall.parameters?.CallSid ?? null);
      startTimer();

      activeCall.on("disconnect", () => {
        stopTimer();
        setCallState("ended");
        logCall("completed", 0, activeCall.parameters?.CallSid).finally(
          cleanupDevice,
        );
      });

      activeCall.on("cancel", () => {
        stopTimer();
        setCallState("ended");
        logCall("no-answer", 0, activeCall.parameters?.CallSid).finally(
          cleanupDevice,
        );
      });

      activeCall.on("error", (err: Error) => {
        logger.error("[VoiceCallPanel] Incoming call error:", err);
        setErrorMsg(err.message || "Call error");
        stopTimer();
        setCallState("error");
        logCall("failed", 0, activeCall.parameters?.CallSid).finally(
          cleanupDevice,
        );
      });

      return () => {
        stopTimer();
      };
    }

    initiateCall();
    return () => {
      cleanupDevice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-close panel 5 seconds after call ends
  useEffect(() => {
    if (callState !== "ended") return;
    setCloseCountdown(5);
    const interval = setInterval(() => {
      setCloseCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    const timeout = setTimeout(() => {
      onClose();
    }, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [callState, onClose]);

  const toggleMute = () => {
    if (callRef.current) {
      const newMuted = !isMuted;
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  };

  const getStateLabel = (): string => {
    switch (callState) {
      case "initializing":
        return "Setting up…";
      case "connecting":
        return "Connecting…";
      case "ringing":
        return "Ringing…";
      case "in-call":
        return formattedDuration;
      case "ending":
        return "Ending call…";
      case "ended":
        return "Call ended";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  const stateColor: Record<CallState, string> = {
    idle: "bg-muted",
    initializing: "bg-amber-50 border-amber-200",
    connecting: "bg-amber-50 border-amber-200",
    ringing: "bg-amber-50 border-amber-200",
    "in-call": "bg-green-50 border-green-200",
    ending: "bg-muted border-border",
    ended: "bg-muted border-border",
    error: "bg-red-50 border-red-200",
  };

  return (
    <div
      className={cn(
        "border rounded-xl p-4 space-y-4 transition-all duration-300",
        stateColor[callState],
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-full",
              callState === "in-call"
                ? "bg-green-100"
                : callState === "error"
                  ? "bg-red-100"
                  : "bg-primary/10",
            )}
          >
            {callState === "error" ? (
              <PhoneMissed className="h-4 w-4 text-red-500" />
            ) : callState === "ended" ? (
              <PhoneOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Phone
                className={cn(
                  "h-4 w-4",
                  callState === "in-call"
                    ? "text-green-600 animate-pulse"
                    : "text-primary",
                )}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {clientName || phone}
            </p>
            <p className="text-xs text-muted-foreground">{phone}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            if (
              callState === "in-call" ||
              callState === "ringing" ||
              callState === "connecting"
            ) {
              handleHangUp();
            } else {
              onClose();
            }
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Status label */}
      <div className="flex items-center justify-center py-2">
        <Badge
          variant="outline"
          className={cn(
            "text-sm px-4 py-1 font-mono",
            callState === "in-call" &&
              "bg-green-100 text-green-700 border-green-300",
            callState === "error" && "bg-red-100 text-red-600 border-red-200",
            (callState === "connecting" || callState === "ringing") &&
              "bg-amber-100 text-amber-700 border-amber-300",
          )}
        >
          {getStateLabel()}
        </Badge>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-600 text-center bg-red-50 rounded px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* Controls */}
      {(callState === "in-call" ||
        callState === "ringing" ||
        callState === "connecting") && (
        <div className="flex items-center justify-center gap-3">
          {/* Mute */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full transition-colors",
              isMuted && "bg-amber-100 border-amber-300 text-amber-700",
            )}
            onClick={toggleMute}
            disabled={callState !== "in-call"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Hang Up */}
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full shadow-md"
            onClick={() => handleHangUp()}
            title="Hang up"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Audio device settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full transition-colors relative"
                title="Audio settings"
                disabled={callState !== "in-call"}
              >
                <Settings2 className="h-4 w-4" />
                {/* Green dot when mic is picking up sound */}
                {micLevel > 5 && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-72 space-y-4 p-4"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Audio Settings
              </p>

              {/* Microphone */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5" />
                  Microphone
                </Label>
                <Select
                  value={selectedMicId}
                  onValueChange={handleMicChange}
                  disabled={micDevices.length === 0}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    {micDevices.length === 0 ? (
                      <SelectItem value="default">Default</SelectItem>
                    ) : (
                      micDevices.map((d) => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {/* Live mic level bar */}
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {micLevel > 5 ? (
                      <>
                        <Mic className="h-2.5 w-2.5 text-green-500" /> Mic
                        active
                      </>
                    ) : (
                      <>
                        <MicOff className="h-2.5 w-2.5 text-muted-foreground" />{" "}
                        Speak to test
                      </>
                    )}
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-75",
                        micLevel > 60
                          ? "bg-green-500"
                          : micLevel > 20
                            ? "bg-green-400"
                            : "bg-muted-foreground/30",
                      )}
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" />
                  Speaker
                </Label>
                {supportsSinkId ? (
                  <Select
                    value={selectedSpeakerId}
                    onValueChange={handleSpeakerChange}
                    disabled={speakerDevices.length === 0}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {speakerDevices.length === 0 ? (
                        <SelectItem value="default">Default</SelectItem>
                      ) : (
                        speakerDevices.map((d) => (
                          <SelectItem key={d.deviceId} value={d.deviceId}>
                            {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Speaker selection not supported in this browser.
                  </p>
                )}
              </div>

              {/* Quality hint */}
              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 border-t pt-2">
                <Radio className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                For best quality, use a headset. Calls use HD Opus audio when
                both sides support it.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Ended / Error actions */}
      {(callState === "ended" || callState === "error") && (
        <div className="flex justify-center gap-2">
          {callState === "error" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCallState("idle");
                setErrorMsg(null);
                setDuration(0);
                initiateCall();
              }}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            {callState === "ended" && closeCountdown !== null
              ? `Close (${closeCountdown})`
              : "Close"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceCallPanel;
