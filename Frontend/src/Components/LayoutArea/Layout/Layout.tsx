import { Menu as MenuIcon, SquarePen } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../../Context/useChat";
import { appConfig } from "../../../Utils/AppConfig";
import { Routing } from "../Routing/Routing";
import { Sidebar } from "../Sidebar/Sidebar";
import "./Layout.css";

export function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile only - on desktop the sidebar is always shown.
    const { newChat } = useChat();
    const navigate = useNavigate();

    function startNewChat() {
        newChat();
        navigate("/");
    }

    return (
        <div className={`Layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
            <div className="Layout-overlay" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />

            <div className="Layout-main">
                <header className="Layout-header">
                    <button className="icon-button Layout-mobile-only" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
                        <MenuIcon size={20} />
                    </button>
                    <span className="Layout-title">{appConfig.appName}</span>
                    <button className="icon-button Layout-mobile-only" onClick={startNewChat} aria-label="New chat">
                        <SquarePen size={20} />
                    </button>
                </header>

                <main className="Layout-content">
                    <Routing />
                </main>
            </div>
        </div>
    );
}
