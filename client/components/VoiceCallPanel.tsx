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
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

const VoiceCallPanel: React.FC<VoiceCallPanelProps> = ({
  phone,
  clientName,
  clientId,
  applicationId,
  onClose,
  activeCall,
  direction = "outbound",
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
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);

  const formattedDuration = `${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(duration % 60).padStart(2, "0")}`;

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
    if (callRef.current) {
      callRef.current.removeAllListeners();
      callRef.current = null;
    }
    if (deviceRef.current) {
      deviceRef.current.removeAllListeners();
      deviceRef.current.destroy();
      deviceRef.current = null;
    }
  }, [stopTimer]);

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

      // 2. Create Device
      const device = new Device(data.token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
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

      call.on("accept", (c: Call) => {
        setCallSid(c.parameters?.CallSid ?? null);
        setCallState("in-call");
        startTimer();
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

          {/* Speaker placeholder (visual only — browser controls audio output) */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full transition-colors",
              isSpeakerOff && "bg-muted text-muted-foreground",
            )}
            onClick={() => setIsSpeakerOff((v) => !v)}
            title="Speaker"
            disabled
          >
            {isSpeakerOff ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
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
