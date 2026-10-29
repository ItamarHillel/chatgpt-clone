import type { ConversationModel } from "./ConversationModel";
import type { MessageModel } from "./MessageModel";

/** The result of sending a message: the saved user message and the AI reply. */
export interface ChatExchangeModel {
    conversation: ConversationModel;
    userMessage: MessageModel;
    assistantMessage: MessageModel;
}
