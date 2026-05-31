import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "@/store";
import type {
  RealtorBroadcast,
  RealtorBroadcastRecipient,
  BroadcastAudiencePreview,
  BroadcastSavedSegment,
  CreateBroadcastRequest,
  PreviewBroadcastAudienceRequest,
  GetBroadcastsResponse,
  GetBroadcastResponse,
  CreateBroadcastResponse,
  PreviewBroadcastAudienceResponse,
  GetBroadcastRecipientsResponse,
  GetSavedSegmentsResponse,
  ResendFailedResponse,
} from "@shared/api";

// ─── State ────────────────────────────────────────────────────────────────────

interface RealtorBroadcastState {
  broadcasts: RealtorBroadcast[];
  broadcastsTotal: number;
  activeBroadcast: RealtorBroadcast | null;
  recipients: RealtorBroadcastRecipient[];
  recipientsTotal: number;
  audiencePreview: BroadcastAudiencePreview | null;
  latestDraft: RealtorBroadcast | null;
  savedSegments: BroadcastSavedSegment[];
  isLoading: boolean;
  isSending: boolean;
  isPreviewing: boolean;
  isResending: boolean;
  isExporting: boolean;
  error: string | null;
}

const initialState: RealtorBroadcastState = {
  broadcasts: [],
  broadcastsTotal: 0,
  activeBroadcast: null,
  recipients: [],
  recipientsTotal: 0,
  audiencePreview: null,
  latestDraft: null,
  savedSegments: [],
  isLoading: false,
  isSending: false,
  isPreviewing: false,
  isResending: false,
  isExporting: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchBroadcasts = createAsyncThunk(
  "realtorBroadcasts/fetchAll",
  async (params: { page?: number; limit?: number } | void, { getState }) => {
    const resolvedParams = params ?? {};
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetBroadcastsResponse>(
      "/api/realtor-broadcasts",
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: resolvedParams,
      },
    );
    return data;
  },
);

export const fetchBroadcastDetail = createAsyncThunk(
  "realtorBroadcasts/fetchDetail",
  async (broadcastId: number, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetBroadcastResponse>(
      `/api/realtor-broadcasts/${broadcastId}`,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return data.broadcast;
  },
);

export const fetchBroadcastRecipients = createAsyncThunk(
  "realtorBroadcasts/fetchRecipients",
  async (
    params: { broadcastId: number; page?: number; limit?: number },
    { getState },
  ) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetBroadcastRecipientsResponse>(
      `/api/realtor-broadcasts/${params.broadcastId}/recipients`,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: { page: params.page, limit: params.limit },
      },
    );
    return data;
  },
);

