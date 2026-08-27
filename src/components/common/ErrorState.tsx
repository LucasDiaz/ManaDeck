import { AlertTriangle } from "lucide-react";
import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  title?: string;
  /** Error object or message to display. */
  error?: unknown;
  /** When provided, renders a "retry" button. */
  onRetry?: () => void;
}

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Algo salió mal. Inténtalo de nuevo.";
}

/** Inline error panel with an optional retry action. */
export function ErrorState({
  title = "No se pudo cargar",
  error,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.wrapper} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <AlertTriangle size={22} strokeWidth={1.9} />
      </span>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{messageFrom(error)}</p>
      {onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
