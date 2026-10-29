import { createContext } from "react";
import type { ChatMessageModel } from "../Models/ChatMessageModel";
import type { ConversationModel } from "../Models/ConversationModel";

/**
 * idle      - ready for a new message
 * loading   - loading a saved conversation from the server
 * waiting   - message sent, waiting for the first piece of the reply
 * streaming - the reply is being written
 */
export type ChatStatus = "idle" | "loading" | "waiting" | "streaming";

export interface ChatError {
    message: string;
    retryContent: string; // The user message to send again.
}

export interface ChatContextValue {
    // The conversations list (sidebar)
    conversations: ConversationModel[];
    isLoadingConversations: boolean;
    conversationsError: string | null;
    reloadConversations: () => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;

    // The open conversation
    conversationId: string | null;
    messages: ChatMessageModel[];
    status: ChatStatus;
    error: ChatError | null;      // The last message failed.
    loadError: string | null;     // The conversation could not be opened.
    newChat: () => void;
    openConversation: (conversationId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    stop: () => void;
    retry: () => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);
