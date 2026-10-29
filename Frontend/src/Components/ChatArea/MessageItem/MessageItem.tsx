import type { ChatMessageModel } from "../../../Models/ChatMessageModel";
import { getTextDirection } from "../../../Utils/TextUtils";
import { CopyButton } from "../../SharedArea/CopyButton/CopyButton";
import { MarkdownContent } from "../MarkdownContent/MarkdownContent";
import { TypingIndicator } from "../TypingIndicator/TypingIndicator";
import "./MessageItem.css";

/** One message: the user's on the right (bubble), the AI's on the left (formatted text). */
export function MessageItem({ message }: { message: ChatMessageModel }) {
    if (message.role === "user") {
        return (
            <article className={`MessageItem MessageItem-user ${message.isFailed ? "failed" : ""}`}>
                <h4 className="visually-hidden">You said:</h4>
                <div className="MessageItem-bubble" dir={getTextDirection(message.content)}>{message.content}</div>
                {message.isFailed && <span className="MessageItem-status">Not sent</span>}
            </article>
        );
    }

    const isWaiting = message.isStreaming && message.content === "";
    return (
        <article className="MessageItem MessageItem-assistant" aria-busy={message.isStreaming}>
            <h4 className="visually-hidden">The chat said:</h4>
            {isWaiting ? <TypingIndicator /> : <MarkdownContent content={message.content} isStreaming={message.isStreaming} />}
            {!message.isStreaming && message.content && (
                <div className="MessageItem-actions">
                    <CopyButton getText={() => message.content} />
                </div>
            )}
        </article>
    );
}
