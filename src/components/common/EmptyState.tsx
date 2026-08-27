import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  description?: string;
}

/** Neutral placeholder block for routes without content yet. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.iconRing} aria-hidden="true">
        <Icon size={24} strokeWidth={1.75} />
      </span>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}
