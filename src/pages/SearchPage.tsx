import { Search } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import styles from "./Page.module.css";

/** Card search — API wiring arrives in a later phase. */
export function SearchPage() {
  return (
    <section className={styles.section} aria-labelledby="search-title">
      <PageHeader
        title="Buscar"
        subtitle="Busca cartas de Magic: The Gathering en la base de datos de Scryfall."
      />
      <EmptyState
        icon={Search}
        title="El buscador llega pronto"
        description="Aquí podrás escribir el nombre de una carta y ver resultados con imagen, precio y detalles."
      />
    </section>
  );
}
