const CATEGORY_LABELS: Record<string, string> = {
  games: "Tienda de juegos",
  trading_card_games: "Tienda de TCG",
  anime: "Tienda de anime",
  comic: "Comiquería",
};

/** Marker/legend color per category, reusing the app's design tokens. */
const CATEGORY_COLORS: Record<string, string> = {
  games: "var(--accent-primary-bright)",
  trading_card_games: "var(--accent-secondary-bright)",
  anime: "var(--color-danger)",
  comic: "var(--color-warning)",
};

const DEFAULT_COLOR = "var(--accent-primary-bright)";

/** Human-readable Spanish label for an OSM `shop=*` value. */
export function venueCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? "Comercio";
}

/** Marker/legend color for an OSM `shop=*` value. */
export function venueCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

/** Every category ManaDeck queries Overpass for, in a fixed display order. */
export const VENUE_CATEGORIES = [
  "trading_card_games",
  "games",
  "comic",
  "anime",
] as const;
