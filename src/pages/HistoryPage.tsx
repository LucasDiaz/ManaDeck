import { History } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import styles from "./Page.module.css";

/** Recent search history. */
export function HistoryPage() {
  return (
    <section className={styles.section} aria-labelledby="history-title">
      <PageHeader
        title="Historial"
        subtitle="Revisa y repite tus búsquedas más recientes."
      />
      <EmptyState
        icon={History}
        title="Todavía no hay búsquedas"
        description="Tus búsquedas recientes se guardarán automáticamente en este apartado."
      />
    </section>
  );
}
