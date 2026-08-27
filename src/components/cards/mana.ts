import type { ManaSymbolCode } from "./ManaSymbol";

/** The tokens ManaSymbol can render as a coloured badge on its own. */
export const MONO_SYMBOLS: ReadonlySet<string> = new Set([
  "W",
  "U",
  "B",
  "R",
  "G",
  "C",
]);

export function isMonoSymbol(token: string): token is ManaSymbolCode {
  return MONO_SYMBOLS.has(token);
}

/** Split a Scryfall mana cost (`"{2}{U}{U}"`) into its inner tokens. */
export function parseManaCost(cost: string | undefined | null): string[] {
  if (!cost) return [];
  const tokens = cost.match(/\{([^}]+)\}/g);
  return tokens ? tokens.map((t) => t.slice(1, -1)) : [];
}
