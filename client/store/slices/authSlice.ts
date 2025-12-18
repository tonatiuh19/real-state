import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: "user" | "broker";
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verificationEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  verificationEmail: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, userType }: { email: string; userType: "user" | "broker" },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/auth/${userType}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Login failed");
      }

      const data = await response.json();
      return { email, userType, message: data.message };
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

export const verifyCode = createAsyncThunk(
  "auth/verify",
  async (
    {
      email,
      code,
      userType,
    }: { email: string; code: string; userType: "user" | "broker" },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/auth/${userType}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Verification failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      userType: "user" | "broker";
      licenseNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { userType, ...body } = userData;
      const response = await fetch(`/api/auth/${userType}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Registration failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Failed to get user");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.verificationEmail = null;
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationEmail = action.payload.email;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify
      .addCase(verifyCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user || action.payload.broker;
        state.isAuthenticated = true;
        state.verificationEmail = null;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem("token");
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectVerificationEmail = (state: RootState) =>
  state.auth.verificationEmail;

export default authSlice.reducer;
