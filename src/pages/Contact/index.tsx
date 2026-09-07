import { useMemo } from "react";
import { Code2, Mail, Globe, MapPin, LocateFixed } from "lucide-react";
import { PageHeader, ErrorState, Spinner } from "../../components/common";
import { VenuesMap, venueCategoryColor, venueCategoryLabel, VENUE_CATEGORIES } from "../../components/map";
import { useTcgVenues, useGeolocation } from "../../hooks";
import type { GeolocationStatus } from "../../hooks";
import styles from "./Contact.module.css";

const DEFAULT_CENTER = { lat: -34.7744, lon: -58.2678 };
const SEARCH_RADIUS_METERS = 5000;

const GEO_STATUS_MESSAGE: Partial<Record<GeolocationStatus, string>> = {
  denied:
    "Permiso de ubicación denegado: mostrando comercios cerca de la UNAJ (Florencio Varela).",
  error:
    "No pudimos obtener tu ubicación: mostrando comercios cerca de la UNAJ (Florencio Varela).",
  unsupported: "Tu navegador no admite geolocalización.",
};

export function ContactPage() {
  const geo = useGeolocation();
  const center = geo.coords ?? DEFAULT_CENTER;
  const isUserLocation = geo.status === "success";

  const { venues, isLoading, isError, error, usingFallback, refetch } = useTcgVenues({
    lat: center.lat,
    lon: center.lon,
    radiusMeters: SEARCH_RADIUS_METERS,
  });

  const osmLink = useMemo(
    () =>
      `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=13/${center.lat}/${center.lon}`,
    [center.lat, center.lon],
  );

  return (
    <section className={styles.section} aria-labelledby="contact-title">
      <PageHeader
        title="Contacto"
        subtitle="ManaDeck es un proyecto académico de desarrollo web. Escríbenos por cualquiera de estos canales."
      />

      <div className={styles.studio}>
        <h2 className={styles.studioName}>ManaDeck Studio</h2>
        <p className={styles.studioText}>
          Trabajo práctico de la cátedra de Desarrollo de Aplicaciones Web.
          Facultad de Informática · Universidad Nacional de La Plata.
        </p>
        <dl className={styles.facts}>
          <div>
            <dt>Desarrollo</dt>
            <dd>Lautaro Sardina, Lucas Díaz</dd>
          </div>
          <div>
            <dt>Datos de cartas</dt>
            <dd>Scryfall API</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>Universidad Nacional Arturo Jauretche (UNAJ), Florencio Varela, Buenos Aires, Argentina</dd>
          </div>
        </dl>
      </div>

      <div className={styles.links}>
        <a className={styles.linkRow} href="mailto:hola@manadeck.app">
          <span aria-hidden="true">
            <Mail size={18} />
          </span>
          hola@manadeck.app
        </a>
        <a
          className={styles.linkRow}
          href="https://github.com/LucasDiaz/ManaDeck"
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">
            <Code2 size={18} />
          </span>
          github.com/LucasDiaz/ManaDeck
        </a>
        <a
          className={styles.linkRow}
          href="https://scryfall.com/docs/api"
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">
            <Globe size={18} />
          </span>
          Documentación de la API de Scryfall
        </a>
      </div>

      <div className={styles.mapBlock}>
        <div className={styles.mapHead}>
          <MapPin size={16} aria-hidden="true" />
          Dónde jugar cerca tuyo
          <span className={styles.coords}>
            {center.lat.toFixed(4)}, {center.lon.toFixed(4)}
          </span>
        </div>
        <p className={styles.mapSubtitle}>
          Tiendas de juegos, TCG, anime y comics a {SEARCH_RADIUS_METERS / 1000} km a
          la redonda, obtenidas en vivo de OpenStreetMap.
        </p>

        <div className={styles.locateRow}>
          <button
            type="button"
            className={styles.locateBtn}
            onClick={geo.locate}
            disabled={geo.isLocating}
          >
            {geo.isLocating ? (
              <span className={styles.miniSpinner} aria-hidden="true" />
            ) : (
              <LocateFixed size={15} aria-hidden="true" />
            )}
            {geo.isLocating ? "Ubicando…" : "Usar mi ubicación"}
          </button>
          {geo.error ? (
            <p className={styles.geoNotice} role="status">
              {GEO_STATUS_MESSAGE[geo.status] ?? geo.error}
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <div className={styles.mapLoading}>
            <Spinner label="Buscando comercios cercanos…" showLabel />
          </div>
        ) : (
          <>
            {isError ? (
              <ErrorState
                title="No se pudo consultar OpenStreetMap"
                error={error}
                onRetry={refetch}
              />
            ) : null}

            {usingFallback ? (
              <p className={styles.fallbackNotice} role="status">
                Mostrando una lista de referencia local: no se pudo conectar con
                Overpass en este momento.
              </p>
            ) : null}

            <div className={styles.mapFrame}>
              <VenuesMap
                center={center}
                venues={venues}
                isUserLocation={isUserLocation}
                accuracy={geo.coords?.accuracy}
                fallbackLabel="UNAJ, Florencio Varela (ubicación predeterminada)"
              />
            </div>

            {venues.length === 0 && !isError ? (
              <p className={styles.emptyNotice}>
                No encontramos comercios registrados en OpenStreetMap dentro del
                radio de búsqueda.
              </p>
            ) : (
              <ul className={styles.legend}>
                {VENUE_CATEGORIES.map((category) => (
                  <li key={category} className={styles.legendItem}>
                    <span
                      className={styles.legendDot}
                      style={{ background: venueCategoryColor(category) }}
                      aria-hidden="true"
                    />
                    {venueCategoryLabel(category)}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <a
          className={styles.mapLink}
          href={osmLink}
          target="_blank"
          rel="noreferrer"
        >
          Ver mapa más grande en OpenStreetMap
        </a>
      </div>

      <p className={styles.disclaimer}>
        ManaDeck no está afiliado a Wizards of the Coast ni a Scryfall. Magic: The
        Gathering es una marca registrada de Wizards of the Coast.
      </p>
    </section>
  );
}
