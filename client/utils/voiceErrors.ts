/**
 * Voice (Twilio Voice SDK + getUserMedia) error helpers.
 *
 * - `describeVoiceError` maps Twilio error codes, DOMException names and HTTP
 *   statuses to a serializable, human-friendly `VoiceErrorInfo` with
 *   actionable steps (safe to store in Redux).
 * - `preflightMicrophone` opens the mic, immediately releases it and reports a
 *   friendly error instead of letting a doomed call start.
 * - `applyInputDevice` + saved-mic helpers fall back to the system default
 *   when a remembered deviceId no longer exists.
 */

export type VoiceErrorCategory =
  | "mic-permission"
  | "mic-unavailable"
  | "mic-not-found"
  | "media"
  | "token"
  | "quota"
  | "service"
  | "connection"
  | "unknown";

export interface VoiceErrorInfo {
  /** Twilio numeric code, HTTP status, or DOMException name. */
  code: string | number | null;
  category: VoiceErrorCategory;
  title: string;
  message: string;
  steps: string[];
  /** A plain retry has a reasonable chance of succeeding. */
  retryable: boolean;
  /** Offer the "Choose microphone" path. */
  showMicPicker: boolean;
}

const SAVED_MIC_KEY = "voice_mic_device_id";

export const isMacOS = (): boolean =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/i.test(
    (navigator as any).userAgentData?.platform || navigator.platform || "",
  );

const browserName = (): string => {
  if (typeof navigator === "undefined") return "your browser";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/Chrome\//.test(ua)) return "Google Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "your browser";
};

const permissionSteps = (): string[] => {
  const browser = browserName();
  const steps = [
    `Click the lock/site-settings icon in the address bar and set Microphone to "Allow".`,
  ];
  if (isMacOS()) {
    steps.push(
      `Open System Settings → Privacy & Security → Microphone and enable ${browser}.`,
      `Quit and reopen ${browser} after changing the macOS setting.`,
    );
  } else {
    steps.push(
      "Check your operating system's privacy settings allow the browser to use the microphone.",
    );
  }
  steps.push("Reload this page and try again.");
  return steps;
};

const busyMicSteps = (): string[] => {
  const steps = [
    "Close apps that may be holding the microphone (Zoom, Teams, Meet, FaceTime, other browser tabs).",
    "Choose a different microphone below, or unplug and reconnect your headset.",
  ];
  if (isMacOS()) {
    steps.push(
      `Confirm System Settings → Privacy & Security → Microphone has ${browserName()} enabled.`,
    );
  }
  steps.push("Reload the page and try again.");
  return steps;
};

const make = (
  code: VoiceErrorInfo["code"],
  category: VoiceErrorCategory,
  title: string,
  message: string,
  steps: string[],
  retryable: boolean,
  showMicPicker = false,
): VoiceErrorInfo => ({
  code,
  category,
  title,
  message,
  steps,
  retryable,
  showMicPicker,
});

const fromTwilioCode = (
  code: number,
  rawMessage?: string,
): VoiceErrorInfo | null => {
  switch (code) {
    case 31401:
    case 31208:
      return make(
        code,
        "mic-permission",
        "Microphone access is blocked",
        "The browser isn't allowed to use your microphone, so calls can't connect.",
        permissionSteps(),
        true,
        true,
      );
    case 31402:
      return make(
        code,
        "mic-unavailable",
        "Couldn't start your microphone",
        "Your microphone exists but couldn't be opened. It's usually blocked by macOS privacy settings or in use by another app.",
        busyMicSteps(),
        true,
        true,
      );
    case 31201:
    case 31203:
    case 31204:
    case 31205:
    case 31206:
    case 31207:
      return make(
        code,
        "media",
        "Audio connection failed",
        "We couldn't establish the audio stream for this call.",
        [
          "Check your internet connection or try another network.",
          "Disable VPN / firewall rules that block WebRTC (UDP) traffic.",
          "Retry the call.",
        ],
        true,
        code === 31201,
      );
    case 20101:
    case 20104:
    case 20105:
    case 20103:
    case 31202:
      return make(
        code,
        "token",
        "Voice session expired",
        "Your voice session needs to be renewed.",
        ["Click Reconnect. If it keeps happening, sign out and back in."],
        true,
      );
    case 31005:
    case 31009:
    case 31000:
    case 53000:
    case 53001:
    case 31003:
      return make(
        code,
        "connection",
        "Lost connection to the voice service",
        "We couldn't reach the calling service.",
        [
          "Check your internet connection.",
          "Disable VPN or proxy and try again.",
          "Click Reconnect.",
        ],
        true,
      );
    case 31486:
      return make(
        code,
        "unknown",
        "Line busy",
        "The number you called is busy.",
        ["Try again later."],
        true,
      );
    case 31480:
      return make(
        code,
        "unknown",
        "No answer",
        "The call wasn't answered.",
        ["Try again later."],
        true,
      );
    default:
      return rawMessage
        ? make(
            code,
            "unknown",
            "Call error",
            rawMessage,
            ["Retry the call. If it persists, reload the page."],
            true,
          )
        : null;
  }
};

