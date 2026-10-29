class AppConfig {
    public readonly appName = "ChatGPT Clone";

    // REST API (the backend). Can be overridden with VITE_API_URL.
    public readonly apiUrl: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
    public readonly conversationsUrl = this.apiUrl + "/conversations";
    public readonly healthUrl = this.apiUrl + "/health";

    // Must match MAX_MESSAGE_LENGTH on the server.
    public readonly maxMessageLength = 10000;

    public readonly developer = {
        name: "Itamar Hillel",
        role: "Full Stack Web Developer",
        email: "itamarhillel@gmail.com",
        githubUrl: "https://github.com/ItamarHillel",
    };

    public readonly repositoryUrl = "https://github.com/ItamarHillel/chatgpt-clone";
}

export const appConfig = new AppConfig();
