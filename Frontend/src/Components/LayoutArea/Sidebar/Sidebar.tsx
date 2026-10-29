import { SquarePen, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../../../Context/useChat";
import { appConfig } from "../../../Utils/AppConfig";
import { Logo } from "../../SharedArea/Logo/Logo";
import { ThemeToggle } from "../../SharedArea/ThemeToggle/ThemeToggle";
import { ConversationList } from "../ConversationList/ConversationList";
import { Menu } from "../Menu/Menu";
import "./Sidebar.css";

interface SidebarProps {
    onClose: () => void; // Closes the mobile drawer.
}

export function Sidebar({ onClose }: SidebarProps) {
    const { newChat } = useChat();
    const navigate = useNavigate();

    function startNewChat() {
        newChat();
        navigate("/");
        onClose();
    }

    return (
        <aside className="Sidebar">
            <div className="Sidebar-top">
                <Link to="/" className="Sidebar-brand" onClick={startNewChat}>
                    <Logo />
                    <span>{appConfig.appName}</span>
                </Link>
                <button className="icon-button Sidebar-close" onClick={onClose} aria-label="Close menu">
                    <X size={20} />
                </button>
            </div>

            <button className="Sidebar-item Sidebar-new-chat" onClick={startNewChat}>
                <SquarePen size={18} />
                New chat
            </button>

            <Menu onNavigate={onClose} />

            <ConversationList onNavigate={onClose} />

            <div className="Sidebar-footer">
                <ThemeToggle className="Sidebar-item" />
                <p className="Sidebar-credit">Developed by {appConfig.developer.name}</p>
            </div>
        </aside>
    );
}
