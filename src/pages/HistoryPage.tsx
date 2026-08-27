import { History } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import { EntryRow } from "../components/collections";
import { useHistory } from "../hooks";
import styles from "./Collection.module.css";

const relativeTime = (ms: number): string => {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
};

/** Recently viewed cards, newest first (RF4). */
export function HistoryPage() {
  const { history, removeEntry, clearHistory } = useHistory();

  return (
    <section className={styles.section} aria-labelledby="history-title">
      <PageHeader
        title="Historial"
        subtitle="Las últimas cartas que has consultado, de más a menos reciente."
      >
        {history.length > 0 ? (
          <button type="button" className={styles.clear} onClick={clearHistory}>
            Borrar
          </button>
        ) : null}
      </PageHeader>

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Todavía no hay historial"
          description="Cuando abras el detalle de una carta se registrará aquí automáticamente."
        />
      ) : (
        <ul className={styles.list} role="list">
          {history.map((entry) => (
            <EntryRow
              key={entry.id}
              to={`/carta/${entry.id}`}
              name={entry.name}
              subtitle={entry.setName}
              image={entry.image}
              onRemove={() => removeEntry(entry.id)}
              meta={
                <span className={styles.time}>{relativeTime(entry.viewedAt)}</span>
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
