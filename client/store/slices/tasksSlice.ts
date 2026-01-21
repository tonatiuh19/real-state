import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../index";
import type { GetTasksResponse } from "@shared/api";

interface TasksState {
  tasks: GetTasksResponse["tasks"];
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.get<GetTasksResponse>("/api/tasks", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data.tasks;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch tasks",
      );
    }
  },
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async (
    { taskId, status }: { taskId: number; status: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      await axios.patch(
        `/api/tasks/${taskId}`,
        { status },
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      return { taskId, status };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update task",
      );
    }
  },
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (
    taskData: {
      title: string;
      description?: string;
      task_type: string;
      priority: string;
      due_date?: string;
      application_id?: number | null;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { data } = await axios.post("/api/tasks", taskData, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data.task;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create task",
      );
    }
  },
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (
    taskData: {
      id: number;
      title?: string;
      description?: string;
      task_type?: string;
      priority?: string;
      due_date?: string;
      application_id?: number | null;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      const { id, ...updates } = taskData;
      const { data } = await axios.put(`/api/tasks/${id}`, updates, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return data.task;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update task",
      );
    }
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (taskId: number, { getState, rejectWithValue }) => {
    try {
      const { sessionToken } = (getState() as RootState).brokerAuth;
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return taskId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete task",
      );
    }
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.tasks = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const task = state.tasks.find((t) => t.id === action.payload.taskId);
        if (task) {
          task.status = action.payload.status;
        }
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      });
  },
});

export const { clearTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
