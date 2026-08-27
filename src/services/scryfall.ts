/* Scryfall API client — configuration only for Phase 1.
 * Endpoint methods (search, card lookup, autocomplete, …) are added
 * in a later phase. Kept here so the app has a single integration point.
 *
 * Scryfall asks consumers to send identifying headers and to throttle
 * requests to ~10/second. See https://scryfall.com/docs/api
 */

export const SCRYFALL_BASE_URL = "https://api.scryfall.com";

/** Minimum delay between requests recommended by Scryfall (ms). */
export const SCRYFALL_MIN_REQUEST_INTERVAL = 100;

export const SCRYFALL_DEFAULT_HEADERS: Readonly<Record<string, string>> = {
  Accept: "application/json",
  "User-Agent": "ManaDeck/0.1 (https://github.com/lautarosard/manaDeck-app)",
};

/** Build an absolute Scryfall URL from a path and optional query params. */
export function buildScryfallUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path.replace(/^\//, ""), `${SCRYFALL_BASE_URL}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}
