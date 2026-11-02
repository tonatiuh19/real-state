import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../index";
import type {
  CreditAnalysisMode,
  CreditAnalysisResult,
  CreateCreditAnalysisResponse,
  ListCreditAnalysesResponse,
  GetCreditAnalysisResponse,
  PublicFreeAnalysisResponse,
} from "@shared/api";

interface CreditAnalysisState {
  submitting: boolean;
  error: string | null;
  result: CreditAnalysisResult | null;
  history: CreditAnalysisResult[];
  historyLoading: boolean;
  selected: CreditAnalysisResult | null;
  selectedLoading: boolean;
  portalLatest: CreditAnalysisResult | null;
  portalList: CreditAnalysisResult[];
  portalLoading: boolean;
  portalSubmitting: boolean;
  portalError: string | null;
  publicSubmitting: boolean;
  publicResult: CreditAnalysisResult | null;
  publicIsNewLead: boolean;
  publicError: string | null;
}

const initialState: CreditAnalysisState = {
  submitting: false,
  error: null,
  result: null,
  history: [],
  historyLoading: false,
  selected: null,
  selectedLoading: false,
  portalLatest: null,
  portalList: [],
  portalLoading: false,
  portalSubmitting: false,
  portalError: null,
  publicSubmitting: false,
  publicResult: null,
  publicIsNewLead: false,
  publicError: null,
};

export interface AdminRunCreditAnalysisPayload {
  client_id: number;
  pdf: File;
  mode: CreditAnalysisMode;
  language: "en" | "es";
  goal?: string;
  email_opt_in: boolean;
}

export const runAdminCreditAnalysis = createAsyncThunk<
  CreditAnalysisResult,
  AdminRunCreditAnalysisPayload,
  { rejectValue: string; state: RootState }
>("creditAnalysis/adminRun", async (payload, { getState, rejectWithValue }) => {
  try {
    const { sessionToken } = getState().brokerAuth;
    const fd = new FormData();
    fd.append("client_id", String(payload.client_id));
    fd.append("pdf", payload.pdf);
    fd.append("mode", payload.mode);
    fd.append("language", payload.language);
    if (payload.goal) fd.append("goal", payload.goal);
    fd.append("email_opt_in", String(payload.email_opt_in));

    const { data } = await axios.post<CreateCreditAnalysisResponse>(
      "/api/admin/credit-analysis",
      fd,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (!data.success || !data.analysis) {
      return rejectWithValue(data.error || "Failed to generate analysis");
    }
    return data.analysis;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error ||
        "We couldn't generate the analysis. Please try again.",
    );
  }
});

export const fetchAdminCreditAnalyses = createAsyncThunk<
  CreditAnalysisResult[],
  number,
  { rejectValue: string; state: RootState }
>(
  "creditAnalysis/adminList",
  async (clientId, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = getState().brokerAuth;
      const { data } = await axios.get<ListCreditAnalysesResponse>(
        "/api/admin/credit-analysis",
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
          params: { client_id: clientId },
        },
      );
      if (!data.success) {
        return rejectWithValue(data.error || "Failed to load history");
      }
      return data.analyses || [];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error || "Failed to load analysis history",
      );
    }
  },
);

export const fetchAdminCreditAnalysis = createAsyncThunk<
  CreditAnalysisResult,
  number,
  { rejectValue: string; state: RootState }
>("creditAnalysis/adminGet", async (id, { getState, rejectWithValue }) => {
  try {
    const { sessionToken } = getState().brokerAuth;
    const { data } = await axios.get<GetCreditAnalysisResponse>(
      `/api/admin/credit-analysis/${id}`,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    if (!data.success || !data.analysis) {
      return rejectWithValue(data.error || "Analysis not found");
    }
    return data.analysis;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error || "Failed to load analysis",
    );
  }
});

export const fetchPortalCreditAnalyses = createAsyncThunk<
  { analyses: CreditAnalysisResult[]; latest: CreditAnalysisResult | null },
  void,
  { rejectValue: string; state: RootState }
>("creditAnalysis/portalList", async (_void, { getState, rejectWithValue }) => {
  try {
    const { sessionToken } = getState().clientAuth;
    const { data } = await axios.get<{
      success: boolean;
      analyses: CreditAnalysisResult[];
      latest?: CreditAnalysisResult | null;
      error?: string;
    }>("/api/portal/credit-analysis", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!data.success) {
      return rejectWithValue(data.error || "Failed to load analyses");
    }
    return {
      analyses: data.analyses || [],
      latest: data.latest || data.analyses?.[0] || null,
    };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error || "Failed to load analyses",
    );
  }
});

export interface PortalRunCreditAnalysisPayload {
  pdf: File;
  language: "en" | "es";
  goal?: string;
  email_opt_in: boolean;
}

export const runPortalCreditAnalysis = createAsyncThunk<
  CreditAnalysisResult,
  PortalRunCreditAnalysisPayload,
  { rejectValue: string; state: RootState }
>(
  "creditAnalysis/portalRun",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = getState().clientAuth;
      const fd = new FormData();
      fd.append("pdf", payload.pdf);
      fd.append("language", payload.language);
      if (payload.goal) fd.append("goal", payload.goal);
      fd.append("email_opt_in", String(payload.email_opt_in));

      const { data } = await axios.post<CreateCreditAnalysisResponse>(
        "/api/portal/credit-analysis",
        fd,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (!data.success || !data.analysis) {
        return rejectWithValue(data.error || "Failed to generate analysis");
      }
      return data.analysis;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error ||
          "We couldn't generate your analysis. Please try again.",
      );
    }
  },
);

