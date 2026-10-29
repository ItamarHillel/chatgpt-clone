import type { MessageModel } from "./MessageModel";

export interface ConversationModel {
    conversationId: string;
    title: string | null; // null until the first message is sent.
    createdAt: string;
    updatedAt: string;
}

export interface ConversationDetailsModel extends ConversationModel {
    messages: MessageModel[];
}
