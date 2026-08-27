import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import styles from "./Page.module.css";

/** Fallback route for unknown paths. */
export function NotFoundPage() {
  return (
    <section className={styles.section} aria-labelledby="notfound-title">
      <PageHeader title="Página no encontrada" />
      <EmptyState
        icon={Compass}
        title="Esta ruta no existe"
        description="Puede que el enlace esté roto o que la sección aún no esté disponible."
      />
      <Link to="/" className={styles.card} style={{ textAlign: "center" }}>
        <span className={styles.cardTitle}>Volver al inicio</span>
      </Link>
    </section>
  );
}
