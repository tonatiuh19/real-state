import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../index";

interface Task {
  id: number;
  application_id: number;
  broker_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
}

interface TasksState {
  tasks: Task[];
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
      const { auth } = getState() as RootState;
      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Failed to fetch tasks");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (taskData: Partial<Task>, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Failed to create task");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (
    { id, ...updates }: Partial<Task> & { id: number },
    { getState, rejectWithValue },
  ) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Failed to update task");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.tasks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (task) => task.id === action.payload.id,
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      });
  },
});

export const { clearTasks } = tasksSlice.actions;

export const selectTasks = (state: { tasks: TasksState }) => state.tasks.tasks;
export const selectTasksLoading = (state: { tasks: TasksState }) =>
  state.tasks.isLoading;

export default tasksSlice.reducer;
