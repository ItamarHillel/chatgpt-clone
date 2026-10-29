import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import type { ChatMessageModel } from "../Models/ChatMessageModel";
import type { ConversationModel } from "../Models/ConversationModel";
import type { MessageModel } from "../Models/MessageModel";
import { chatService } from "../Services/ChatService";
import { conversationsService } from "../Services/ConversationsService";
import { getErrorMessage } from "../Utils/ErrorUtils";
import { makeTitle } from "../Utils/TitleUtils";
import { ChatContext, type ChatContextValue, type ChatError, type ChatStatus } from "./ChatContext";

// The abort reason used by the Stop button (any other abort means the user switched chats).
const STOPPED_BY_USER = "stopped-by-user";

function toChatMessage(message: MessageModel): ChatMessageModel {
    return { key: String(message.messageId), role: message.role, content: message.content };
}

/** Holds the chat state above the pages, so a reply keeps streaming while the user visits another page. */
export function ChatProvider({ children }: PropsWithChildren) {
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<ConversationModel[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [conversationsError, setConversationsError] = useState<string | null>(null);

    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageModel[]>([]);
    const [status, setStatus] = useState<ChatStatus>("idle");
    const [error, setError] = useState<ChatError | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // The async flows below read these refs - they always hold the latest values, without waiting for a render.
    const conversationIdRef = useRef<string | null>(null);
    const statusRef = useRef<ChatStatus>("idle");
    const loadFailedRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);

    const changeStatus = useCallback((newStatus: ChatStatus) => {
        statusRef.current = newStatus;
        setStatus(newStatus);
    }, []);

    const changeConversation = useCallback((id: string | null) => {
        conversationIdRef.current = id;
        setConversationId(id);
    }, []);

    const changeLoadError = useCallback((message: string | null) => {
        loadFailedRef.current = message !== null;
        setLoadError(message);
    }, []);

    /** Cancels what the chat is doing now (loading a conversation / waiting for a reply) before switching chats. */
    const cancelCurrentWork = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
    }, []);

    /** Updates a conversation in the list and moves it to the top (the list is sorted by last activity). */
    const moveToTop = useCallback((id: string, update: (conversation: ConversationModel) => ConversationModel) => {
        setConversations(previous => {
            const conversation = previous.find(c => c.conversationId === id);
            if (!conversation) return previous;
            return [update(conversation), ...previous.filter(c => c.conversationId !== id)];
        });
    }, []);

    // Initial load of the conversations list (isLoadingConversations starts as true).
    useEffect(() => {
        let ignore = false;
        conversationsService.getAllConversations()
            .then(list => { if (!ignore) setConversations(list); })
            .catch(err => { if (!ignore) setConversationsError(getErrorMessage(err)); })
            .finally(() => { if (!ignore) setIsLoadingConversations(false); });
        return () => { ignore = true; };
    }, []);

    const reloadConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            setConversations(await conversationsService.getAllConversations());
            setConversationsError(null);
        }
        catch (err) {
            setConversationsError(getErrorMessage(err));
        }
        finally {
            setIsLoadingConversations(false);
        }
    }, []);

    const newChat = useCallback(() => {
        cancelCurrentWork();
        changeConversation(null);
        setMessages([]);
        setError(null);
        changeLoadError(null);
        changeStatus("idle");
    }, [cancelCurrentWork, changeConversation, changeLoadError, changeStatus]);

    const openConversation = useCallback(async (id: string) => {
        if (id === conversationIdRef.current && !loadFailedRef.current) return; // Already open.

        cancelCurrentWork();
        const controller = new AbortController();
        abortRef.current = controller;
        changeConversation(id);
        setMessages([]);
        setError(null);
        changeLoadError(null);
        changeStatus("loading");

        try {
            const conversation = await conversationsService.getConversation(id, controller.signal);
            setMessages(conversation.messages.map(toChatMessage));
        }
        catch (err) {
            if (!controller.signal.aborted) changeLoadError(getErrorMessage(err));
        }
        finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                changeStatus("idle");
            }
        }
    }, [cancelCurrentWork, changeConversation, changeLoadError, changeStatus]);

    const sendMessage = useCallback(async (text: string) => {
        const content = text.trim();
        if (!content || statusRef.current !== "idle" || loadFailedRef.current) return;

        const controller = new AbortController();
        abortRef.current = controller;
        const userKey = crypto.randomUUID();
        const assistantKey = crypto.randomUUID();
        let received = "";

        // A failed message was never saved, so the new message replaces it.
        setMessages(previous => [
            ...previous.filter(message => !message.isFailed),
            { key: userKey, role: "user", content },
            { key: assistantKey, role: "assistant", content: "", isStreaming: true },
        ]);
        setError(null);
        changeStatus("waiting");

        const updateReply = (update: (message: ChatMessageModel) => ChatMessageModel) =>
            setMessages(previous => previous.map(message => message.key === assistantKey ? update(message) : message));

        // Nothing was saved: remove the empty reply and mark the user message as not sent.
        const fail = (message: string) => {
            setMessages(previous => previous
                .filter(m => m.key !== assistantKey)
                .map(m => m.key === userKey ? { ...m, isFailed: true } : m));
            setError({ message, retryContent: content });
        };

        try {
            let id = conversationIdRef.current;
            if (!id) {
                // The first message of a new chat creates the conversation.
                const conversation = await conversationsService.addConversation(controller.signal);
                if (controller.signal.aborted) return;
                id = conversation.conversationId;
                changeConversation(id);
                setConversations(previous => [conversation, ...previous]);
                if (window.location.pathname === "/") navigate(`/c/${id}`, { replace: true });
            }
            else {
                moveToTop(id, c => ({ ...c, updatedAt: new Date().toISOString() }));
            }

            const exchange = await chatService.streamMessage(id, content, delta => {
                received += delta;
                if (statusRef.current === "waiting") changeStatus("streaming");
                updateReply(message => ({ ...message, content: message.content + delta }));
            }, controller.signal);

            updateReply(message => ({ ...message, content: exchange.assistantMessage.content, isStreaming: false }));
            moveToTop(id, () => exchange.conversation);
        }
        catch (err) {
            // Note: fetch() rejects with the abort *reason* itself, so check the signal rather than the error type.
            if (!controller.signal.aborted) {
                fail(getErrorMessage(err));
            }
            else if (controller.signal.reason === STOPPED_BY_USER) {
                if (received) {
                    // The server saves the part of the reply that was already written - keep showing it.
                    updateReply(message => ({ ...message, isStreaming: false }));
                    const id = conversationIdRef.current;
                    if (id) moveToTop(id, c => ({ ...c, title: c.title ?? makeTitle(content) }));
                }
                else {
                    fail("The reply was stopped before it started.");
                }
            }
            // Any other abort means another chat was opened - its state is already reset.
        }
        finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                changeStatus("idle");
            }
        }
    }, [changeConversation, changeStatus, moveToTop, navigate]);

    const stop = useCallback(() => {
        abortRef.current?.abort(STOPPED_BY_USER);
    }, []);

    const retry = useCallback(() => {
        if (error) void sendMessage(error.retryContent);
    }, [error, sendMessage]);

    const deleteConversation = useCallback(async (id: string) => {
        try {
            await conversationsService.deleteConversation(id);
        }
        catch (err) {
            // Already deleted (e.g. from another tab) - just remove it from the list.
            if (!(axios.isAxiosError(err) && err.response?.status === 404)) throw err;
        }
        setConversations(previous => previous.filter(c => c.conversationId !== id));
        if (id === conversationIdRef.current) {
            newChat();
            navigate("/");
        }
    }, [navigate, newChat]);

    const value = useMemo<ChatContextValue>(() => ({
        conversations, isLoadingConversations, conversationsError, reloadConversations, deleteConversation,
        conversationId, messages, status, error, loadError, newChat, openConversation, sendMessage, stop, retry,
    }), [
        conversations, isLoadingConversations, conversationsError, reloadConversations, deleteConversation,
        conversationId, messages, status, error, loadError, newChat, openConversation, sendMessage, stop, retry,
    ]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
