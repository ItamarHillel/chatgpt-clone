import { House, Info } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useChat } from "../../../Context/useChat";
import "./Menu.css";

interface MenuProps {
    onNavigate: () => void;
}

/** The main menu - navigates between the Home page (the chat) and the About page. */
export function Menu({ onNavigate }: MenuProps) {
    const { conversationId } = useChat();
    // "Home" returns to the open chat, so visiting About doesn't lose it.
    const homePath = conversationId ? `/c/${conversationId}` : "/";

    return (
        <nav className="Menu" aria-label="Main menu">
            <NavLink to={homePath} end className="Sidebar-item" onClick={onNavigate}>
                <House size={18} />
                Home
            </NavLink>
            <NavLink to="/about" className="Sidebar-item" onClick={onNavigate}>
                <Info size={18} />
                About
            </NavLink>
        </nav>
    );
}
