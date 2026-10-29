import { useEffect, useRef, useState, type ReactNode } from "react";
import { getErrorMessage } from "../../../Utils/ErrorUtils";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
    title: string;
    message: ReactNode;
    confirmText: string;
    busyText: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

/** A modal confirmation (native <dialog>: focus trap, Esc to close, backdrop). */
export function ConfirmDialog({ title, message, confirmText, busyText, onConfirm, onCancel }: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    function cancel() {
        if (!isBusy) onCancel();
    }

    async function confirm() {
        setIsBusy(true);
        setError(null);
        try {
            await onConfirm();
        }
        catch (err) {
            setError(getErrorMessage(err));
            setIsBusy(false);
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="ConfirmDialog"
            aria-labelledby="confirm-dialog-title"
            onCancel={event => { event.preventDefault(); cancel(); }}
            onClick={event => { if (event.target === dialogRef.current) cancel(); }}
        >
            <div className="ConfirmDialog-content">
                <h2 id="confirm-dialog-title">{title}</h2>
                <p>{message}</p>
                {error && <p className="ConfirmDialog-error" role="alert">{error}</p>}
                <div className="ConfirmDialog-actions">
                    <button className="button button-secondary" onClick={cancel} disabled={isBusy}>Cancel</button>
                    <button className="button button-danger" onClick={confirm} disabled={isBusy}>{isBusy ? busyText : confirmText}</button>
                </div>
            </div>
        </dialog>
    );
}
