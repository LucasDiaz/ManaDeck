/** Split a Scryfall mana cost (`"{2}{U}{U}"`) into its inner tokens. */
export function parseManaCost(cost: string | undefined | null): string[] {
  if (!cost) return [];
  const tokens = cost.match(/\{([^}]+)\}/g);
  return tokens ? tokens.map((t) => t.slice(1, -1)) : [];
}
