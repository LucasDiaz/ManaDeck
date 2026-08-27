import type { CSSProperties } from "react";
import type { ColorCode } from "../../types";
import styles from "./ManaSymbol.module.css";

/** Symbols this badge can render on its own (mono-colour + colorless). */
export type ManaSymbolCode = ColorCode;

const LABELS: Record<ManaSymbolCode, string> = {
  W: "Blanco",
  U: "Azul",
  B: "Negro",
  R: "Rojo",
  G: "Verde",
  C: "Incoloro",
};

interface ManaSymbolProps {
  symbol: ManaSymbolCode;
  /** Pixel diameter. */
  size?: number;
  /** Luminous glow + ring, e.g. when used as an active filter chip. */
  selected?: boolean;
  /** Render as a real <button> for the colour selector. */
  onToggle?: (symbol: ManaSymbolCode) => void;
}

/** Circular MTG mana badge with a per-colour radial glow. */
export function ManaSymbol({
  symbol,
  size = 28,
  selected = false,
  onToggle,
}: ManaSymbolProps) {
  const label = LABELS[symbol];
  const className = selected
    ? `${styles.badge} ${styles.selected}`
    : styles.badge;
  const style = { "--size": `${size}px` } as CSSProperties;

  if (onToggle) {
    return (
      <button
        type="button"
        className={className}
        data-color={symbol}
        style={style}
        aria-pressed={selected}
        aria-label={`${label}${selected ? " (activo)" : ""}`}
        onClick={() => onToggle(symbol)}
      >
        <span aria-hidden="true">{symbol}</span>
      </button>
    );
  }

  return (
    <span
      className={className}
      data-color={symbol}
      style={style}
      role="img"
      aria-label={label}
    >
      <span aria-hidden="true">{symbol}</span>
    </span>
  );
}
