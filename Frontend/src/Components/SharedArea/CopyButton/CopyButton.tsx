import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import "./CopyButton.css";

interface CopyButtonProps {
    getText: () => string;
    showLabel?: boolean;
}

export function CopyButton({ getText, showLabel = false }: CopyButtonProps) {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) return;
        const timer = setTimeout(() => setIsCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [isCopied]);

    async function copy() {
        try {
            await navigator.clipboard.writeText(getText());
            setIsCopied(true);
        }
        catch { /* Clipboard not available (e.g. insecure context). */ }
    }

    const label = isCopied ? "Copied!" : "Copy";
    return (
        <button className="CopyButton" onClick={copy} aria-label={label} title={label}>
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            {showLabel && <span>{label}</span>}
        </button>
    );
}
