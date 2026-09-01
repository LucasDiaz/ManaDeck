import { Code2, Mail, Globe, MapPin } from "lucide-react";
import { PageHeader } from "../../components/common";
import styles from "./Contact.module.css";

const LA_PLATA = { lat: -34.9215, lon: -57.9536 };
const OSM_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=-57.9636%2C-34.9315%2C-57.9436%2C-34.9115&layer=mapnik&marker=-34.9215%2C-57.9536";
const OSM_LINK = `https://www.openstreetmap.org/?mlat=${LA_PLATA.lat}&mlon=${LA_PLATA.lon}#map=16/${LA_PLATA.lat}/${LA_PLATA.lon}`;

export function ContactPage() {
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
            <dd>Lautaro Sardina</dd>
          </div>
          <div>
            <dt>Datos de cartas</dt>
            <dd>Scryfall API</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>La Plata, Buenos Aires, Argentina</dd>
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
          Catedral de La Plata
          <span className={styles.coords}>
            {LA_PLATA.lat}, {LA_PLATA.lon}
          </span>
        </div>
        <div className={styles.mapFrame}>
          <iframe
            className={styles.map}
            title="Mapa centrado en la Catedral de La Plata"
            src={OSM_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <a
          className={styles.mapLink}
          href={OSM_LINK}
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
