import styles from "./Spinner.module.css";

interface SpinnerProps {
  /** Accessible status text; also shown when `label` is not visually hidden. */
  label?: string;
  /** Render the label beneath the spinner instead of only for screen readers. */
  showLabel?: boolean;
}

/** Lightweight loading indicator. */
export function Spinner({ label = "Cargando…", showLabel = false }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.ring} aria-hidden="true" />
      <span className={showLabel ? styles.label : styles.srOnly}>{label}</span>
    </div>
  );
}