export interface PublicRunFreeAnalysisPayload {
  broker_token: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  pdf: File;
  language: "en" | "es";
  goal?: string;
  email_opt_in: boolean;
}

export const runPublicFreeAnalysis = createAsyncThunk<
  {
    analysis: CreditAnalysisResult;
    is_new_lead: boolean;
    client_id: number;
    draft_id?: number | null;
  },
  PublicRunFreeAnalysisPayload,
  { rejectValue: string }
>("creditAnalysis/publicRun", async (payload, { rejectWithValue }) => {
  try {
    const fd = new FormData();
    fd.append("broker_token", payload.broker_token);
    fd.append("first_name", payload.first_name);
    fd.append("last_name", payload.last_name);
    fd.append("email", payload.email);
    if (payload.phone) fd.append("phone", payload.phone);
    fd.append("pdf", payload.pdf);
    fd.append("language", payload.language);
    if (payload.goal) fd.append("goal", payload.goal);
    fd.append("email_opt_in", String(payload.email_opt_in));

    const { data } = await axios.post<PublicFreeAnalysisResponse>(
      "/api/apply/free-analysis",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    if (!data.success || !data.analysis) {
      return rejectWithValue(data.error || "Failed to generate analysis");
    }
    return {
      analysis: data.analysis,
      is_new_lead: Boolean(data.is_new_lead),
      client_id: data.client_id ?? data.analysis.client_id,
      draft_id: data.draft_id ?? null,
    };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error ||
        "We couldn't generate your analysis. Please try again.",
    );
  }
});

const slice = createSlice({
  name: "creditAnalysis",
  initialState,
  reducers: {
    clearCreditAnalysisResult(s) {
      s.result = null;
      s.error = null;
    },
    clearPortalCreditAnalysisError(s) {
      s.portalError = null;
    },
    clearPublicFreeAnalysis(s) {
      s.publicResult = null;
      s.publicIsNewLead = false;
      s.publicError = null;
      s.publicSubmitting = false;
    },
  },
  extraReducers: (b) => {
    b.addCase(runAdminCreditAnalysis.pending, (s) => {
      s.submitting = true;
      s.error = null;
    });
    b.addCase(runAdminCreditAnalysis.rejected, (s, a) => {
      s.submitting = false;
      s.error = a.payload ?? "Something went wrong";
    });
    b.addCase(runAdminCreditAnalysis.fulfilled, (s, a) => {
      s.submitting = false;
      s.result = a.payload;
      s.history = [a.payload, ...s.history.filter((x) => x.id !== a.payload.id)];
    });

    b.addCase(fetchAdminCreditAnalyses.pending, (s) => {
      s.historyLoading = true;
    });
    b.addCase(fetchAdminCreditAnalyses.rejected, (s) => {
      s.historyLoading = false;
    });
    b.addCase(fetchAdminCreditAnalyses.fulfilled, (s, a) => {
      s.historyLoading = false;
      s.history = a.payload;
    });

    b.addCase(fetchAdminCreditAnalysis.pending, (s) => {
      s.selectedLoading = true;
    });
    b.addCase(fetchAdminCreditAnalysis.rejected, (s) => {
      s.selectedLoading = false;
    });
    b.addCase(fetchAdminCreditAnalysis.fulfilled, (s, a) => {
      s.selectedLoading = false;
      s.selected = a.payload;
      s.result = a.payload;
    });

    b.addCase(fetchPortalCreditAnalyses.pending, (s) => {
      s.portalLoading = true;
      s.portalError = null;
    });
    b.addCase(fetchPortalCreditAnalyses.rejected, (s, a) => {
      s.portalLoading = false;
      s.portalError = a.payload ?? "Failed to load";
    });
    b.addCase(fetchPortalCreditAnalyses.fulfilled, (s, a) => {
      s.portalLoading = false;
      s.portalList = a.payload.analyses;
      s.portalLatest = a.payload.latest;
    });

    b.addCase(runPortalCreditAnalysis.pending, (s) => {
      s.portalSubmitting = true;
      s.portalError = null;
    });
    b.addCase(runPortalCreditAnalysis.rejected, (s, a) => {
      s.portalSubmitting = false;
      s.portalError = a.payload ?? "Something went wrong";
    });
    b.addCase(runPortalCreditAnalysis.fulfilled, (s, a) => {
      s.portalSubmitting = false;
      s.portalLatest = a.payload;
      s.portalList = [
        a.payload,
        ...s.portalList.filter((x) => x.id !== a.payload.id),
      ];
    });

    b.addCase(runPublicFreeAnalysis.pending, (s) => {
      s.publicSubmitting = true;
      s.publicError = null;
    });
    b.addCase(runPublicFreeAnalysis.rejected, (s, a) => {
      s.publicSubmitting = false;
      s.publicError = a.payload ?? "Something went wrong";
    });
    b.addCase(runPublicFreeAnalysis.fulfilled, (s, a) => {
      s.publicSubmitting = false;
      s.publicResult = a.payload.analysis;
      s.publicIsNewLead = a.payload.is_new_lead;
    });
  },
});

export const {
  clearCreditAnalysisResult,
  clearPortalCreditAnalysisError,
  clearPublicFreeAnalysis,
} = slice.actions;
export default slice.reducer;
