import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../index";
import type {
  SchedulerSettings,
  SchedulerAvailability,
  ScheduledMeeting,
  GetSchedulerSettingsResponse,
  GetScheduledMeetingsResponse,
  UpdateSchedulerSettingsRequest,
  UpdateMeetingRequest,
  BookMeetingRequest,
  BookMeetingResponse,
  GetPublicSchedulerResponse,
  GetAvailableSlotsResponse,
  AvailableSlot,
  PublicSchedulerBrokerInfo,
} from "@shared/api";

interface SchedulerState {
  // Admin
  settings: SchedulerSettings | null;
  availability: SchedulerAvailability[];
  meetings: ScheduledMeeting[];
  totalMeetings: number;
  isLoadingSettings: boolean;
  isSavingSettings: boolean;
  isLoadingMeetings: boolean;
  isUpdatingMeeting: boolean;
  isCreatingMeeting: boolean;
  error: string | null;

  // Public booking flow
  publicBroker: PublicSchedulerBrokerInfo | null;
  availableDates: string[];
  selectedDate: string | null;
  availableSlots: AvailableSlot[];
  isLoadingPublic: boolean;
  isLoadingSlots: boolean;
  isBooking: boolean;
  bookingSuccess: BookMeetingResponse | null;
  publicError: string | null;
}

const initialState: SchedulerState = {
  settings: null,
  availability: [],
  meetings: [],
  totalMeetings: 0,
  isLoadingSettings: false,
  isSavingSettings: false,
  isLoadingMeetings: false,
  isUpdatingMeeting: false,
  isCreatingMeeting: false,
  error: null,

  publicBroker: null,
  availableDates: [],
  selectedDate: null,
  availableSlots: [],
  isLoadingPublic: false,
  isLoadingSlots: false,
  isBooking: false,
  bookingSuccess: null,
  publicError: null,
};

// ---------------------------------------------------------------
// Public thunks (no auth)
// ---------------------------------------------------------------

export const fetchPublicScheduler = createAsyncThunk(
  "scheduler/fetchPublic",
  async (brokerToken: string | undefined, { rejectWithValue }) => {
    try {
      const token = brokerToken || "default";
      const { data } = await axios.get<GetPublicSchedulerResponse>(
        `/api/public/scheduler/${token}`,
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Scheduler not available",
      );
    }
  },
);

export const fetchPublicSlots = createAsyncThunk(
  "scheduler/fetchSlots",
  async (
    { brokerToken, date }: { brokerToken: string | undefined; date: string },
    { rejectWithValue },
  ) => {
    try {
      const token = brokerToken || "default";
      const { data } = await axios.get<GetAvailableSlotsResponse>(
        `/api/public/scheduler/${token}/slots`,
        { params: { date } },
      );
      return data.slots;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch slots",
      );
    }
  },
);

export const bookMeeting = createAsyncThunk(
  "scheduler/book",
  async (payload: BookMeetingRequest, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<BookMeetingResponse>(
        "/api/public/scheduler/book",
        payload,
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to book meeting",
      );
    }
  },
);

// ---------------------------------------------------------------
// Admin thunks (authenticated)
// ---------------------------------------------------------------

export const fetchSchedulerSettings = createAsyncThunk(
  "scheduler/fetchSettings",
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.get<GetSchedulerSettingsResponse>(
        "/api/scheduler/settings",
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch scheduler settings",
      );
    }
  },
);

export const updateSchedulerSettings = createAsyncThunk(
  "scheduler/updateSettings",
  async (
    payload: UpdateSchedulerSettingsRequest,
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.put("/api/scheduler/settings", payload, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update scheduler settings",
      );
    }
  },
);

export const fetchScheduledMeetings = createAsyncThunk(
  "scheduler/fetchMeetings",
  async (
    params: {
      status?: string;
      from?: string;
      to?: string;
      broker_id?: number;
    } | void,
    { getState, rejectWithValue },
  ) => {
    const resolvedParams = params ?? {};
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.get<GetScheduledMeetingsResponse>(
        "/api/scheduler/meetings",
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
          params: resolvedParams,
        },
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch meetings",
      );
    }
  },
);

export const updateScheduledMeeting = createAsyncThunk(
  "scheduler/updateMeeting",
  async (
    {
      meetingId,
      payload,
    }: { meetingId: number; payload: UpdateMeetingRequest },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      await axios.put(`/api/scheduler/meetings/${meetingId}`, payload, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return { meetingId, payload };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update meeting",
      );
    }
  },
);

