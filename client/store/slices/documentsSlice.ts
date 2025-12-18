import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../index";

interface Document {
  id: number;
  application_id: number;
  document_type: string;
  document_name: string;
  file_path: string;
  status: string;
  created_at: string;
}

interface DocumentsState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: [],
  isLoading: false,
  error: null,
};

export const fetchDocuments = createAsyncThunk(
  "documents/fetchAll",
  async (applicationId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(
        `/api/documents?applicationId=${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Failed to fetch documents");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

export const uploadDocument = createAsyncThunk(
  "documents/upload",
  async (documentData: any, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || "Failed to upload document");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue("Network error");
    }
  },
);

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    clearDocuments: (state) => {
      state.documents = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload);
      });
  },
});

export const { clearDocuments } = documentsSlice.actions;

export const selectDocuments = (state: { documents: DocumentsState }) =>
  state.documents.documents;
export const selectDocumentsLoading = (state: { documents: DocumentsState }) =>
  state.documents.isLoading;

export default documentsSlice.reducer;
