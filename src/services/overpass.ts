/* =============================================================
   ManaDeck — Overpass API (OpenStreetMap) service layer

   Finds local game / TCG / anime / comic stores around a point via the
   public Overpass API, so the Contact screen's map can show real nearby
   venues to play Magic: The Gathering.

   API reference: https://wiki.openstreetmap.org/wiki/Overpass_API
   ============================================================= */

import type {
  GameVenue,
  OverpassElement,
  OverpassResponse,
  OverpassTags,
  VenueCategory,
} from "../types/overpass";

export const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/** Give up on the live query after this long (the caller then falls back). */
const OVERPASS_TIMEOUT_MS = 10_000;

/** `shop=*` values that plausibly host TCG play (Magic, Pokémon, etc.). */
const SHOP_TAGS: readonly VenueCategory[] = [
  "games",
  "trading_card_games",
  "anime",
  "comic",
];

/** Raised when Overpass responds but with a non-OK HTTP status. */
export class OverpassApiError extends Error {
  readonly status: number;

  constructor(status: number, details?: string) {
    super(details || `Overpass respondió con un error (${status}).`);
    this.name = "OverpassApiError";
    this.status = status;
  }
}

/** Raised on transport failure, timeout, or an unparseable response body. */
export class OverpassNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "OverpassNetworkError";
  }
}

export interface OverpassVenueQuery {
  lat: number;
  lon: number;
  /** Search radius in meters. Defaults to 5 km. */
  radiusMeters?: number;
}

/**
 * Compile an Overpass QL query for every {@link SHOP_TAGS} value within
 * `radiusMeters` of `(lat, lon)`, requesting nodes and ways (with their
 * centroid via `out center`) plus tags.
 */
