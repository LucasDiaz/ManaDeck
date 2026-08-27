import type { ReactNode } from "react";
import styles from "./CardGrid.module.css";

interface CardGridProps {
  children: ReactNode;
  /** Optional accessible label for the grid region. */
  "aria-label"?: string;
}

/**
 * Responsive CSS Grid container.
 * Breakpoints follow RF8 exactly (see CLAUDE.md):
 *   ≤480 → 2 · 481–767 → 3 · 768–1023 → 3 · ≥1024 → 4 per row.
 */
export function CardGrid({ children, "aria-label": ariaLabel }: CardGridProps) {
  return (
    <ul className={styles.grid} role="list" aria-label={ariaLabel}>
      {children}
    </ul>
  );
}
