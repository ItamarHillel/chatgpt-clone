import axios from "axios";

const SERVER_UNREACHABLE = "Can't reach the server. Make sure the backend is running and try again.";

/** A message that can be shown to the user, for any error thrown by axios / fetch / our services. */
export function getErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const serverMessage = (err.response?.data as { error?: string } | undefined)?.error;
        if (serverMessage) return serverMessage;
        return err.response ? `Server error (${err.response.status}).` : SERVER_UNREACHABLE;
    }
    if (err instanceof TypeError) return SERVER_UNREACHABLE; // fetch() network failure.
    if (err instanceof Error) return err.message;
    return "Something went wrong. Please try again.";
}
