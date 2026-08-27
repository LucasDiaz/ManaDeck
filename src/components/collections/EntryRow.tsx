import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Trash2, ImageOff } from "lucide-react";
import styles from "./EntryRow.module.css";

interface EntryRowProps {
  to: string;
  name: string;
  subtitle?: string;
  image?: string;
  /** Extra badges/chips shown under the subtitle. */
  meta?: ReactNode;
  onRemove: () => void;
  removeLabel?: string;
}

/** Compact card row used by the Wishlist and History views. */
export function EntryRow({
  to,
  name,
  subtitle,
  image,
  meta,
  onRemove,
  removeLabel = "Quitar",
}: EntryRowProps) {
  return (
    <li className={styles.row}>
      <Link to={to} className={styles.link}>
        <span className={styles.thumb}>
          {image ? (
            <img src={image} alt="" loading="lazy" decoding="async" />
          ) : (
            <ImageOff size={16} aria-hidden="true" />
          )}
        </span>
        <span className={styles.body}>
          <span className={styles.name}>{name}</span>
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </span>
      </Link>
      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={`${removeLabel}: ${name}`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}
