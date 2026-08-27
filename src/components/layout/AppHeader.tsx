import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import styles from "./AppHeader.module.css";

/** Slim persistent brand header. */
export function AppHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label="ManaDeck — Inicio">
        <span className={styles.mark} aria-hidden="true">
          <Sparkles size={18} strokeWidth={2.2} />
        </span>
        <span className={styles.wordmark}>
          Mana<span className={styles.accent}>Deck</span>
        </span>
      </Link>
    </header>
  );
}
