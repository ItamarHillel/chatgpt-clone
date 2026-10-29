import { ArrowDown, CircleAlert, RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ChatError } from "../../../Context/ChatContext";
import type { ChatMessageModel } from "../../../Models/ChatMessageModel";
import { MessageItem } from "../MessageItem/MessageItem";
import "./MessageList.css";

const NEAR_BOTTOM = 80; // px

interface MessageListProps {
    messages: ChatMessageModel[];
    error: ChatError | null;
    onRetry: () => void;
}

export function MessageList({ messages, error, onRetry }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stickToBottomRef = useRef(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const lastUserMessageKey = messages.findLast(message => message.role === "user")?.key;

    function scrollToBottom(behavior: ScrollBehavior = "auto") {
        const element = scrollRef.current;
        if (element) element.scrollTo({ top: element.scrollHeight, behavior });
    }

    function handleScroll() {
        const element = scrollRef.current;
        if (!element) return;
        const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
        stickToBottomRef.current = distance < NEAR_BOTTOM;
        setShowScrollButton(distance > NEAR_BOTTOM * 2);
    }

    // A new user message always brings the view to the bottom.
    useLayoutEffect(() => {
        stickToBottomRef.current = true;
        scrollToBottom();
    }, [lastUserMessageKey]);

    // Follow the reply while it is written - unless the user scrolled up to read.
    useLayoutEffect(() => {
        if (stickToBottomRef.current) scrollToBottom();
    }, [messages, error]);

    return (
        <div className="MessageList">
            <div className="MessageList-scroll" ref={scrollRef} onScroll={handleScroll}>
                <div className="MessageList-content" role="log" aria-live="polite" aria-label="Conversation">
                    {messages.map(message => <MessageItem key={message.key} message={message} />)}

                    {error && (
                        <div className="MessageList-error" role="alert">
                            <CircleAlert size={18} />
                            <span>{error.message}</span>
                            <button className="button button-secondary" onClick={onRetry}>
                                <RotateCcw size={16} /> Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showScrollButton && (
                <button className="MessageList-scroll-button" onClick={() => scrollToBottom("smooth")} aria-label="Scroll to the latest message">
                    <ArrowDown size={18} />
                </button>
            )}
        </div>
    );
}