export function buildTcgVenuesQuery({
  lat,
  lon,
  radiusMeters = 5000,
}: OverpassVenueQuery): string {
  const around = `around:${radiusMeters},${lat},${lon}`;
  const clauses = SHOP_TAGS.flatMap((tag) => [
    `  node["shop"="${tag}"](${around});`,
    `  way["shop"="${tag}"](${around});`,
  ]).join("\n");

  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center tags;`;
}

function formatAddress(tags: OverpassTags): string | undefined {
  const street = tags["addr:street"];
  if (!street) return undefined;
  const number = tags["addr:housenumber"];
  return number ? `${street} ${number}` : street;
}

function normalizeElements(elements: OverpassElement[]): GameVenue[] {
  const venues: GameVenue[] = [];
  for (const element of elements) {
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    const tags = element.tags ?? {};
    venues.push({
      id: `${element.type}/${element.id}`,
      name: tags.name?.trim() || "Comercio sin nombre",
      lat,
      lon,
      category: tags.shop ?? "games",
      address: formatAddress(tags),
      source: "overpass",
    });
  }
  return venues;
}

/**
 * Query Overpass for game/TCG/anime/comic shops near a point.
 *
 * Combines the caller's `signal` (e.g. component unmount) with an internal
 * timeout — either aborts the request. A caller-triggered abort rethrows
 * the original `AbortError` untouched (so callers can ignore it, same as
 * the Scryfall client); a timeout is surfaced as an
 * {@link OverpassNetworkError} so callers can tell "cancelled" apart from
 * "gave up" and fall back to offline data for the latter.
 *
 * @throws {OverpassApiError} when Overpass responds with a non-OK status.
 * @throws {OverpassNetworkError} on transport failure, timeout, or a body
 *   that isn't valid JSON.
 */
export async function fetchTcgVenues(
  query: OverpassVenueQuery,
  options: { signal?: AbortSignal } = {},
): Promise<GameVenue[]> {
  const body = buildTcgVenuesQuery(query);

  const internal = new AbortController();
  const timeoutId = window.setTimeout(() => internal.abort(), OVERPASS_TIMEOUT_MS);
  const onExternalAbort = () => internal.abort();
  options.signal?.addEventListener("abort", onExternalAbort);

  let response: Response;
  try {
    response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body,
      signal: internal.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      if (options.signal?.aborted) throw cause; // real cancellation — propagate
      throw new OverpassNetworkError(
        "Tiempo de espera agotado al consultar Overpass.",
        { cause },
      );
    }
    throw new OverpassNetworkError("No se pudo conectar con Overpass.", {
      cause,
    });
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }

  if (!response.ok) {
    throw new OverpassApiError(response.status);
  }

  let payload: OverpassResponse;
  try {
    payload = (await response.json()) as OverpassResponse;
  } catch (cause) {
    throw new OverpassNetworkError(
      "La respuesta de Overpass no tiene un formato válido.",
      { cause },
    );
  }

  return normalizeElements(payload.elements ?? []);
}

/**
 * Curated real-world TCG/game/comic stores across Greater Buenos Aires
 * (Zona Sur + La Plata, and CABA + Zona Norte). Always merged into whatever
 * `useTcgVenues` shows (see {@link mergeWithFallbackVenues}) so these pins
 * render on the `/contacto` map regardless of where Overpass's live query
 * is centered — and doubles as the offline fallback when Overpass fails or
 * times out.
 *
 * Coordinates/addresses are as supplied by product; ManaDeck has not
 * independently re-geocoded them — flag any that look off.
 */
export const FALLBACK_TCG_VENUES: readonly GameVenue[] = [
  // ---- Zona Sur & La Plata ----
  {
    id: "dominaria-la-plata",
    name: "Dominaria Games",
    category: "trading_card_games",
    lat: -34.9189,
    lon: -57.9542,
    address: "Calle 49 #632 e/ 7 y 8, La Plata",
    source: "fallback",
  },
  {
    id: "sector28-la-plata",
    name: "Sector 28",
    category: "games",
    lat: -34.9221,
    lon: -57.9518,
    address: "Calle 54 #683 e/ 8 y 9, La Plata",
    source: "fallback",
  },
  {
    id: "la-cueva-quilmes",
    name: "La Cueva TCG",
    category: "trading_card_games",
    lat: -34.7208,
    lon: -58.2568,
    address: "Peatonal Rivadavia 142, Quilmes",
    source: "fallback",
  },
  {
    id: "dungeon-games-lomas",
    name: "Dungeon Games",
    category: "trading_card_games",
    lat: -34.7612,
    lon: -58.4014,
    address: "Av. Meeks 180, Lomas de Zamora",
    source: "fallback",
  },
  {
    id: "invasion-comics-avellaneda",
    name: "Invasión Comics & Games",
    category: "comic",
    lat: -34.6625,
    lon: -58.3654,
    address: "Av. Mitre 1250, Avellaneda",
    source: "fallback",
  },
  {
    id: "legion-games-adrogue",
    name: "Legión Games",
    category: "games",
    lat: -34.7981,
    lon: -58.3912,
    address: "Carlos Pellegrini 340, Adrogué",
    source: "fallback",
  },

  // ---- CABA & Zona Norte ----
  {
    id: "d20-caballito",
    name: "D20 Magic Store",
    category: "trading_card_games",
    lat: -34.6205,
    lon: -58.4412,
    address: "Av. Rivadavia 5432, Caballito, CABA",
    source: "fallback",
  },
  {
    id: "magic-dealers-belgrano",
    name: "Magic Dealers",
    category: "trading_card_games",
    lat: -34.5612,
    lon: -58.4618,
    address: "Av. Monroe 2470, Belgrano, CABA",
    source: "fallback",
  },
  {
    id: "bazaar-games-recoleta",
    name: "Bazaar Games / 2 de 6",
    category: "games",
    lat: -34.5962,
    lon: -58.3905,
    address: "Av. Santa Fe 1660 (Bond Street), Recoleta, CABA",
    source: "fallback",
  },
  {
    id: "entelequia-centro",
    name: "Entelequia",
    category: "comic",
    lat: -34.6041,
    lon: -58.3852,
    address: "Talcahuano 470, San Nicolás, CABA",
    source: "fallback",
  },
  {
    id: "la-cantera-centro",
    name: "La Cantera Comics & Games",
    category: "comic",
    lat: -34.6045,
    lon: -58.3871,
    address: "Av. Corrientes 1386, San Nicolás, CABA",
    source: "fallback",
  },
  {
    id: "arkham-san-isidro",
    name: "Arkham Comics & Games",
    category: "games",
    lat: -34.4715,
    lon: -58.5102,
    address: "Belgrano 120, San Isidro",
    source: "fallback",
  },
];

/**
 * Merge live Overpass results with the curated {@link FALLBACK_TCG_VENUES}
 * list, deduped by id (an Overpass hit always wins over a curated entry
 * with the same id — not expected in practice, since the two id spaces
 * don't collide). Used so the curated Buenos Aires stores always render on
 * the map, not only when Overpass itself fails.
 */
export function mergeWithFallbackVenues(live: GameVenue[]): GameVenue[] {
  const seen = new Set(live.map((venue) => venue.id));
  return [...live, ...FALLBACK_TCG_VENUES.filter((venue) => !seen.has(venue.id))];
}
