import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Pencil, Trash2 } from "lucide-react";
import type { WishlistEntry } from "../types";
import { PageHeader, EmptyState } from "../components/common";
import { WishlistModal } from "../components/wishlist";
import { useWishlist } from "../hooks";
import styles from "./Collection.module.css";

/** Wishlist of cards the user wants to acquire (RF6). */
export function WishlistPage() {
  const { items, remove, clear } = useWishlist();
  const [editing, setEditing] = useState<WishlistEntry | null>(null);

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
          <ul className={styles.wishList} role="list">
            {items.map((entry) => (
              <li key={entry.id} className={styles.wishItem}>
                <Link to={`/carta/${entry.id}`} className={styles.wishLink}>
                  <span className={styles.thumb}>
                    {entry.image ? (
                      <img src={entry.image} alt="" loading="lazy" decoding="async" />
                    ) : null}
                  </span>
                  <span className={styles.wishBody}>
                    <span className={styles.wishName}>{entry.name}</span>
                    <span className={styles.wishSet}>{entry.setName}</span>
                    <span className={styles.wishMeta}>
                      <span className={styles.priority}>
                        Prioridad {entry.priority}
                      </span>
                      <span className={styles.tag}>{entry.category}</span>
                    </span>
                    {entry.note ? (
                      <span className={styles.note}>“{entry.note}”</span>
                    ) : null}
                  </span>
                </Link>
                <div className={styles.wishActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setEditing(entry)}
                    aria-label={`Editar ${entry.name}`}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => remove(entry.id)}
                    aria-label={`Quitar ${entry.name}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing ? (
        <WishlistModal
          entry={editing}
          open
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}
