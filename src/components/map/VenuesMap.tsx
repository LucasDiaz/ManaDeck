import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GameVenue } from "../../types";
import { venueCategoryColor, venueCategoryLabel } from "./venueIcons";
import styles from "./VenuesMap.module.css";

export interface VenuesMapProps {
  center: { lat: number; lon: number };
  venues: GameVenue[];
  zoom?: number;
  /**
   * True when `center` is the user's real GPS position (from
   * `useGeolocation`) rather than a default city — draws a distinct
   * "you are here" marker instead of the generic reference one.
   */
  isUserLocation?: boolean;
  /** GPS accuracy in meters; drawn as a circle when `isUserLocation` is true. */
  accuracy?: number;
  /** Popup text for the marker shown at `center` when `isUserLocation` is false. */
  fallbackLabel?: string;
}

function buildVenueIcon(category: string): L.DivIcon {
  const color = venueCategoryColor(category);
  return L.divIcon({
    className: styles.venueMarker,
    html: `<span style="background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

const REFERENCE_ICON = L.divIcon({
  className: styles.referenceMarker,
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

const USER_LOCATION_ICON = L.divIcon({
  className: styles.userMarker,
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

/**
 * Venue names/addresses come from public OSM data anyone can edit, so the
 * popup is built with DOM nodes + `textContent` (never `innerHTML`) to rule
 * out markup injection from a malicious tag.
 */
function buildVenuePopup(venue: GameVenue): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = styles.popup;

  const name = document.createElement("strong");
  name.textContent = venue.name;
  wrapper.appendChild(name);

  const category = document.createElement("span");
  category.className = styles.popupMeta;
  category.textContent = venueCategoryLabel(venue.category);
  wrapper.appendChild(category);

  if (venue.address) {
    const address = document.createElement("span");
    address.className = styles.popupMeta;
    address.textContent = venue.address;
    wrapper.appendChild(address);
  }

  return wrapper;
}

/**
 * Interactive OpenStreetMap (Leaflet) view centered on `center`, with one
 * marker per venue plus an optional fixed reference marker. Dark-theme
 * treatment lives entirely in VenuesMap.module.css (tile-layer invert
 * filter + Leaflet chrome overrides) — no JS theming here.
 */
export function VenuesMap({
  center,
  venues,
  zoom = 13,
  isUserLocation = false,
  accuracy,
  fallbackLabel,
}: VenuesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const centerMarkerRef = useRef<L.LayerGroup | null>(null);

  // Mount the map once; center/zoom below are only the *initial* view.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lon],
      zoom,
      // Prevents the map from trapping page scroll inside a scrolling Contact page.
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    centerMarkerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      centerMarkerRef.current = null;
    };
    // Mount/unmount only — center/zoom/marker changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center the already-mounted map when the point of interest changes
  // (default city → GPS fix, or a fresh GPS fix).
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lon], zoom);
  }, [center.lat, center.lon, zoom]);

  // Rebuild the "you are here" / fallback marker whenever the center or its
  // source (GPS vs. default city) changes.
  useEffect(() => {
    const group = centerMarkerRef.current;
    if (!group) return;
    group.clearLayers();

    if (isUserLocation) {
      L.marker([center.lat, center.lon], { icon: USER_LOCATION_ICON })
        .bindPopup("Estás aquí")
        .addTo(group);
      if (accuracy) {
        L.circle([center.lat, center.lon], {
          radius: accuracy,
          className: styles.accuracyCircle,
        }).addTo(group);
      }
    } else if (fallbackLabel) {
      L.marker([center.lat, center.lon], { icon: REFERENCE_ICON })
        .bindPopup(fallbackLabel)
        .addTo(group);
    }
  }, [center.lat, center.lon, isUserLocation, accuracy, fallbackLabel]);

  // Sync venue markers whenever the list changes.
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    group.clearLayers();

    for (const venue of venues) {
      L.marker([venue.lat, venue.lon], { icon: buildVenueIcon(venue.category) })
        .bindPopup(buildVenuePopup(venue))
        .addTo(group);
    }
  }, [venues]);

  return (
    <div
      ref={containerRef}
      className={styles.mapContainer}
      role="application"
      aria-label="Mapa de comercios de TCG cercanos"
    />
  );
}
