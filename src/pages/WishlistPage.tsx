import { Heart } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import { EntryRow } from "../components/collections";
import { useWishlist } from "../hooks";
import styles from "./Collection.module.css";

/** Wishlist of cards the user wants to acquire (RF6). */
export function WishlistPage() {
  const { items, remove, clear } = useWishlist();

  return (
    <section className={styles.section} aria-labelledby="wishlist-title">
      <PageHeader
        title="Lista de deseos"
        subtitle="Guarda las cartas que quieres conseguir y tenlas siempre a mano."
      >
        {items.length > 0 ? (
          <button type="button" className={styles.clear} onClick={clear}>
            Vaciar
          </button>
        ) : null}
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Tu lista está vacía"
          description="Abre una carta y pulsa «Añadir a deseos» para guardarla aquí."
        />
      ) : (
        <>
          <p className={styles.count}>
            {items.length} {items.length === 1 ? "carta" : "cartas"}
          </p>
          <ul className={styles.list} role="list">
            {items.map((entry) => (
              <EntryRow
                key={entry.id}
                to={`/carta/${entry.id}`}
                name={entry.name}
                subtitle={entry.setName}
                image={entry.image}
                onRemove={() => remove(entry.id)}
                meta={
                  <>
                    <span className={styles.priority}>P{entry.priority}</span>
                    <span className={styles.tag}>{entry.category}</span>
                    {entry.note ? (
                      <span className={styles.note}>{entry.note}</span>
                    ) : null}
                  </>
                }
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