export const createScheduledMeeting = createAsyncThunk(
  "scheduler/createMeeting",
  async (
    payload: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      meeting_date: string;
      meeting_time: string;
      meeting_type: "phone" | "video";
      notes?: string;
      target_broker_id?: number;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.post("/api/scheduler/meetings", payload, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create meeting",
      );
    }
  },
);

// ---------------------------------------------------------------
// Slice
// ---------------------------------------------------------------

const schedulerSlice = createSlice({
  name: "scheduler",
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<string | null>) {
      state.selectedDate = action.payload;
      state.availableSlots = [];
    },
    clearBookingSuccess(state) {
      state.bookingSuccess = null;
    },
    clearPublicError(state) {
      state.publicError = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchPublicScheduler
    builder
      .addCase(fetchPublicScheduler.pending, (state) => {
        state.isLoadingPublic = true;
        state.publicError = null;
      })
      .addCase(fetchPublicScheduler.fulfilled, (state, action) => {
        state.isLoadingPublic = false;
        state.publicBroker = action.payload.broker;
        state.availableDates = action.payload.available_dates;
      })
      .addCase(fetchPublicScheduler.rejected, (state, action) => {
        state.isLoadingPublic = false;
        state.publicError = action.payload as string;
      });

    // fetchPublicSlots
    builder
      .addCase(fetchPublicSlots.pending, (state) => {
        state.isLoadingSlots = true;
      })
      .addCase(fetchPublicSlots.fulfilled, (state, action) => {
        state.isLoadingSlots = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchPublicSlots.rejected, (state) => {
        state.isLoadingSlots = false;
        state.availableSlots = [];
      });

    // bookMeeting
    builder
      .addCase(bookMeeting.pending, (state) => {
        state.isBooking = true;
        state.publicError = null;
      })
      .addCase(bookMeeting.fulfilled, (state, action) => {
        state.isBooking = false;
        state.bookingSuccess = action.payload;
      })
      .addCase(bookMeeting.rejected, (state, action) => {
        state.isBooking = false;
        state.publicError = action.payload as string;
      });

    // fetchSchedulerSettings
    builder
      .addCase(fetchSchedulerSettings.pending, (state) => {
        state.isLoadingSettings = true;
        state.error = null;
      })
      .addCase(fetchSchedulerSettings.fulfilled, (state, action) => {
        state.isLoadingSettings = false;
        state.settings = action.payload.settings;
        state.availability = action.payload.availability;
      })
      .addCase(fetchSchedulerSettings.rejected, (state, action) => {
        state.isLoadingSettings = false;
        state.error = action.payload as string;
      });

    // updateSchedulerSettings
    builder
      .addCase(updateSchedulerSettings.pending, (state) => {
        state.isSavingSettings = true;
        state.error = null;
      })
      .addCase(updateSchedulerSettings.fulfilled, (state) => {
        state.isSavingSettings = false;
      })
      .addCase(updateSchedulerSettings.rejected, (state, action) => {
        state.isSavingSettings = false;
        state.error = action.payload as string;
      });

    // fetchScheduledMeetings
    builder
      .addCase(fetchScheduledMeetings.pending, (state) => {
        state.isLoadingMeetings = true;
        state.error = null;
      })
      .addCase(fetchScheduledMeetings.fulfilled, (state, action) => {
        state.isLoadingMeetings = false;
        state.meetings = action.payload.meetings;
        state.totalMeetings = action.payload.total;
      })
      .addCase(fetchScheduledMeetings.rejected, (state, action) => {
        state.isLoadingMeetings = false;
        state.error = action.payload as string;
      });

    // updateScheduledMeeting
    builder
      .addCase(updateScheduledMeeting.pending, (state) => {
        state.isUpdatingMeeting = true;
      })
      .addCase(updateScheduledMeeting.fulfilled, (state, action) => {
        state.isUpdatingMeeting = false;
        const { meetingId, payload } = action.payload;
        const idx = state.meetings.findIndex((m) => m.id === meetingId);
        if (idx !== -1) {
          state.meetings[idx] = {
            ...state.meetings[idx],
            ...payload,
          } as ScheduledMeeting;
        }
      })
      .addCase(updateScheduledMeeting.rejected, (state, action) => {
        state.isUpdatingMeeting = false;
        state.error = action.payload as string;
      });

    // createScheduledMeeting
    builder
      .addCase(createScheduledMeeting.pending, (state) => {
        state.isCreatingMeeting = true;
      })
      .addCase(createScheduledMeeting.fulfilled, (state) => {
        state.isCreatingMeeting = false;
      })
      .addCase(createScheduledMeeting.rejected, (state, action) => {
        state.isCreatingMeeting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedDate,
  clearBookingSuccess,
  clearPublicError,
  clearError,
} = schedulerSlice.actions;

export default schedulerSlice.reducer;
