/* Minimal Scryfall type surface.
 * Expanded in later phases when the API layer is implemented.
 * Reference: https://scryfall.com/docs/api
 */

/** Scryfall object envelope discriminator. */
export type ScryfallObject = "card" | "list" | "set" | "error";

/** A Magic: The Gathering card as returned by Scryfall. */
export interface ScryfallCard {
  object: "card";
  id: string;
  name: string;
  lang: string;
  released_at: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus";
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  image_uris?: ScryfallImageUris;
  prices?: ScryfallPrices;
  scryfall_uri: string;
}

export interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallPrices {
  usd: string | null;
  usd_foil: string | null;
  eur: string | null;
  tix: string | null;
}

/** Paginated list wrapper. */
export interface ScryfallList<T> {
  object: "list";
  total_cards?: number;
  has_more: boolean;
  next_page?: string;
  data: T[];
}

/** Error payload. */
export interface ScryfallError {
  object: "error";
  status: number;
  code: string;
  details: string;
}
