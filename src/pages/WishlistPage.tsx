import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, Pencil, Trash2, X } from "lucide-react";
import type { WishlistCollection, WishlistItem } from "../types";
import { PageHeader, EmptyState } from "../components/common";
import { DeckSelector, WishlistModal, type WishlistEditTarget } from "../components/wishlist";
import { useWishlist } from "../hooks";
import styles from "./Collection.module.css";

interface ItemRowProps {
  item: WishlistItem;
  onEdit: () => void;
  onRemove: () => void;
}

function ItemRow({ item, onEdit, onRemove }: ItemRowProps) {
  return (
    <li className={styles.wishItem}>
      <Link to={`/carta/${item.id}`} className={styles.wishLink}>
        <span className={styles.thumb}>
          {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : null}
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
    </li>
  );
}

interface ActiveDeckHeadProps {
  deck: WishlistCollection;
  onRename: (name: string) => void;
  onDelete: () => void;
}

/**
 * Compact icon-only rename/delete controls for the currently selected deck —
 * kept out of DeckSelector's dropdown so editing surfaces only for the deck
 * in focus, right next to its title.
 */
function ActiveDeckHead({ deck, onRename, onDelete }: ActiveDeckHeadProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(deck.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset transient UI whenever the selected deck changes.
  useEffect(() => {
    setRenaming(false);
    setConfirmingDelete(false);
    setRenameValue(deck.name);
  }, [deck.id, deck.name]);

  const submitRename = (event: FormEvent) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (name) onRename(name);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <form className={styles.activeDeckHead} onSubmit={submitRename}>
        <input
          autoFocus
          className={styles.renameInput}
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setRenaming(false);
              setRenameValue(deck.name);
            }
          }}
          aria-label={`Renombrar mazo ${deck.name}`}
        />
        <div className={styles.deckIconActions}>
          <button type="submit" className={styles.deckIconBtn} aria-label="Guardar nombre">
            <Check size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.deckIconBtn}
            onClick={() => {
              setRenaming(false);
              setRenameValue(deck.name);
            }}
            aria-label="Cancelar renombrado"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.activeDeckHeadWrap}>
      <div className={styles.activeDeckHead}>
        <h2 className={styles.collectionTitle}>
          {deck.name}
          <span className={styles.collectionCount}>{deck.items.length}</span>
        </h2>
        <div className={styles.deckIconActions}>
          <button
            type="button"
            className={styles.deckIconBtn}
            onClick={() => setRenaming(true)}
            aria-label="Editar mazo"
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.deckIconBtn} ${styles.deckIconBtnDanger}`}
            onClick={() => setConfirmingDelete((v) => !v)}
            aria-expanded={confirmingDelete}
            aria-label="Borrar mazo"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {confirmingDelete ? (
        <div className={styles.confirmRow} role="alert">
          <span className={styles.confirmText}>
            ¿Borrar «{deck.name}» y sus {deck.items.length} cartas?
          </span>
          <button
            type="button"
            className={`${styles.deckActionBtn} ${styles.deckActionDanger}`}
            onClick={onDelete}
          >
            Sí, borrar
          </button>
          <button
            type="button"
            className={styles.deckActionBtn}
            onClick={() => setConfirmingDelete(false)}
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Wishlist organised into named decks/collections (RF6). */
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
        title="Lista de mazos"
        subtitle="Tus mazos de cartas: organizá lo que querés conseguir por mazo, por evento o como prefieras."
      >
        {activeCollection && activeCollection.items.length > 0 ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => clearCollection(activeCollection.id)}
          >
            Vaciar mazo
          </button>
        ) : null}
      </PageHeader>

      {collections.length > 0 ? (
        <DeckSelector
          collections={collections}
          activeId={activeCollectionId}
          onSelect={setActiveCollection}
          onCreate={(name) => createCollection(name)}
        />
      ) : null}

      {activeCollection ? (
        <ActiveDeckHead
          deck={activeCollection}
          onRename={(name) => renameCollection(activeCollection.id, name)}
          onDelete={() => deleteCollection(activeCollection.id)}
        />
      ) : null}

      {totalItems === 0 ? (
        <EmptyState
          icon={Heart}
          title="Tu lista está vacía"
          description="Abrí una carta y tocá «Añadir a deseos» para guardarla en un mazo."
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
              <p className={styles.emptyCollection}>Todavía no hay cartas en este mazo.</p>
            ) : (
              <ul className={styles.wishList} role="list">
                {collection.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => setEditing({ collectionId: collection.id, item })}
                    onRemove={() => removeCardFromCollection(collection.id, item.id)}
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
