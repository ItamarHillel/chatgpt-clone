import "./Logo.css";

export function Logo({ size = 28 }: { size?: number }) {
    return (
        <svg className="Logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" className="Logo-background" />
            <path className="Logo-bubble" d="M8 11.5A3.5 3.5 0 0 1 11.5 8h9a3.5 3.5 0 0 1 3.5 3.5v6a3.5 3.5 0 0 1-3.5 3.5H15.5L11 24.5V21h0.5A3.5 3.5 0 0 1 8 17.5z" />
            <circle className="Logo-background" cx="12.5" cy="14.5" r="1.4" />
            <circle className="Logo-background" cx="16" cy="14.5" r="1.4" />
            <circle className="Logo-background" cx="19.5" cy="14.5" r="1.4" />
        </svg>
    );
}
