import type { Role } from "./RoleModel";

/** A message saved in the database, as returned by the REST API. */
export interface MessageModel {
    messageId: number;
    conversationId: string;
    role: Role;
    content: string;
    createdAt: string;
}
