import styles from "./CardCardSkeleton.module.css";

/** Loading placeholder matching CardCard's footprint. */
export function CardCardSkeleton() {
  return (
    <li className={styles.wrapper} aria-hidden="true">
      <div className={styles.art} />
      <div className={styles.body}>
        <span className={styles.lineWide} />
        <span className={styles.lineNarrow} />
      </div>
    </li>
  );
}
