import { ManaSymbol } from "./ManaSymbol";
import { parseManaCost } from "./mana";
import styles from "./ManaCost.module.css";

interface ManaCostProps {
  cost: string | undefined | null;
  size?: number;
}

/** Row of official Scryfall SVG mana symbols for a casting cost. */
export function ManaCost({ cost, size = 18 }: ManaCostProps) {
  const tokens = parseManaCost(cost);
  if (tokens.length === 0) return null;

  return (
    <span
      className={styles.row}
      role="img"
      aria-label={`Coste de maná: ${tokens.join(", ")}`}
    >
      {tokens.map((token, i) => (
        <ManaSymbol key={`${token}-${i}`} symbol={token} size={size} decorative />
      ))}
    </span>
  );
}
