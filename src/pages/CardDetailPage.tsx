import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import styles from "./Page.module.css";

/** Placeholder for the single-card view — built in a later phase. */
export function CardDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className={styles.section} aria-labelledby="card-detail-title">
      <PageHeader title="Detalle de carta">
        <Link to="/buscar" className={styles.cardIcon} aria-label="Volver a buscar">
          <ArrowLeft size={18} />
        </Link>
      </PageHeader>

      <EmptyState
        icon={ScrollText}
        title="Vista de carta en construcción"
        description={
          id
            ? `Pronto se mostrará aquí la carta ${id} con arte, texto, precios y legalidades.`
            : "Pronto se mostrará aquí el detalle completo de cada carta."
        }
      />

      <Link to="/" className={styles.card} style={{ textAlign: "center" }}>
        <span className={styles.cardTitle}>Volver al inicio</span>
      </Link>
    </section>
  );
}