export const previewBroadcastAudience = createAsyncThunk(
  "realtorBroadcasts/preview",
  async (payload: PreviewBroadcastAudienceRequest, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.post<PreviewBroadcastAudienceResponse>(
      "/api/realtor-broadcasts/preview",
      payload,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return data.preview;
  },
);

export const createBroadcast = createAsyncThunk(
  "realtorBroadcasts/create",
  async (payload: CreateBroadcastRequest, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.post<CreateBroadcastResponse>(
      "/api/realtor-broadcasts",
      payload,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return data;
  },
);

/** Fetch the most recent draft broadcast (for wizard auto-resume) */
export const fetchLatestDraft = createAsyncThunk(
  "realtorBroadcasts/fetchLatestDraft",
  async (_, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetBroadcastsResponse>(
      "/api/realtor-broadcasts",
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: { status: "draft", limit: 1 },
      },
    );
    return data.broadcasts[0] ?? null;
  },
);

export const saveBroadcastDraft = createAsyncThunk(
  "realtorBroadcasts/saveDraft",
  async (
    payload: Partial<CreateBroadcastRequest> & { id: number },
    { getState },
  ) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { id, ...rest } = payload;
    await axios.patch(`/api/realtor-broadcasts/${id}`, rest, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return id;
  },
);

export const cancelBroadcast = createAsyncThunk(
  "realtorBroadcasts/cancel",
  async (broadcastId: number, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    await axios.patch(
      `/api/realtor-broadcasts/${broadcastId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return broadcastId;
  },
);

export const deleteBroadcast = createAsyncThunk(
  "realtorBroadcasts/delete",
  async (broadcastId: number, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    await axios.delete(`/api/realtor-broadcasts/${broadcastId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return broadcastId;
  },
);

/** Re-send to failed recipients for a completed broadcast */
export const retrySendFailed = createAsyncThunk(
  "realtorBroadcasts/retrySendFailed",
  async (broadcastId: number, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.post<ResendFailedResponse>(
      `/api/realtor-broadcasts/${broadcastId}/resend-failed`,
      {},
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return { broadcastId, retried: data.retried };
  },
);

/** Download broadcast recipients as CSV — triggers browser file download */
export const exportBroadcastRecipients = createAsyncThunk(
  "realtorBroadcasts/exportRecipients",
  async (broadcastId: number, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const response = await axios.get(
      `/api/realtor-broadcasts/${broadcastId}/recipients/export`,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        responseType: "blob",
      },
    );
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `broadcast-${broadcastId}-recipients.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return broadcastId;
  },
);

/** Fetch saved audience segment presets */
export const fetchSavedSegments = createAsyncThunk(
  "realtorBroadcasts/fetchSavedSegments",
  async (_, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetSavedSegmentsResponse>(
      "/api/broadcast-segments",
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return data.segments;
  },
);

/** Save the current audience filter as a named segment preset */
export const createSavedSegment = createAsyncThunk(
  "realtorBroadcasts/createSavedSegment",
  async (payload: { name: string; filter_json: any }, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.post<{ success: boolean; id: number }>(
      "/api/broadcast-segments",
      payload,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return data.id;
  },
);

/** Delete a saved segment preset */
export const deleteSavedSegment = createAsyncThunk(
  "realtorBroadcasts/deleteSavedSegment",
  async (segmentId: number, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    await axios.delete(`/api/broadcast-segments/${segmentId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return segmentId;
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const realtorBroadcastSlice = createSlice({
  name: "realtorBroadcasts",
  initialState,
  reducers: {
    clearAudiencePreview(state) {
      state.audiencePreview = null;
    },
    clearActiveBroadcast(state) {
      state.activeBroadcast = null;
      state.recipients = [];
      state.recipientsTotal = 0;
    },
    clearError(state) {
      state.error = null;
    },
    // Called by Ably subscription to update live progress
    updateBroadcastProgress(
      state,
      action: PayloadAction<{
        broadcastId: number;
        sent: number;
        failed: number;
        total: number;
      }>,
    ) {
      const { broadcastId, sent, failed } = action.payload;
      const broadcast = state.broadcasts.find((b) => b.id === broadcastId);
      if (broadcast) {
        broadcast.sent_count = sent;
        broadcast.failed_count = failed;
      }
      if (state.activeBroadcast?.id === broadcastId) {
        state.activeBroadcast.sent_count = sent;
        state.activeBroadcast.failed_count = failed;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchBroadcasts
    builder
      .addCase(fetchBroadcasts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBroadcasts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.broadcasts = action.payload.broadcasts;
        state.broadcastsTotal = action.payload.total;
      })
      .addCase(fetchBroadcasts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch broadcasts";
      });

    // fetchBroadcastDetail
    builder
      .addCase(fetchBroadcastDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBroadcastDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeBroadcast = action.payload;
      })
      .addCase(fetchBroadcastDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch broadcast";
      });

    // fetchBroadcastRecipients
    builder
      .addCase(fetchBroadcastRecipients.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBroadcastRecipients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recipients = action.payload.recipients;
        state.recipientsTotal = action.payload.total;
      })
      .addCase(fetchBroadcastRecipients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch recipients";
      });

    // previewBroadcastAudience
    builder
      .addCase(previewBroadcastAudience.pending, (state) => {
        state.isPreviewing = true;
        state.error = null;
      })
      .addCase(previewBroadcastAudience.fulfilled, (state, action) => {
        state.isPreviewing = false;
        state.audiencePreview = action.payload;
      })
      .addCase(previewBroadcastAudience.rejected, (state, action) => {
        state.isPreviewing = false;
        state.error = action.error.message || "Failed to preview audience";
      });

    // createBroadcast
    builder
      .addCase(createBroadcast.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(createBroadcast.fulfilled, (state) => {
        state.isSending = false;
        state.latestDraft = null;
      })
      .addCase(createBroadcast.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.error.message || "Failed to create broadcast";
      });

    // cancelBroadcast
    builder.addCase(cancelBroadcast.fulfilled, (state, action) => {
      const broadcast = state.broadcasts.find((b) => b.id === action.payload);
      if (broadcast) broadcast.is_cancelled = true;
    });

    // fetchLatestDraft
    builder.addCase(fetchLatestDraft.fulfilled, (state, action) => {
      state.latestDraft = action.payload;
    });
    builder.addCase(deleteBroadcast.fulfilled, (state, action) => {
      state.broadcasts = state.broadcasts.filter(
        (b) => b.id !== action.payload,
      );
      state.broadcastsTotal = Math.max(0, state.broadcastsTotal - 1);
    });

    // retrySendFailed
    builder
      .addCase(retrySendFailed.pending, (state) => {
        state.isResending = true;
        state.error = null;
      })
      .addCase(retrySendFailed.fulfilled, (state, action) => {
        state.isResending = false;
        const broadcast = state.broadcasts.find(
          (b) => b.id === action.payload.broadcastId,
        );
        if (broadcast) broadcast.status = "sending";
        if (state.activeBroadcast?.id === action.payload.broadcastId) {
          state.activeBroadcast.status = "sending";
        }
      })
      .addCase(retrySendFailed.rejected, (state, action) => {
        state.isResending = false;
        state.error = action.error.message || "Failed to retry";
      });

    // exportBroadcastRecipients
    builder
      .addCase(exportBroadcastRecipients.pending, (state) => {
        state.isExporting = true;
      })
      .addCase(exportBroadcastRecipients.fulfilled, (state) => {
        state.isExporting = false;
      })
      .addCase(exportBroadcastRecipients.rejected, (state) => {
        state.isExporting = false;
      });

    // fetchSavedSegments
    builder.addCase(fetchSavedSegments.fulfilled, (state, action) => {
      state.savedSegments = action.payload;
    });

    // createSavedSegment — refetch list after creation
    builder.addCase(createSavedSegment.fulfilled, (state) => {
      // list refresh triggered by caller re-dispatching fetchSavedSegments
    });

    // deleteSavedSegment
    builder.addCase(deleteSavedSegment.fulfilled, (state, action) => {
      state.savedSegments = state.savedSegments.filter(
        (s) => s.id !== action.payload,
      );
    });
  },
});

export const {
  clearAudiencePreview,
  clearActiveBroadcast,
  clearError,
  updateBroadcastProgress,
} = realtorBroadcastSlice.actions;

export default realtorBroadcastSlice.reducer;
