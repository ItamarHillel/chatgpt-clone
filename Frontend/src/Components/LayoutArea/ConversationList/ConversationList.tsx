import { LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useChat } from "../../../Context/useChat";
import type { ConversationModel } from "../../../Models/ConversationModel";
import { groupByDate } from "../../../Utils/DateUtils";
import { ConfirmDialog } from "../../SharedArea/ConfirmDialog/ConfirmDialog";
import "./ConversationList.css";

const UNTITLED = "New chat";

interface ConversationListProps {
    onNavigate: () => void;
}

/** The saved conversations, grouped by date (Today, Yesterday...). */
export function ConversationList({ onNavigate }: ConversationListProps) {
    const { conversations, conversationId, isLoadingConversations, conversationsError, reloadConversations, deleteConversation } = useChat();
    const [conversationToDelete, setConversationToDelete] = useState<ConversationModel | null>(null);
    const activeId = useMatch("/c/:conversationId")?.params.conversationId;

    // A conversation gets its title with its first message - hide empty ones (except the open one).
    const visibleConversations = conversations.filter(c => c.title !== null || c.conversationId === conversationId);
    const groups = groupByDate(visibleConversations);

    return (
        <div className="ConversationList">
            {conversationsError && (
                <div className="ConversationList-status" role="alert">
                    <span>Couldn't load your chats.</span>
                    <button className="icon-button" onClick={() => void reloadConversations()} aria-label="Try again" title="Try again">
                        <RotateCcw size={16} />
                    </button>
                </div>
            )}

            {!conversationsError && isLoadingConversations && conversations.length === 0 && (
                <div className="ConversationList-status">
                    <LoaderCircle size={16} className="spin" /> Loading chats…
                </div>
            )}

            {!conversationsError && !isLoadingConversations && visibleConversations.length === 0 && (
                <p className="ConversationList-status">Your chats will appear here.</p>
            )}

            {groups.map(group => (
                <section key={group.label} aria-label={group.label}>
                    <h3>{group.label}</h3>
                    <ul>
                        {group.conversations.map(conversation => {
                            const title = conversation.title ?? UNTITLED;
                            return (
                                <li key={conversation.conversationId} className={conversation.conversationId === activeId ? "active" : ""}>
                                    <Link to={`/c/${conversation.conversationId}`} onClick={onNavigate} title={title} dir="auto">
                                        {title}
                                    </Link>
                                    <button
                                        className="ConversationList-delete"
                                        onClick={() => setConversationToDelete(conversation)}
                                        aria-label={`Delete chat: ${title}`}
                                        title="Delete chat"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}

            {conversationToDelete && (
                <ConfirmDialog
                    title="Delete chat?"
                    message={<>This will permanently delete <strong dir="auto">{conversationToDelete.title ?? UNTITLED}</strong> and all of its messages.</>}
                    confirmText="Delete"
                    busyText="Deleting…"
                    onConfirm={async () => {
                        await deleteConversation(conversationToDelete.conversationId);
                        setConversationToDelete(null);
                    }}
                    onCancel={() => setConversationToDelete(null)}
                />
            )}
        </div>
    );
}
