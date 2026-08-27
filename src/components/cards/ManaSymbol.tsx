import type { CSSProperties } from "react";
import { getManaSymbolUrl } from "../../services";
import { manaSymbolLabel } from "./manaLabels";
import styles from "./ManaSymbol.module.css";

/** Codes the mana-colour selector offers. */
export type ManaSymbolCode = "W" | "U" | "B" | "R" | "G" | "C";

interface ManaSymbolProps {
  /** Symbol code, with or without braces: `"{W}"`, `"W"`, `"{G/U}"`, `"2"`… */
  symbol: string;
  /** Pixel size. */
  size?: number;
  /** Luminous ring + full opacity (mana-colour selector active state). */
  selected?: boolean;
  /** Render as a toggle <button> (mana-colour selector). */
  onToggle?: (symbol: string) => void;
  /** Mark the image decorative (label is provided by an ancestor). */
  decorative?: boolean;
}

/** Official Scryfall SVG mana symbol. */
export function ManaSymbol({
  symbol,
  size = 20,
  selected = false,
  onToggle,
  decorative = false,
}: ManaSymbolProps) {
  const label = manaSymbolLabel(symbol);
  const style = { "--size": `${size}px` } as CSSProperties;

  const img = (
    <img
      src={getManaSymbolUrl(symbol)}
      alt={decorative ? "" : label}
      className={styles.img}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );

  if (onToggle) {
    return (
      <button
        type="button"
        className={selected ? `${styles.chip} ${styles.selected}` : styles.chip}
        style={style}
        aria-pressed={selected}
        aria-label={`${label}${selected ? " (activo)" : ""}`}
        onClick={() => onToggle(symbol)}
      >
        {img}
      </button>
    );
  }

  return (
    <span className={styles.badge} style={style}>
      {img}
    </span>
  );
}
