import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  applyInputDevice,
  backoffDelayMs,
  describeVoiceError,
  isMicError,
  resolveMicId,
} from "./voiceErrors";

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => (store[k] = v),
    removeItem: (k: string) => delete store[k],
  });
});

describe("describeVoiceError", () => {
  it("maps Twilio 31402 to a mic-unavailable error with mic picker", () => {
    const info = describeVoiceError({
      code: 31402,
      message: "AcquisitionFailedError",
    });
    expect(info.category).toBe("mic-unavailable");
    expect(info.showMicPicker).toBe(true);
    expect(isMicError(info)).toBe(true);
  });
  it("maps 31401 / NotAllowedError to permission", () => {
    expect(describeVoiceError({ code: 31401 }).category).toBe("mic-permission");
    expect(describeVoiceError({ name: "NotAllowedError" }).category).toBe(
      "mic-permission",
    );
  });
  it("maps token, connection and HTTP statuses", () => {
    expect(describeVoiceError({ code: 20104 }).category).toBe("token");
    expect(describeVoiceError({ code: 31005 }).category).toBe("connection");
    const quota = describeVoiceError({ status: 402 });
    expect(quota.category).toBe("quota");
    expect(quota.retryable).toBe(false);
    expect(describeVoiceError({ status: 503 }).category).toBe("service");
  });
  it("falls back to unknown with raw message", () => {
    const info = describeVoiceError(new Error("boom"));
    expect(info.category).toBe("unknown");
    expect(info.message).toBe("boom");
    expect(describeVoiceError(undefined).category).toBe("unknown");
  });
});

describe("mic device helpers", () => {
  const dev = (id: string) =>
    ({ deviceId: id, kind: "audioinput" }) as MediaDeviceInfo;
  it("resolveMicId keeps present ids and clears stale ones", () => {
    store.voice_mic_device_id = "gone";
    expect(resolveMicId("a", [dev("a")])).toBe("a");
    expect(resolveMicId("gone", [dev("a")])).toBe("default");
    expect(store.voice_mic_device_id).toBeUndefined();
  });
  it("applyInputDevice falls back to default", async () => {
    const setInputDevice = vi.fn(async (id: string) => {
      if (id !== "default") throw new Error("no");
    });
    expect(await applyInputDevice({ setInputDevice }, "x")).toBe("default");
    expect(await applyInputDevice(null, "x")).toBeNull();
  });
  it("backoff is bounded", () => {
    expect(backoffDelayMs(0)).toBeLessThan(1300);
    expect(backoffDelayMs(20)).toBeLessThanOrEqual(15250);
  });
});
