import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../index";
import type {
  GetCrmConfigResponse,
  GetCrmPeopleResponse,
  ClaimSharedConversationResponse,
} from "@shared/api";

interface CrmState {
  perOwnerCrmActive: boolean;
  perOwnerCrmEnabled: boolean;
  perOwnerCrmInactiveReason: GetCrmConfigResponse["per_owner_crm"]["inactive_reason"];
  isLoadingConfig: boolean;
  peopleGroups: GetCrmPeopleResponse["groups"];
  peoplePagination: GetCrmPeopleResponse["pagination"] | null;
  isLoadingPeople: boolean;
  isClaiming: boolean;
  error: string | null;
}

const initialState: CrmState = {
  perOwnerCrmActive: false,
  perOwnerCrmEnabled: false,
  perOwnerCrmInactiveReason: null,
  isLoadingConfig: false,
  peopleGroups: [],
  peoplePagination: null,
  isLoadingPeople: false,
  isClaiming: false,
  error: null,
};

export const fetchCrmConfig = createAsyncThunk(
  "crm/fetchConfig",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.get<GetCrmConfigResponse>("/api/crm/config", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to load CRM config",
      );
    }
  },
);

export const fetchCrmPeople = createAsyncThunk(
  "crm/fetchPeople",
  async (
    params: { page?: number; limit?: number; search?: string } = {},
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.get<GetCrmPeopleResponse>("/api/crm/people", {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params,
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to load people view",
      );
    }
  },
);

export const claimSharedConversation = createAsyncThunk(
  "crm/claimSharedConversation",
  async (
    {
      conversationId,
      first_name,
      last_name,
      email,
    }: {
      conversationId: string;
      first_name?: string;
      last_name?: string;
      email?: string;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.post<ClaimSharedConversationResponse>(
        `/api/conversations/${encodeURIComponent(conversationId)}/claim`,
        { first_name, last_name, email },
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data ?? { error: "Failed to claim conversation" },
      );
    }
  },
);

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    clearCrmError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrmConfig.pending, (state) => {
        state.isLoadingConfig = true;
      })
      .addCase(fetchCrmConfig.fulfilled, (state, action) => {
        state.isLoadingConfig = false;
        state.perOwnerCrmActive =
          action.payload.per_owner_crm?.activeForBroker ?? false;
        state.perOwnerCrmEnabled =
          action.payload.per_owner_crm?.enabled ?? false;
        state.perOwnerCrmInactiveReason =
          action.payload.per_owner_crm?.inactive_reason ?? null;
      })
      .addCase(fetchCrmConfig.rejected, (state) => {
        state.isLoadingConfig = false;
        state.perOwnerCrmActive = false;
        state.perOwnerCrmInactiveReason = null;
      })
      .addCase(fetchCrmPeople.pending, (state) => {
        state.isLoadingPeople = true;
        state.error = null;
      })
      .addCase(fetchCrmPeople.fulfilled, (state, action) => {
        state.isLoadingPeople = false;
        state.peopleGroups = action.payload.groups;
        state.peoplePagination = action.payload.pagination ?? null;
      })
      .addCase(fetchCrmPeople.rejected, (state, action) => {
        state.isLoadingPeople = false;
        state.error = String(action.payload || "Failed to load people");
      })
      .addCase(claimSharedConversation.pending, (state) => {
        state.isClaiming = true;
      })
      .addCase(claimSharedConversation.fulfilled, (state) => {
        state.isClaiming = false;
      })
      .addCase(claimSharedConversation.rejected, (state, action) => {
        state.isClaiming = false;
        state.error = String(action.payload || "Claim failed");
      });
  },
});

export const { clearCrmError } = crmSlice.actions;
export default crmSlice.reducer;
