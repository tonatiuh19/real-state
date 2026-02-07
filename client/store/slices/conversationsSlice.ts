import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";
import {
  ConversationThread,
  ConversationMessage,
  ConversationTemplate,
  GetConversationsResponse,
  GetConversationMessagesResponse,
  SendMessageResponse,
  GetConversationTemplatesResponse,
  CreateConversationTemplateResponse,
  SendMessageRequest,
  CreateConversationTemplateRequest,
} from "@shared/api";

interface ConversationsState {
  conversations: ConversationThread[];
  currentConversationMessages: ConversationMessage[];
  templates: ConversationTemplate[];
  loading: boolean;
  messagesLoading: boolean;
  templatesLoading: boolean;
  sending: boolean;
  error: string | null;
  selectedConversationId: string | null;
  unreadCount: number;
}

const initialState: ConversationsState = {
  conversations: [],
  currentConversationMessages: [],
  templates: [],
  loading: false,
  messagesLoading: false,
  templatesLoading: false,
  sending: false,
  error: null,
  selectedConversationId: null,
  unreadCount: 0,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  "conversations/fetchConversations",
  async (
    params:
      | {
          status?: "active" | "archived" | "closed";
          limit?: number;
          offset?: number;
        }
      | undefined,
    { getState },
  ) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetConversationsResponse>(
      "/api/conversations",
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: params || {},
      },
    );
    return data;
  },
);

export const fetchConversationMessages = createAsyncThunk(
  "conversations/fetchConversationMessages",
  async (
    params: { conversationId: string; limit?: number; offset?: number },
    { getState },
  ) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetConversationMessagesResponse>(
      `/api/conversations/${params.conversationId}/messages`,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: { limit: params.limit, offset: params.offset },
      },
    );
    return data;
  },
);

export const sendMessage = createAsyncThunk(
  "conversations/sendMessage",
  async (messageData: SendMessageRequest, { getState, dispatch }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.post<SendMessageResponse>(
      "/api/conversations/send-message",
      messageData,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
    );

    // Refresh conversations and current conversation messages if needed
    // Note: Removed auto-refresh to prevent excessive API calls
    // The 30-second polling in the component will handle updates
    if (data.success) {
      // Just refresh the current conversation messages, not all conversations
      const state = getState() as RootState;
      if (state.conversations.selectedConversationId) {
        dispatch(
          fetchConversationMessages({
            conversationId: state.conversations.selectedConversationId,
          }),
        );
      }
    }

    return data;
  },
);

export const fetchConversationTemplates = createAsyncThunk(
  "conversations/fetchConversationTemplates",
  async (
    params:
      | {
          template_type?: "email" | "sms" | "whatsapp";
          category?: string;
        }
      | undefined,
    { getState },
  ) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get<GetConversationTemplatesResponse>(
      "/api/templates",
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
        params: params || {},
      },
    );
    return data;
  },
);

export const createConversationTemplate = createAsyncThunk(
  "conversations/createConversationTemplate",
  async (templateData: CreateConversationTemplateRequest, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.post<CreateConversationTemplateResponse>(
      "/api/conversation-templates",
      templateData,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
    );
    return data;
  },
);

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setSelectedConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
      if (!action.payload) {
        state.currentConversationMessages = [];
      }
    },
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(
        (conv) => conv.conversation_id === action.payload,
      );
      if (conversation) {
        state.unreadCount -= conversation.unread_count;
        conversation.unread_count = 0;
      }
    },
    addIncomingMessage: (state, action: PayloadAction<ConversationMessage>) => {
      // Add message to current conversation if it matches
      if (state.selectedConversationId === action.payload.conversation_id) {
        state.currentConversationMessages.push(action.payload);
      }

      // Update conversation in list
      const conversation = state.conversations.find(
        (conv) => conv.conversation_id === action.payload.conversation_id,
      );
      if (conversation) {
        conversation.last_message_at = action.payload.created_at;
        conversation.last_message_preview = action.payload.body.substring(
          0,
          200,
        );
        conversation.message_count += 1;
        if (action.payload.direction === "inbound") {
          conversation.unread_count += 1;
          state.unreadCount += 1;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.conversations.reduce(
        (total, conv) => total + conv.unread_count,
        0,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.conversations;
        state.unreadCount = action.payload.conversations.reduce(
          (total, conv) => total + conv.unread_count,
          0,
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch conversations";
      })

      // Fetch conversation messages
      .addCase(fetchConversationMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.currentConversationMessages = action.payload.messages;
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.error.message || "Failed to fetch messages";
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        // Success is handled by refreshing conversations and messages
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.error.message || "Failed to send message";
      })

      // Fetch templates
      .addCase(fetchConversationTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.error = null;
      })
      .addCase(fetchConversationTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload.templates;
      })
      .addCase(fetchConversationTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.error =
          action.error.message || "Failed to fetch conversation templates";
      })

      // Create template
      .addCase(createConversationTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversationTemplate.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh templates after creating
      })
      .addCase(createConversationTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to create conversation template";
      });
  },
});

export const {
  setSelectedConversation,
  markConversationAsRead,
  addIncomingMessage,
  clearError,
  updateUnreadCount,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
