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

/** One saved wishlist entry, with the user's deck-building metadata. */
export interface WishlistEntry extends CardSummary {
  priority: number;
  category: string;
  note?: string;
  addedAt: number;
}

/** Fields the WishlistModal collects from the user. */
export interface WishlistDraft {
  priority: number;
  category: string;
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
