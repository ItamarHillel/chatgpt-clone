import type { Role } from "./RoleModel";

/** A message as shown in the chat window - it may still be streaming or not saved yet. */
export interface ChatMessageModel {
    key: string;
    role: Role;
    content: string;
    isStreaming?: boolean; // The AI is still writing this reply.
    isFailed?: boolean;    // A user message that got no reply (error / stopped), so it was not saved.
}
