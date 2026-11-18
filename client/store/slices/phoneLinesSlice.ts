import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "@/store";
import type {
  BrokerDelegation,
  BrokerDelegationsResponse,
  MainLineConfigDto,
  MainLineResponse,
  SendableLine,
  SendableLinesResponse,
  UpdateMainLineRequest,
  UpsertBrokerDelegationRequest,
  UpsertBrokerDelegationResponse,
} from "@shared/api";

interface PhoneLinesState {
  lines: SendableLine[];
  linesLoaded: boolean;
  linesLoading: boolean;
  /** E.164 of the line the current user picked; null = use default line. */
  selectedFromLine: string | null;
  delegations: BrokerDelegation[];
  delegationsLoaded: boolean;
  delegationsLoading: boolean;
  savingDelegation: boolean;
  revokingId: number | null;
  mainLine: MainLineConfigDto | null;
  mainLineLoading: boolean;
  savingMainLine: boolean;
  error: string | null;
}

const initialState: PhoneLinesState = {
  lines: [],
  linesLoaded: false,
  linesLoading: false,
  selectedFromLine: null,
  delegations: [],
  delegationsLoaded: false,
  delegationsLoading: false,
  savingDelegation: false,
  revokingId: null,
  mainLine: null,
  mainLineLoading: false,
  savingMainLine: false,
  error: null,
};

const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.error || err?.message || fallback;

const authHeaders = (getState: () => unknown) => ({
  Authorization: `Bearer ${(getState() as RootState).brokerAuth.sessionToken}`,
});

export const fetchSendableLines = createAsyncThunk(
  "phoneLines/fetchSendableLines",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get<SendableLinesResponse>(
        "/api/voice/lines",
        { headers: authHeaders(getState) },
      );
      return data.lines ?? [];
    } catch (err: any) {
      return rejectWithValue(errorMessage(err, "Failed to load phone lines"));
    }
  },
);

export const fetchDelegations = createAsyncThunk(
  "phoneLines/fetchDelegations",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get<BrokerDelegationsResponse>(
        "/api/broker-delegations",
        { headers: authHeaders(getState) },
      );
      return data.delegations ?? [];
    } catch (err: any) {
      return rejectWithValue(errorMessage(err, "Failed to load team access"));
    }
  },
);

export const upsertDelegation = createAsyncThunk(
  "phoneLines/upsertDelegation",
  async (
    payload: UpsertBrokerDelegationRequest,
    { getState, rejectWithValue },
  ) => {
    try {
      const { data } = await axios.post<UpsertBrokerDelegationResponse>(
        "/api/broker-delegations",
        payload,
        { headers: authHeaders(getState) },
      );
      return data.delegation;
    } catch (err: any) {
      return rejectWithValue(errorMessage(err, "Failed to save team access"));
    }
  },
);

export const revokeDelegation = createAsyncThunk(
  "phoneLines/revokeDelegation",
  async (id: number, { getState, rejectWithValue }) => {
    try {
      await axios.delete(`/api/broker-delegations/${id}`, {
        headers: authHeaders(getState),
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(errorMessage(err, "Failed to revoke access"));
    }
  },
);

export const fetchMainLine = createAsyncThunk(
  "phoneLines/fetchMainLine",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get<MainLineResponse>(
        "/api/settings/main-line",
        { headers: authHeaders(getState) },
      );
      return data.main_line;
    } catch (err: any) {
      return rejectWithValue(errorMessage(err, "Failed to load main line"));
    }
  },
);

export const updateMainLine = createAsyncThunk(
  "phoneLines/updateMainLine",
  async (payload: UpdateMainLineRequest, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.put<MainLineResponse>(
        "/api/settings/main-line",
        payload,
        { headers: authHeaders(getState) },
      );
      return data.main_line;
    } catch (err: any) {
      return rejectWithValue(errorMessage(err, "Failed to save main line"));
    }
  },
);

const phoneLinesSlice = createSlice({
  name: "phoneLines",
  initialState,
  reducers: {
    setSelectedFromLine(state, action: PayloadAction<string | null>) {
      state.selectedFromLine = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSendableLines.pending, (state) => {
        state.linesLoading = true;
      })
      .addCase(fetchSendableLines.fulfilled, (state, action) => {
        state.linesLoading = false;
        state.linesLoaded = true;
        state.lines = action.payload;
        if (
          state.selectedFromLine &&
          !action.payload.some((l) => l.number === state.selectedFromLine)
        ) {
          state.selectedFromLine = null;
        }
      })
      .addCase(fetchSendableLines.rejected, (state, action) => {
        state.linesLoading = false;
        state.linesLoaded = true;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(fetchDelegations.pending, (state) => {
        state.delegationsLoading = true;
      })
      .addCase(fetchDelegations.fulfilled, (state, action) => {
        state.delegationsLoading = false;
        state.delegationsLoaded = true;
        state.delegations = action.payload;
      })
      .addCase(fetchDelegations.rejected, (state, action) => {
        state.delegationsLoading = false;
        state.delegationsLoaded = true;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(upsertDelegation.pending, (state) => {
        state.savingDelegation = true;
      })
      .addCase(upsertDelegation.fulfilled, (state, action) => {
        state.savingDelegation = false;
        const idx = state.delegations.findIndex(
          (d) => d.id === action.payload.id,
        );
        if (idx >= 0) state.delegations[idx] = action.payload;
        else state.delegations.unshift(action.payload);
      })
      .addCase(upsertDelegation.rejected, (state, action) => {
        state.savingDelegation = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(revokeDelegation.pending, (state, action) => {
        state.revokingId = action.meta.arg;
      })
      .addCase(revokeDelegation.fulfilled, (state, action) => {
        state.revokingId = null;
        state.delegations = state.delegations.filter(
          (d) => d.id !== action.payload,
        );
      })
      .addCase(revokeDelegation.rejected, (state, action) => {
        state.revokingId = null;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(fetchMainLine.pending, (state) => {
        state.mainLineLoading = true;
      })
      .addCase(fetchMainLine.fulfilled, (state, action) => {
        state.mainLineLoading = false;
        state.mainLine = action.payload;
      })
      .addCase(fetchMainLine.rejected, (state, action) => {
        state.mainLineLoading = false;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(updateMainLine.pending, (state) => {
        state.savingMainLine = true;
      })
      .addCase(updateMainLine.fulfilled, (state, action) => {
        state.savingMainLine = false;
        state.mainLine = action.payload;
      })
      .addCase(updateMainLine.rejected, (state, action) => {
        state.savingMainLine = false;
        state.error = (action.payload as string) ?? null;
      });
  },
});

export const { setSelectedFromLine } = phoneLinesSlice.actions;

/** Pure: resolve the effective from-line given a preference + optional thread inbox number. */
export function resolveFromLine(
  lines: SendableLine[],
  selected: string | null,
  threadInbox?: string | null,
): string | null {
  if (lines.length === 0) return null;
  if (selected && lines.some((l) => l.number === selected)) return selected;
  if (threadInbox && lines.some((l) => l.number === threadInbox))
    return threadInbox;
  return (lines.find((l) => l.is_default) ?? lines[0]).number;
}

export const selectEffectiveFromLine = (state: RootState): string | null =>
  resolveFromLine(state.phoneLines.lines, state.phoneLines.selectedFromLine);

export default phoneLinesSlice.reducer;
