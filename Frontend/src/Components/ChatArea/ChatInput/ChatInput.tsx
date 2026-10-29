import { ArrowUp, Square } from "lucide-react";
import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { appConfig } from "../../../Utils/AppConfig";
import "./ChatInput.css";

const MAX_HEIGHT = 200;

interface ChatInputProps {
    onSend: (content: string) => void;
    onStop: () => void;
    isBusy: boolean; // A reply is being written - show the Stop button.
}

export function ChatInput({ onSend, onStop, isBusy }: ChatInputProps) {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const canSend = text.trim().length > 0 && !isBusy;

    // Grow with the text (up to MAX_HEIGHT, then scroll).
    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
    }, [text]);

    function send(event?: FormEvent) {
        event?.preventDefault();
        if (!canSend) return;
        onSend(text);
        setText("");
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        // Enter sends, Shift+Enter adds a new line. On touch screens Enter always adds a new line.
        const isTouch = window.matchMedia("(pointer: coarse)").matches;
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !isTouch) {
            event.preventDefault();
            send();
        }
    }

    return (
        <form className="ChatInput" onSubmit={send}>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={event => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                aria-label="Message"
                rows={1}
                dir="auto"
                maxLength={appConfig.maxMessageLength}
                autoFocus
            />
            {isBusy ? (
                <button type="button" className="ChatInput-button" onClick={onStop} aria-label="Stop generating" title="Stop generating">
                    <Square size={14} fill="currentColor" />
                </button>
            ) : (
                <button type="submit" className="ChatInput-button" disabled={!canSend} aria-label="Send message" title="Send message">
                    <ArrowUp size={20} />
                </button>
            )}
        </form>
    );
}
