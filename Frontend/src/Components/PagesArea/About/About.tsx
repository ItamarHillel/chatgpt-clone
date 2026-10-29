import { ArrowRight, CircleAlert, CircleCheck, Code, Database, ExternalLink, History, Languages, LoaderCircle, Mail, MessagesSquare, MonitorSmartphone, Server, Sparkles, Zap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { HealthModel } from "../../../Models/HealthModel";
import { healthService } from "../../../Services/HealthService";
import { appConfig } from "../../../Utils/AppConfig";
import { getErrorMessage } from "../../../Utils/ErrorUtils";
import "./About.css";

const features: { icon: ReactNode; title: string; text: string }[] = [
    { icon: <MessagesSquare size={20} />, title: "Conversations with context", text: "Every reply is generated from the whole conversation, so the chat remembers what was said before." },
    { icon: <Zap size={20} />, title: "Live streaming replies", text: "The answer appears word by word while it is being written, and can be stopped at any moment." },
    { icon: <History size={20} />, title: "Saved chat history", text: "All conversations are stored in MySQL - reopen or delete any previous chat from the sidebar." },
    { icon: <Code size={20} />, title: "Rich formatting", text: "Markdown replies with tables, lists and syntax-highlighted code blocks with a copy button." },
    { icon: <Languages size={20} />, title: "Hebrew & English", text: "Right-to-left text is detected automatically in messages, replies and chat titles." },
    { icon: <MonitorSmartphone size={20} />, title: "Responsive design", text: "Works on desktop and mobile, with light and dark themes." },
];

const technologies = {
    "Client": ["React 19", "TypeScript", "Vite", "React Router", "Axios", "React Markdown"],
    "Server": ["Python", "FastAPI", "Pydantic", "Uvicorn", "Server-Sent Events", "pytest"],
    "Data & AI": ["MySQL 8", "OpenAI Responses API"],
};

function SystemStatus() {
    const [health, setHealth] = useState<HealthModel | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        healthService.getHealth()
            .then(setHealth)
            .catch(err => setError(getErrorMessage(err)));
    }, []);

    if (error) return <p className="About-status About-status-error"><CircleAlert size={18} /> {error}</p>;
    if (!health) return <p className="About-status"><LoaderCircle size={18} className="spin" /> Checking the server…</p>;

    return (
        <ul className="About-status-list">
            <li><CircleCheck size={18} className="ok" /> Server: online</li>
            <li><CircleCheck size={18} className="ok" /> Database: {health.database}</li>
            <li>
                {health.openaiConfigured ? <CircleCheck size={18} className="ok" /> : <CircleAlert size={18} className="error" />}
                AI model: {health.model}{health.openaiConfigured ? "" : " (API key missing)"}
            </li>
        </ul>
    );
}

export function About() {
    useEffect(() => {
        document.title = `About | ${appConfig.appName}`;
    }, []);

    const { developer } = appConfig;

    return (
        <div className="About">
            <div className="About-content">
                <header className="About-hero">
                    <h1>About {appConfig.appName}</h1>
                    <p>
                        A full stack ChatGPT-style web application. Ask anything, keep the conversation going in the same context,
                        and come back to your previous chats at any time.
                    </p>
                </header>

                <section aria-labelledby="features-title">
                    <h2 id="features-title">Features</h2>
                    <div className="About-features">
                        {features.map(feature => (
                            <div className="About-card" key={feature.title}>
                                <span className="About-card-icon">{feature.icon}</span>
                                <h3>{feature.title}</h3>
                                <p>{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="architecture-title">
                    <h2 id="architecture-title">How it works</h2>
                    <div className="About-flow">
                        <div className="About-node"><MonitorSmartphone size={22} /><strong>React client</strong><span>Single Page Application</span></div>
                        <div className="About-arrow"><span>REST + SSE</span><ArrowRight size={20} /></div>
                        <div className="About-node"><Server size={22} /><strong>FastAPI server</strong><span>Python REST API</span></div>
                        <div className="About-arrow"><span>SQL / HTTPS</span><ArrowRight size={20} /></div>
                        <div className="About-node-group">
                            <div className="About-node"><Database size={22} /><strong>MySQL</strong><span>Conversations & messages</span></div>
                            <div className="About-node"><Sparkles size={22} /><strong>OpenAI API</strong><span>Generates the replies</span></div>
                        </div>
                    </div>
                    <p className="About-note">
                        The browser talks only to our server. The OpenAI API key is kept in the server's <code>.env</code> file and never reaches the client.
                        For every message the server loads the conversation from MySQL, sends it to OpenAI, streams the reply back
                        and saves both messages.
                    </p>
                </section>

                <section aria-labelledby="status-title">
                    <h2 id="status-title">System status</h2>
                    <div className="About-card"><SystemStatus /></div>
                </section>

                <section aria-labelledby="tech-title">
                    <h2 id="tech-title">Technologies</h2>
                    <div className="About-tech">
                        {Object.entries(technologies).map(([group, items]) => (
                            <div key={group}>
                                <h3>{group}</h3>
                                <ul className="About-chips">
                                    {items.map(item => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="developer-title">
                    <h2 id="developer-title">The developer</h2>
                    <div className="About-card About-developer">
                        <div className="About-avatar" aria-hidden="true">
                            {developer.name.split(" ").map(part => part[0]).join("")}
                        </div>
                        <div>
                            <h3>{developer.name}</h3>
                            <p className="About-role">{developer.role}</p>
                            <p>
                                This system was built as the final project of the Full Stack Web Developer course at John Bryce
                                (Database, Python, REST API, React and GenAI).
                            </p>
                            <div className="About-links">
                                <a className="button button-secondary" href={developer.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={16} /> GitHub
                                </a>
                                <a className="button button-secondary" href={appConfig.repositoryUrl} target="_blank" rel="noopener noreferrer">
                                    <Code size={16} /> Source code
                                </a>
                                <a className="button button-secondary" href={`mailto:${developer.email}`}>
                                    <Mail size={16} /> {developer.email}
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
