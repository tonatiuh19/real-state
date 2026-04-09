import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DeviceStatus = "idle" | "connecting" | "registered" | "error";

interface VoiceState {
  isAvailable: boolean;
  deviceStatus: DeviceStatus;
}

const stored = localStorage.getItem("voice_available");

const initialState: VoiceState = {
  isAvailable: stored === null ? true : stored === "true",
  deviceStatus: "idle",
};

const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    setVoiceAvailable(state, action: PayloadAction<boolean>) {
      state.isAvailable = action.payload;
      localStorage.setItem("voice_available", String(action.payload));
    },
    setDeviceStatus(state, action: PayloadAction<DeviceStatus>) {
      state.deviceStatus = action.payload;
    },
  },
});

export const { setVoiceAvailable, setDeviceStatus } = voiceSlice.actions;
export default voiceSlice.reducer;
