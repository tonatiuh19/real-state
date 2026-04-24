import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../index";

interface Notification {
  id: number;
  user_id?: number;
  broker_id?: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch notifications",
      );
    }
  },
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId: number, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to mark notification as read",
      );
    }
  },
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      await axios.put(
        "/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to mark all notifications as read",
      );
    }
  },
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(
          (n: Notification) => !n.is_read,
        ).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => n.id === action.payload,
        );
        if (notification && !notification.is_read) {
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => (n.is_read = true));
        state.unreadCount = 0;
      });
  },
});

export const { clearNotifications } = notificationsSlice.actions;

export const selectNotifications = (state: {
  notifications: NotificationsState;
}) => state.notifications.notifications;
export const selectUnreadCount = (state: {
  notifications: NotificationsState;
}) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state: {
  notifications: NotificationsState;
}) => state.notifications.isLoading;

export default notificationsSlice.reducer;
