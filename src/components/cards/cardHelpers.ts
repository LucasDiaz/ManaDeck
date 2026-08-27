import type { Card, Rarity } from "../../types";

export interface CardPrice {
  symbol: "$" | "€";
  amount: string;
  /** "usd" | "eur" — which price was used. */
  currency: "usd" | "eur";
}

/** Pick the best available price (USD, then EUR). Returns null when unpriced. */
export function formatCardPrice(card: Card): CardPrice | null {
  const usd = card.prices?.usd;
  if (usd) return { symbol: "$", amount: usd, currency: "usd" };
  const eur = card.prices?.eur;
  if (eur) return { symbol: "€", amount: eur, currency: "eur" };
  return null;
}

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Común",
  uncommon: "Infrecuente",
  rare: "Rara",
  mythic: "Mítica",
  special: "Especial",
  bonus: "Bonus",
};

export function rarityLabel(rarity: Rarity): string {
  return RARITY_LABELS[rarity] ?? rarity;
}

/**
 * The line shown under the card name: prefer the printed mana cost; fall back
 * to the type line. For multi-faced cards use the front face's values.
 */
export function cardSubline(card: Card): { manaCost?: string; typeLine: string } {
  const face = card.card_faces?.[0];
  const manaCost = card.mana_cost || face?.mana_cost || "";
  const typeLine = card.type_line || face?.type_line || "";
  return { manaCost: manaCost || undefined, typeLine };
}
