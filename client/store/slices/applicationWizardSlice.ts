import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface PublicApplicationPayload {
  // Step 1 – Identity
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  // Step 2 – Property
  loan_type: string;
  property_value: string;
  down_payment: string;
  property_type: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  loan_purpose: string;
  // Step 3 – Finances
  annual_income: string;
  credit_score_range: string;
  income_type: string;
  // Step 4 – Employment
  employment_status: string;
  employer_name: string;
  years_employed: string;
}

interface ApplicationWizardState {
  loading: boolean;
  error: string | null;
  submittedApplicationNumber: string | null;
  submittedApplicationId: number | null;
}

const initialState: ApplicationWizardState = {
  loading: false,
  error: null,
  submittedApplicationNumber: null,
  submittedApplicationId: null,
};

export const submitPublicApplication = createAsyncThunk(
  "applicationWizard/submit",
  async (payload: PublicApplicationPayload, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<{
        success: boolean;
        application_number: string;
        application_id: number;
        client_id: number;
      }>("/api/apply", payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to submit application",
      );
    }
  },
);

const applicationWizardSlice = createSlice({
  name: "applicationWizard",
  initialState,
  reducers: {
    resetWizard(state) {
      state.loading = false;
      state.error = null;
      state.submittedApplicationNumber = null;
      state.submittedApplicationId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPublicApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPublicApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.submittedApplicationNumber = action.payload.application_number;
        state.submittedApplicationId = action.payload.application_id;
      })
      .addCase(submitPublicApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetWizard } = applicationWizardSlice.actions;
export default applicationWizardSlice.reducer;
