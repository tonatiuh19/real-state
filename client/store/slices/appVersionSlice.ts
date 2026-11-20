import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import {
  currentEntryScript,
  extractEntryScript,
  isNewBuildAvailable,
} from "@/utils/buildVersion";

interface AppVersionState {
  updateAvailable: boolean;
  lastCheckedAt: number | null;
}

const initialState: AppVersionState = {
  updateAvailable: false,
  lastCheckedAt: null,
};

/** Fetches the deployed index.html (no cache) and compares its entry script. */
export const checkForNewBuild = createAsyncThunk(
  "appVersion/checkForNewBuild",
  async () => {
    const { data } = await axios.get<string>(`/?_v=${Date.now()}`, {
      responseType: "text",
      headers: { "Cache-Control": "no-cache" },
    });
    return isNewBuildAvailable(currentEntryScript(), extractEntryScript(data));
  },
);

const appVersionSlice = createSlice({
  name: "appVersion",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(checkForNewBuild.fulfilled, (state, action) => {
      state.lastCheckedAt = Date.now();
      if (action.payload) state.updateAvailable = true;
    });
  },
});

export default appVersionSlice.reducer;
