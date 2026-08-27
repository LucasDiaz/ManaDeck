import { Fragment, type ReactNode } from "react";
import { getManaSymbolUrl } from "../../services";
import { manaSymbolLabel } from "./manaLabels";
import styles from "./OracleText.module.css";

const TOKEN = /(\{[^}]+\})/g;
const IS_TOKEN = /^\{[^}]+\}$/;

/**
 * Convert a line of oracle text into React nodes, replacing inline symbol
 * notation (`{T}`, `{W}`, `{1}`, `{G/U}`, …) with official Scryfall SVGs.
 */
export function renderOracleTextWithSymbols(text: string): ReactNode {
  return text.split(TOKEN).map((part, index) => {
    if (IS_TOKEN.test(part)) {
      return (
        <img
          key={index}
          src={getManaSymbolUrl(part)}
          alt={manaSymbolLabel(part)}
          className={styles.inline}
          width={15}
          height={15}
          loading="lazy"
          decoding="async"
        />
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
