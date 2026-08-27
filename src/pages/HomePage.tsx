import { Link } from "react-router-dom";
import { Search, Heart, History } from "lucide-react";
import { PageHeader } from "../components/common";
import styles from "./Page.module.css";

/** Landing page — entry point and quick access to core sections. */
export function HomePage() {
  return (
    <section className={styles.section} aria-labelledby="home-title">
      <PageHeader
        title="Bienvenido a ManaDeck"
        subtitle="Explora cartas de Magic: The Gathering, guarda tus deseos y revisa tu historial de búsquedas."
      />

      <p className={styles.lead}>
        Esta es la estructura base de la aplicación. En las siguientes fases se
        conectará la API de Scryfall para buscar y consultar cartas.
      </p>

      <div className={styles.grid}>
        <Link to="/buscar" className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            <Search size={20} />
          </span>
          <span className={styles.cardTitle}>Buscar cartas</span>
          <span className={styles.cardText}>
            Encuentra cualquier carta por nombre, tipo o color.
          </span>
        </Link>

        <Link to="/deseos" className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            <Heart size={20} />
          </span>
          <span className={styles.cardTitle}>Lista de deseos</span>
          <span className={styles.cardText}>
            Reúne las cartas que quieres conseguir.
          </span>
        </Link>

        <Link to="/historial" className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            <History size={20} />
          </span>
          <span className={styles.cardTitle}>Historial</span>
          <span className={styles.cardText}>
            Vuelve a tus búsquedas recientes en un toque.
          </span>
        </Link>
      </div>
    </section>
  );
}
