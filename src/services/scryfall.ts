/* =============================================================
   ManaDeck — Scryfall API service layer

   Native Fetch only. Every failure path is normalised to one of:
     - ScryfallApiError  → the API responded with an error JSON
     - ScryfallNetworkError → transport failure / unparseable body

   API reference: https://scryfall.com/docs/api
   ============================================================= */

import type {
  Card,
  CardFilters,
  ImageUris,
  ScryfallError,
  ScryfallListResponse,
} from "../types/card";
import { isScryfallError } from "../types/card";

export const SCRYFALL_BASE_URL = "https://api.scryfall.com";

/**
 * Scryfall requires `Accept` and a non-generic `User-Agent`. In the browser
 * the User-Agent is set automatically and cannot be overridden by fetch, so
 * only `Accept` is declared here. (If this layer is ever reused server-side,
 * a custom `User-Agent` must be added or Scryfall responds with HTTP 400.)
 */
const DEFAULT_HEADERS: Readonly<Record<string, string>> = {
  Accept: "application/json",
};

type QueryValue = string | number | boolean | undefined | null;
type QueryParams = Record<string, QueryValue>;

/* ---- Errors -------------------------------------------------- */

/** Raised when Scryfall returns a structured error (`response.ok === false`). */
export class ScryfallApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: string;
  readonly warnings: string[];

  constructor(error: ScryfallError) {
    super(error.details || `Scryfall respondió con un error (${error.status}).`);
    this.name = "ScryfallApiError";
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
    this.warnings = error.warnings ?? [];
  }
}

/** Raised on transport failures or when a response body cannot be parsed. */
export class ScryfallNetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScryfallNetworkError";
  }
}

/* ---- URL building ----------------------------------------- */

