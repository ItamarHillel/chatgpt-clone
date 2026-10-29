import type { ChatExchangeModel } from "../Models/ChatExchangeModel";
import { appConfig } from "../Utils/AppConfig";

interface ServerSentEvent {
    event: string;
    data: unknown;
}

class ChatService {

    /**
     * Sends a user message and streams the AI reply (Server-Sent Events).
     * `onDelta` is called with every new piece of the reply as soon as it arrives.
     * Resolves with the saved user message + reply. Rejects with an AbortError when `signal` is aborted.
     */
    public async streamMessage(conversationId: string, content: string, onDelta: (delta: string) => void, signal: AbortSignal): Promise<ChatExchangeModel> {
        const response = await fetch(`${appConfig.conversationsUrl}/${conversationId}/messages/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
            body: JSON.stringify({ content }),
            signal,
        });

        // Errors found before the stream starts (404, 422, 503...) come back as regular JSON errors.
        if (!response.ok) throw new Error(await this.readError(response));
        if (!response.body) throw new Error("This browser does not support streaming responses.");

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += value.replace(/\r\n/g, "\n");

                let boundary: number;
                while ((boundary = buffer.indexOf("\n\n")) !== -1) {
                    const sse = this.parseEvent(buffer.slice(0, boundary));
                    buffer = buffer.slice(boundary + 2);
                    if (!sse) continue;

                    if (sse.event === "delta") onDelta((sse.data as { content: string }).content);
                    else if (sse.event === "done") return sse.data as ChatExchangeModel;
                    else if (sse.event === "error") throw new Error((sse.data as { error: string }).error);
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        throw new Error("The connection to the server was lost before the reply was completed.");
    }

    private parseEvent(block: string): ServerSentEvent | null {
        let event = "message";
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        }
        if (dataLines.length === 0) return null;
        return { event, data: JSON.parse(dataLines.join("\n")) };
    }

    private async readError(response: Response): Promise<string> {
        try {
            const body = await response.json() as { error?: string };
            if (body.error) return body.error;
        }
        catch { /* Not a JSON body. */ }
        return `Server error (${response.status}).`;
    }
}

export const chatService = new ChatService();