const fromDomName = (name: string): VoiceErrorInfo | null => {
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return { ...fromTwilioCode(31401)!, code: name };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { ...fromTwilioCode(31402)!, code: name };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return make(
        name,
        "mic-not-found",
        "No microphone found",
        "The selected microphone isn't connected.",
        [
          "Plug in or turn on your headset/microphone.",
          "Choose another microphone below.",
          "Reload the page and try again.",
        ],
        true,
        true,
      );
    default:
      return null;
  }
};

const fromHttpStatus = (
  status: number,
  serverMessage?: string,
): VoiceErrorInfo | null => {
  if (status === 402) {
    return make(
      402,
      "quota",
      "Calling is paused for billing",
      serverMessage ||
        "Voice minutes quota exceeded or a billing action is required.",
      ["Ask an account owner to review Billing, then click Reconnect."],
      false,
    );
  }
  if (status === 503) {
    return make(
      503,
      "service",
      "Calling isn't configured yet",
      serverMessage || "The voice service is temporarily unavailable.",
      [
        "Wait a minute and click Reconnect.",
        "If it persists, an admin should check the voice/Twilio settings.",
      ],
      true,
    );
  }
  if (status === 401 || status === 403) {
    return make(
      status,
      "token",
      "Not authorized for calls",
      serverMessage || "Your session can't use calling right now.",
      ["Sign out and back in, then try again."],
      false,
    );
  }
  if (status >= 500 || status === 0) {
    return make(
      status,
      "connection",
      "Voice service unreachable",
      serverMessage || "We couldn't get a voice session from the server.",
      ["Check your connection and click Reconnect."],
      true,
    );
  }
  return null;
};

/** Normalize any thrown value (TwilioError, DOMException, axios payload) into a VoiceErrorInfo. */
export function describeVoiceError(err: unknown): VoiceErrorInfo {
  const e = (err ?? {}) as {
    code?: unknown;
    name?: string;
    message?: string;
    status?: number;
    originalError?: { name?: string };
  };

  if (typeof e.status === "number") {
    const http = fromHttpStatus(e.status, e.message);
    if (http) return http;
  }
  if (typeof e.code === "number") {
    // Twilio sometimes wraps the underlying DOMException — prefer it for mic errors.
    const inner = e.originalError?.name
      ? fromDomName(e.originalError.name)
      : null;
    if (inner && (e.code === 31402 || e.code === 31401 || e.code === 31208)) {
      return { ...inner, code: e.code };
    }
    const tw = fromTwilioCode(e.code, e.message);
    if (tw) return tw;
  }
  if (e.name) {
    const dom = fromDomName(e.name);
    if (dom) return dom;
  }
  return make(
    null,
    "unknown",
    "Something went wrong",
    e.message || "The call couldn't be completed.",
    ["Retry. If it keeps happening, reload the page."],
    true,
  );
}

export const isMicError = (info: VoiceErrorInfo | null | undefined): boolean =>
  !!info &&
  (info.category === "mic-permission" ||
    info.category === "mic-unavailable" ||
    info.category === "mic-not-found");

// ── Saved microphone ─────────────────────────────────────────────────────────

