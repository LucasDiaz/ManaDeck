/* =============================================================
   ManaDeck — Overpass API (OpenStreetMap) types

   Reference: https://wiki.openstreetmap.org/wiki/Overpass_API
   ============================================================= */

/** Freeform OSM tag bag. Only the keys ManaDeck actually reads are named. */
export interface OverpassTags {
  name?: string;
  shop?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:city"?: string;
  [key: string]: string | undefined;
}

export interface OverpassCenter {
  lat: number;
  lon: number;
}

/** One node/way/relation returned by an Overpass `out center tags;` query. */
export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  /** Present on `node` elements. */
  lat?: number;
  lon?: number;
  /** Present on `way`/`relation` elements when queried with `out center`. */
  center?: OverpassCenter;
  tags?: OverpassTags;
}

export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

/** `shop=*` values ManaDeck queries Overpass for. */
export type VenueCategory = "games" | "trading_card_games" | "anime" | "comic";

/** A game store / TCG venue, normalised from Overpass (or the offline fallback). */
export interface GameVenue {
  /** Stable id: `"<osm-type>/<osm-id>"` from Overpass, or a slug for curated fallback entries. */
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: VenueCategory | string;
  address?: string;
  /** Whether this came from a live Overpass query or the offline fallback list. */
  source: "overpass" | "fallback";
}
