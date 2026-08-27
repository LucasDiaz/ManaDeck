import { Code2, Mail, Globe } from "lucide-react";
import { PageHeader } from "../components/common";
import styles from "./Page.module.css";

/** Contact / about information. */
export function ContactPage() {
  return (
    <section className={styles.section} aria-labelledby="contact-title">
      <PageHeader
        title="Contacto"
        subtitle="¿Sugerencias o errores? Escríbenos por cualquiera de estos canales."
      />

      <div className={styles.contactList}>
        <a className={styles.contactRow} href="mailto:hola@manadeck.app">
          <span aria-hidden="true">
            <Mail size={18} />
          </span>
          hola@manadeck.app
        </a>
        <a
          className={styles.contactRow}
          href="https://github.com/lautarosard/manaDeck-app"
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">
            <Code2 size={18} />
          </span>
          github.com/lautarosard/manaDeck-app
        </a>
        <a
          className={styles.contactRow}
          href="https://scryfall.com/docs/api"
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true">
            <Globe size={18} />
          </span>
          Datos de cartas por Scryfall
        </a>
      </div>

      <p className={styles.lead}>
        ManaDeck no está afiliado a Wizards of the Coast ni a Scryfall. Magic: The
        Gathering es una marca registrada de Wizards of the Coast.
      </p>
    </section>
  );
}
