import type { CSSProperties } from "react";
import { ManaSymbol } from "./ManaSymbol";
import { isMonoSymbol, parseManaCost } from "./mana";
import styles from "./ManaCost.module.css";

interface ManaCostProps {
  cost: string | undefined | null;
  size?: number;
}

/** Renders a row of mana badges for a card's casting cost. */
export function ManaCost({ cost, size = 20 }: ManaCostProps) {
  const tokens = parseManaCost(cost);
  if (tokens.length === 0) return null;

  return (
    <span
      className={styles.row}
      aria-label={`Coste de maná: ${tokens.join(" ")}`}
    >
      {tokens.map((token, i) => {
        const key = `${token}-${i}`;
        if (isMonoSymbol(token)) {
          return <ManaSymbol key={key} symbol={token} size={size} />;
        }
        return (
          <span
            key={key}
            className={styles.generic}
            style={{ "--size": `${size}px` } as CSSProperties}
            aria-hidden="true"
          >
            {token.replace(/\//g, "")}
          </span>
        );
      })}
    </span>
  );
}
