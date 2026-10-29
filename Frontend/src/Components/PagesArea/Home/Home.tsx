import { CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "../../../Context/useChat";
import { appConfig } from "../../../Utils/AppConfig";
import { ChatInput } from "../../ChatArea/ChatInput/ChatInput";
import { EmptyState } from "../../ChatArea/EmptyState/EmptyState";
import { MessageList } from "../../ChatArea/MessageList/MessageList";
import "./Home.css";

/** The chat page: "/" is a new chat, "/c/:conversationId" is a saved conversation. */
export function Home() {
    const { conversationId: routeConversationId } = useParams();
    const { conversations, conversationId, messages, status, error, loadError, newChat, openConversation, sendMessage, stop, retry } = useChat();
    const navigate = useNavigate();

    useEffect(() => {
        if (routeConversationId) void openConversation(routeConversationId);
        else newChat();
    }, [routeConversationId, openConversation, newChat]);

    const title = conversations.find(c => c.conversationId === conversationId)?.title;
    useEffect(() => {
        document.title = title ? `${title} | ${appConfig.appName}` : appConfig.appName;
    }, [title]);

    const isBusy = status === "waiting" || status === "streaming";

    if (loadError) {
        return (
            <div className="Home Home-center">
                <CircleAlert size={36} className="Home-error-icon" />
                <h2>Couldn't open this chat</h2>
                <p>{loadError}</p>
                <button className="button" onClick={() => { newChat(); navigate("/"); }}>Start a new chat</button>
            </div>
        );
    }

    if (status === "loading") {
        return (
            <div className="Home Home-center" role="status" aria-label="Loading the chat">
                <LoaderCircle size={28} className="spin" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="Home Home-new-chat">
                <EmptyState />
                <ChatInput onSend={sendMessage} onStop={stop} isBusy={isBusy} />
            </div>
        );
    }

    return (
        <div className="Home">
            <MessageList messages={messages} error={error} onRetry={retry} />
            <div className="Home-footer">
                <ChatInput key={conversationId} onSend={sendMessage} onStop={stop} isBusy={isBusy} />
                <p className="Home-disclaimer">The AI can make mistakes. Check important info.</p>
            </div>
        </div>
    );
}
