import { renderOracleTextWithSymbols } from "./oracleSymbols";
import styles from "./OracleText.module.css";

interface OracleTextProps {
  text: string | undefined | null;
  /** Optional flavour text rendered in italics below the rules text. */
  flavor?: string | null;
}

/** Styled rules textbox with inline SVG mana symbols. */
export function OracleText({ text, flavor }: OracleTextProps) {
  const lines = (text ?? "").split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0 && !flavor) return null;

  return (
    <div className={styles.box}>
      {lines.map((line, i) => (
        <p key={i} className={styles.paragraph}>
          {renderOracleTextWithSymbols(line)}
        </p>
      ))}
      {flavor ? <p className={styles.flavor}>{flavor}</p> : null}
    </div>
  );
}