export function getSavedMicId(): string {
  try {
    return localStorage.getItem(SAVED_MIC_KEY) || "default";
  } catch {
    return "default";
  }
}

export function saveMicId(deviceId: string): void {
  try {
    if (!deviceId || deviceId === "default") {
      localStorage.removeItem(SAVED_MIC_KEY);
    } else {
      localStorage.setItem(SAVED_MIC_KEY, deviceId);
    }
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export const clearSavedMicId = (): void => saveMicId("default");

/** Returns `deviceId` if present in `devices`, else "default" (and clears the saved id). */
export function resolveMicId(
  deviceId: string,
  devices: MediaDeviceInfo[],
): string {
  if (!deviceId || deviceId === "default") return "default";
  const inputs = devices.filter((d) => d.kind === "audioinput");
  // Labels/ids are empty before permission — can't validate yet, keep it.
  if (inputs.length === 0 || inputs.every((d) => !d.deviceId)) return deviceId;
  if (inputs.some((d) => d.deviceId === deviceId)) return deviceId;
  clearSavedMicId();
  return "default";
}

export const micConstraints = (deviceId: string): MediaTrackConstraints => ({
  ...(deviceId && deviceId !== "default"
    ? { deviceId: { exact: deviceId } }
    : {}),
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
});

// ── Preflight ────────────────────────────────────────────────────────────────

export interface MicPreflightResult {
  ok: boolean;
  /** Device that worked ("default" after a fallback). */
  deviceId: string;
  fellBack: boolean;
  /** Set when ok === false. */
  error: VoiceErrorInfo | null;
}

const pfFail = (
  deviceId: string,
  error: VoiceErrorInfo,
): MicPreflightResult => ({
  ok: false,
  deviceId,
  fellBack: false,
  error,
});

/**
 * Open the microphone and release it immediately. Run right before
 * `device.connect()` / `call.accept()` so mic failures surface as a friendly
 * message instead of Twilio 31401/31402 mid-call. A stale/missing `deviceId`
 * falls back to the system default and clears the saved selection.
 */
export async function preflightMicrophone(
  deviceId = "default",
): Promise<MicPreflightResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return pfFail(
      deviceId,
      make(
        "unsupported",
        "mic-unavailable",
        "Calling isn't supported here",
        "This browser can't access a microphone (an HTTPS page and a modern browser are required).",
        ["Use the latest Chrome, Edge, Safari or Firefox over HTTPS."],
        false,
      ),
    );
  }
  const attempt = async (id: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: micConstraints(id),
    });
    stream.getTracks().forEach((t) => t.stop());
  };
  try {
    await attempt(deviceId);
    return { ok: true, deviceId, fellBack: false, error: null };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    const stale = name === "OverconstrainedError" || name === "NotFoundError";
    if (deviceId !== "default" && stale) {
      clearSavedMicId();
      try {
        await attempt("default");
        return { ok: true, deviceId: "default", fellBack: true, error: null };
      } catch (err2) {
        return pfFail("default", describeVoiceError(err2));
      }
    }
    return pfFail(deviceId, describeVoiceError(err));
  }
}

/** Minimal shape of Twilio's AudioHelper we rely on. */
interface InputDeviceSetter {
  setInputDevice: (deviceId: string) => Promise<void>;
}

/**
 * Apply an input device on Twilio's AudioHelper, falling back to "default"
 * (and clearing the saved id) if the requested device can't be used.
 * Returns the deviceId actually applied, or null if both failed.
 */
export async function applyInputDevice(
  audio: InputDeviceSetter | null | undefined,
  deviceId: string,
): Promise<string | null> {
  if (!audio) return null;
  try {
    await audio.setInputDevice(deviceId || "default");
    return deviceId || "default";
  } catch {
    if (deviceId && deviceId !== "default") {
      clearSavedMicId();
      try {
        await audio.setInputDevice("default");
        return "default";
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Bounded exponential backoff with jitter: 1s, 2s, 4s, 8s … capped. */
export const backoffDelayMs = (attempt: number, baseMs = 1000, maxMs = 15000) =>
  Math.min(maxMs, baseMs * 2 ** attempt) + Math.floor(Math.random() * 250);