/** Build an absolute Scryfall URL from a path and optional query params. */
export function buildScryfallUrl(path: string, params?: QueryParams): string {
  const url = new URL(path.replace(/^\/+/, ""), `${SCRYFALL_BASE_URL}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/* ---- Core request helper --------------------------------- */

async function parseError(response: Response): Promise<ScryfallError> {
  try {
    const body: unknown = await response.json();
    if (isScryfallError(body)) {
      const raw = body as unknown as Record<string, unknown>;
      // Scryfall is mostly consistent (`status`: HTTP int, `code`: slug), but
      // a few error responses swap them. Pick each field by type, not by name.
      const numeric = [raw.status, raw.code].find((v) => typeof v === "number");
      const slug = [raw.code, raw.status].find((v) => typeof v === "string");
      return {
        object: "error",
        status: typeof numeric === "number" ? numeric : response.status,
        code: typeof slug === "string" ? slug : "unknown_error",
        details: body.details,
        type: typeof raw.type === "string" ? raw.type : null,
        warnings: Array.isArray(raw.warnings)
          ? raw.warnings.filter((w): w is string => typeof w === "string")
          : undefined,
      };
    }
  } catch {
    // Body was empty or not JSON — fall through to a synthetic error.
  }
  return {
    object: "error",
    status: response.status,
    code: "http_error",
    details:
      `Error HTTP ${response.status}` +
      (response.statusText ? ` (${response.statusText})` : ""),
  };
}

interface RequestOptions {
  params?: QueryParams;
  signal?: AbortSignal;
}

/**
 * Perform a GET request against Scryfall and return the parsed JSON body.
 * @throws {ScryfallApiError} when the API returns an error payload.
 * @throws {ScryfallNetworkError} on transport failure or an unparseable body.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildScryfallUrl(path, options.params);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: DEFAULT_HEADERS,
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new ScryfallNetworkError(
      "No se pudo conectar con Scryfall. Revisa tu conexión e inténtalo de nuevo.",
      { cause },
    );
  }

  if (!response.ok) {
    throw new ScryfallApiError(await parseError(response));
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new ScryfallNetworkError(
      "La respuesta de Scryfall no tiene un formato válido.",
      { cause },
    );
  }
}

/* ---- Query compilation ----------------------------------- */

/**
 * Compile {@link CardFilters} into Scryfall query syntax.
 * e.g. `{ q: "bolt", colors: ["R"], type: "instant" }` → `bolt c:r t:instant`
 */
export function buildScryfallQuery(filters: CardFilters): string {
  const parts: string[] = [];

  const text = filters.q?.trim();
  if (text) parts.push(text);

  const colors = filters.colors ?? [];
  if (colors.length > 0) {
    const wubrg = colors.filter((c) => c !== "C");
    const colorless = colors.includes("C");
    if (wubrg.length > 0) {
      parts.push(`c:${wubrg.join("").toLowerCase()}`);
    } else if (colorless) {
      parts.push("c:colorless");
    }
  }

  if (filters.type) parts.push(`t:${filters.type}`);
  if (filters.rarity) parts.push(`r:${filters.rarity}`);
  if (filters.format) parts.push(`f:${filters.format}`);

  return parts.join(" ").trim();
}

/* ---- Public API ----------------------------------------- */

const RANDOM_CARD_MAX = 20;

/**
 * Fetch `count` distinct random cards.
 * Issues the requests concurrently, then sequentially tops up any shortfall
 * caused by duplicates or transient network errors.
 */
export async function getRandomCards(
  count = 5,
  options: { signal?: AbortSignal } = {},
): Promise<Card[]> {
  const target = Math.max(1, Math.min(Math.trunc(count), RANDOM_CARD_MAX));
  const seen = new Set<string>();
  const cards: Card[] = [];

  const collect = (card: Card): void => {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      cards.push(card);
    }
  };

  const settled = await Promise.allSettled(
    Array.from({ length: target }, () =>
      request<Card>("/cards/random", { signal: options.signal }),
    ),
  );

  let apiError: ScryfallApiError | undefined;
  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      collect(outcome.value);
    } else if (outcome.reason instanceof DOMException) {
      throw outcome.reason; // aborted
    } else if (outcome.reason instanceof ScryfallApiError) {
      apiError = outcome.reason;
    }
  }

  // Sequential fallback for the remaining slots.
  const maxAttempts = target * 3;
  for (let attempt = 0; cards.length < target && attempt < maxAttempts; attempt++) {
    try {
      collect(await request<Card>("/cards/random", { signal: options.signal }));
    } catch (error) {
      if (error instanceof DOMException) throw error;
      if (error instanceof ScryfallApiError) {
        apiError = error;
        break;
      }
      // ScryfallNetworkError on a single pull — keep trying.
    }
  }

  if (cards.length === 0) {
    throw (
      apiError ??
      new ScryfallNetworkError("No se pudieron obtener cartas aleatorias.")
    );
  }

  return cards;
}

/**
 * Search the card database.
 * A 404 from Scryfall (no cards matched) is normalised to an empty list
 * rather than thrown, so the UI can show a plain "no results" state.
 */
export async function searchCards(
  filters: CardFilters,
  page = 1,
  options: { signal?: AbortSignal } = {},
): Promise<ScryfallListResponse<Card>> {
  const q = buildScryfallQuery(filters);

  if (!q) {
    throw new ScryfallApiError({
      object: "error",
      status: 400,
      code: "bad_request",
      details: "Añade al menos un filtro para poder buscar.",
    });
  }

  try {
    return await request<ScryfallListResponse<Card>>("/cards/search", {
      params: {
        q,
        page: Math.max(1, Math.trunc(page)),
      },
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof ScryfallApiError && error.status === 404) {
      return { object: "list", total_cards: 0, has_more: false, data: [] };
    }
    throw error;
  }
}

/** Fetch full details for a single card by its Scryfall id. */
export async function getCardById(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<Card> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new ScryfallApiError({
      object: "error",
      status: 400,
      code: "bad_request",
      details: "Falta el identificador de la carta.",
    });
  }
  return request<Card>(`/cards/${encodeURIComponent(trimmed)}`, {
    signal: options.signal,
  });
}

/**
 * Fetch every printing of a card, newest first, given its `oracle_id`.
 * Uses `q=oracleid:<id>&unique=prints`. A 404 (nothing found) yields `[]`.
 */
export async function getCardPrints(
  oracleId: string,
  options: { signal?: AbortSignal } = {},
): Promise<Card[]> {
  const trimmed = oracleId.trim();
  if (!trimmed) return [];

  try {
    const list = await request<ScryfallListResponse<Card>>("/cards/search", {
      params: {
        q: `oracleid:${trimmed}`,
        unique: "prints",
        order: "released",
        dir: "desc",
      },
      signal: options.signal,
    });
    return list.data;
  } catch (error) {
    if (error instanceof ScryfallApiError && error.status === 404) return [];
    throw error;
  }
}

/* ---- Helpers ------------------------------------------- */

const SYMBOL_CDN = "https://svgs.scryfall.io/card-symbols";
const SET_ICON_CDN = "https://svgs.scryfall.io/sets";

/**
 * Official Scryfall SVG URL for a mana / cost symbol.
 * Accepts `"{W}"`, `"W"`, `"{G/U}"`, `"{2/W}"`, `"{T}"`, `"{15}"`, … —
 * braces are stripped and slashes removed (`{G/U}` → `GU`).
 */
export function getManaSymbolUrl(symbol: string): string {
  const code = symbol
    .trim()
    .replace(/[{}]/g, "")
    .replace(/\//g, "")
    .toUpperCase();
  return `${SYMBOL_CDN}/${encodeURIComponent(code || "C")}.svg`;
}

/** Official Scryfall SVG URL for a set's icon, by set code (e.g. `"neo"`). */
export function getSetIconUrl(setCode: string): string {
  return `${SET_ICON_CDN}/${encodeURIComponent(setCode.trim().toLowerCase())}.svg`;
}

/**
 * Safely resolve a card's primary image URI.
 * Works for single-faced cards (`card.image_uris`) and double-faced /
 * transform cards, where the art lives on `card.card_faces[0].image_uris`.
 * Returns `undefined` when no image is available at the requested size.
 */
export function getCardImage(
  card: Card,
  size: keyof ImageUris = "normal",
): string | undefined {
  if (card.image_uris) {
    return card.image_uris[size];
  }
  const face = card.card_faces?.find((f) => f.image_uris);
  return face?.image_uris?.[size];
}
