import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import applicationsReducer from "./slices/applicationsSlice";
import leadsReducer from "./slices/leadsSlice";
import documentsReducer from "./slices/documentsSlice";
import tasksReducer from "./slices/tasksSlice";
import notificationsReducer from "./slices/notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    leads: leadsReducer,
    documents: documentsReducer,
    tasks: tasksReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["auth/login/fulfilled", "auth/verify/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: ["auth.lastLogin"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
