import type { Card } from "./card";

/** Lightweight snapshot of a card, stored in localStorage collections. */
export interface CardSummary {
  id: string;
  name: string;
  setName: string;
  collectorNumber?: string;
  image?: string;
  typeLine?: string;
}

/** One entry in the recently-viewed history. */
export interface HistoryEntry extends CardSummary {
  /** Epoch ms of the most recent visit. */
  viewedAt: number;
}

/** One card saved inside a wishlist collection, with deck-building metadata. */
export interface WishlistItem extends CardSummary {
  priority: number;
  note?: string;
  addedAt: number;
}

/**
 * A named group of wanted cards — e.g. "Commander Deck: Atraxa",
 * "Modern Staples", "Trades / Sideboard".
 */
export interface WishlistCollection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  items: WishlistItem[];
}

/** Fields the wishlist form collects for one card (collection chosen separately). */
export interface WishlistDraft {
  priority: number;
  note?: string;
}

export function toCardSummary(card: Card, image?: string): CardSummary {
  return {
    id: card.id,
    name: card.name,
    setName: card.set_name,
    collectorNumber: card.collector_number,
    image,
    typeLine: card.type_line || card.card_faces?.[0]?.type_line,
  };
}
