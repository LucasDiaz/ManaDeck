/* =============================================================
   ManaDeck — Card domain model
   Typed against the Scryfall API: https://scryfall.com/docs/api
   ============================================================= */

/* ---- Primitives ------------------------------------------------ */

/** The five colors of Magic. */
export type Color = "W" | "U" | "B" | "R" | "G";

/** Colors plus the explicit "colorless" marker used by filters. */
export type ColorCode = Color | "C";

/** Card rarities returned by Scryfall. */
export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "mythic"
  | "special"
  | "bonus";

/**
 * Scryfall card layouts. Includes the multi-face layouts
 * (`transform`, `modal_dfc`, `meld`, …) that carry a `card_faces` array.
 * The trailing `(string & {})` keeps autocomplete while tolerating
 * layouts added by Scryfall in the future.
 */
export type CardLayout =
  | "normal"
  | "split"
  | "flip"
  | "transform"
  | "modal_dfc"
  | "meld"
  | "leveler"
  | "class"
  | "case"
  | "saga"
  | "adventure"
  | "mutate"
  | "prototype"
  | "battle"
  | "planar"
  | "scheme"
  | "vanguard"
  | "token"
  | "double_faced_token"
  | "emblem"
  | "augment"
  | "host"
  | "art_series"
  | "reversible_card"
  | (string & {});

/* ---- Nested objects ------------------------------------------- */

/** Image URIs for a card or a single card face. */
export interface ImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

/** Market prices. Any field may be `null` when unavailable. */
export interface Prices {
  usd: string | null;
  usd_foil: string | null;
  usd_etched: string | null;
  eur: string | null;
  eur_foil: string | null;
  tix: string | null;
}

/** Legality status of a card in a given format. */
export type LegalityStatus = "legal" | "not_legal" | "restricted" | "banned";

/** Play formats tracked by Scryfall's `legalities` object. */
export type GameFormat =
  | "standard"
  | "future"
  | "historic"
  | "timeless"
  | "gladiator"
  | "pioneer"
  | "explorer"
  | "modern"
  | "legacy"
  | "pauper"
  | "vintage"
  | "penny"
  | "commander"
  | "oathbreaker"
  | "standardbrawl"
  | "brawl"
  | "competitivebrawl"
  | "alchemy"
  | "paupercommander"
  | "duel"
  | "oldschool"
  | "premodern"
  | "predh";

/**
 * Map of format -> legality status. Scryfall returns an entry for every
 * known format; the string index signature tolerates formats added later
 * (e.g. set-specific ones) without losing autocomplete on the known keys.
 */
export type Legalities = { [K in GameFormat]: LegalityStatus } & {
  [format: string]: LegalityStatus;
};

/**
 * One face of a card. Present in `Card.card_faces` for double-faced,
 * transform, split, adventure and similar layouts. Some fields (notably
 * `image_uris`) only exist on the face for true double-faced layouts.
 */
export interface CardFace {
  object?: "card_face";
  name: string;
  mana_cost: string;
  type_line?: string;
  oracle_text?: string;
  colors?: Color[];
  color_indicator?: Color[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  defense?: string;
  flavor_text?: string;
  artist?: string;
  image_uris?: ImageUris;
}

/* ---- Card ---------------------------------------------------- */

/**
 * A Magic: The Gathering card.
 *
 * Single-faced cards expose `image_uris`, `mana_cost`, `oracle_text`, etc.
 * directly. Multi-faced cards (`layout` of `transform`, `modal_dfc`, `split`,
 * `adventure`, `flip`, `meld`, …) instead carry a `card_faces` array and may
 * omit the top-level `image_uris`. Consumers should use the `getCardImage`
 * helper rather than reading `image_uris` directly.
 */
export interface Card {
  object?: "card";
  id: string;
  oracle_id?: string;
  name: string;
  lang: string;
  released_at?: string;
  layout: CardLayout;

  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  flavor_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  defense?: string;

  colors?: Color[];
  color_identity: Color[];
  keywords?: string[];

  rarity: Rarity;
  artist?: string;
  set?: string;
  set_name: string;
  set_type?: string;
  collector_number?: string;
  digital?: boolean;
  foil?: boolean;
  nonfoil?: boolean;
  finishes?: ("nonfoil" | "foil" | "etched")[];

  prices?: Prices;
  image_uris?: ImageUris;
  card_faces?: CardFace[];
  legalities: Legalities;

  /** Scryfall search URL for every printing of this card. */
  prints_search_uri?: string;
  scryfall_uri?: string;
  uri?: string;
}

/* ---- Search filters ----------------------------------------- */

/** Broad card types selectable in the search UI. */
export type CardType =
  | "creature"
  | "instant"
  | "sorcery"
  | "artifact"
  | "enchantment"
  | "planeswalker"
  | "land";

/** Rarities selectable in the search UI. */
export type RarityFilter = "common" | "uncommon" | "rare" | "mythic";

/** Formats selectable in the search UI. */
export type FormatFilter =
  | "standard"
  | "pioneer"
  | "modern"
  | "legacy"
  | "vintage"
  | "commander"
  | "pauper"
  | "historic"
  | "alchemy"
  | "brawl"
  | "penny"
  | "oathbreaker"
  | "duel";

/**
 * User-facing search criteria. All fields optional — the service layer
 * compiles the set into a Scryfall query string (`q=`).
 */
export interface CardFilters {
  /** Free-text query, typically matched against the card name. */
  q?: string;
  /** Colors to require. `"C"` means colorless. */
  colors?: ColorCode[];
  /** Restrict to a single broad card type. */
  type?: CardType;
  /** Restrict to a single rarity. */
  rarity?: RarityFilter;
  /** Restrict to cards legal in a given format. */
  format?: FormatFilter;
}

/* ---- API envelopes ---------------------------------------- */

/** Paginated collection wrapper returned by list endpoints. */
export interface ScryfallListResponse<T> {
  object: "list";
  total_cards?: number;
  has_more: boolean;
  next_page?: string;
  data: T[];
}

/** Error payload returned by Scryfall when `response.ok` is false. */
export interface ScryfallError {
  object: "error";
  status: number;
  code: string;
  details: string;
  type?: string | null;
  warnings?: string[];
}

/** Runtime type guard for {@link ScryfallError}. */
export function isScryfallError(value: unknown): value is ScryfallError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { object?: unknown }).object === "error" &&
    typeof (value as { details?: unknown }).details === "string"
  );
}
