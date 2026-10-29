import { Moon, Sun } from "lucide-react";
import { useState } from "react";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
    // index.html sets the initial theme before React starts.
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
    const [theme, setTheme] = useState<Theme>(getCurrentTheme);

    function toggleTheme() {
        const newTheme: Theme = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = newTheme;
        try {
            localStorage.setItem("theme", newTheme);
        }
        catch { /* Storage blocked - the theme just won't be remembered. */ }
        setTheme(newTheme);
    }

    return (
        <button className={className} onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
    );
}
