import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Pencil, Trash2 } from "lucide-react";
import type { WishlistCollection, WishlistItem } from "../types";
import { PageHeader, EmptyState } from "../components/common";
import { CollectionTabs, WishlistModal, type WishlistEditTarget } from "../components/wishlist";
import { useWishlist } from "../hooks";
import styles from "./Collection.module.css";

interface ItemRowProps {
  item: WishlistItem;
  otherCollections: WishlistCollection[];
  onEdit: () => void;
  onRemove: () => void;
  onMove: (toCollectionId: string) => void;
}

function ItemRow({ item, otherCollections, onEdit, onRemove, onMove }: ItemRowProps) {
  return (
    <li className={styles.wishItem}>
      <div className={styles.wishItemMain}>
        <Link to={`/carta/${item.id}`} className={styles.wishLink}>
          <span className={styles.thumb}>
            {item.image ? (
              <img src={item.image} alt="" loading="lazy" decoding="async" />
            ) : null}
          </span>
          <span className={styles.wishBody}>
            <span className={styles.wishName}>{item.name}</span>
            <span className={styles.wishSet}>{item.setName}</span>
            <span className={styles.wishMeta}>
              <span className={styles.priority}>Prioridad {item.priority}</span>
            </span>
            {item.note ? <span className={styles.note}>“{item.note}”</span> : null}
          </span>
        </Link>
        <div className={styles.wishActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onEdit}
            aria-label={`Editar ${item.name}`}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={onRemove}
            aria-label={`Quitar ${item.name}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {otherCollections.length > 0 ? (
        <label className={styles.moveRow}>
          Mover a
          <select
            className={styles.moveSelect}
            value=""
            onChange={(event) => {
              if (event.target.value) onMove(event.target.value);
            }}
            aria-label={`Mover ${item.name} a otra colección`}
          >
            <option value="" disabled>
              Elegir colección…
            </option>
            {otherCollections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </li>
  );
}

/** Wishlist organised into named collections/folders (RF6). */
export function WishlistPage() {
  const {
    collections,
    activeCollectionId,
    activeCollection,
    setActiveCollection,
    createCollection,
    renameCollection,
    deleteCollection,
    clearCollection,
    removeCardFromCollection,
    moveCard,
  } = useWishlist();

  const [editing, setEditing] = useState<WishlistEditTarget | null>(null);

  const totalItems = collections.reduce((sum, collection) => sum + collection.items.length, 0);
  const visibleCollections = activeCollectionId
    ? collections.filter((collection) => collection.id === activeCollectionId)
    : collections;
  const showGroupHeadings = activeCollectionId === null;

  return (
    <section className={styles.section} aria-labelledby="wishlist-title">
      <PageHeader
        title="Lista de deseos"
        subtitle="Organizá las cartas que querés conseguir en colecciones: por mazo, por proyecto, como prefieras."
      >
        {activeCollection && activeCollection.items.length > 0 ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => clearCollection(activeCollection.id)}
          >
            Vaciar colección
          </button>
        ) : null}
      </PageHeader>

      {collections.length > 0 ? (
        <CollectionTabs
          collections={collections}
          activeId={activeCollectionId}
          onSelect={setActiveCollection}
          onCreate={(name) => createCollection(name)}
          onRename={(id, name) => renameCollection(id, name)}
          onDelete={deleteCollection}
        />
      ) : null}

      {totalItems === 0 ? (
        <EmptyState
          icon={Heart}
          title="Tu lista está vacía"
          description="Abrí una carta y tocá «Añadir a deseos» para guardarla en una colección."
        />
      ) : (
        visibleCollections.map((collection) => (
          <div key={collection.id} className={styles.collectionBlock}>
            {showGroupHeadings ? (
              <h2 className={styles.collectionTitle}>
                {collection.name}
                <span className={styles.collectionCount}>{collection.items.length}</span>
              </h2>
            ) : null}

            {collection.items.length === 0 ? (
              <p className={styles.emptyCollection}>Todavía no hay cartas en esta colección.</p>
            ) : (
              <ul className={styles.wishList} role="list">
                {collection.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    otherCollections={collections.filter((c) => c.id !== collection.id)}
                    onEdit={() => setEditing({ collectionId: collection.id, item })}
                    onRemove={() => removeCardFromCollection(collection.id, item.id)}
                    onMove={(toId) => moveCard(item.id, collection.id, toId)}
                  />
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      {editing ? <WishlistModal editing={editing} open onClose={() => setEditing(null)} /> : null}
    </section>
  );
}
