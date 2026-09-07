import { type FormEvent, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { WishlistCollection } from "../../types";
import styles from "./CollectionTabs.module.css";

interface CollectionTabsProps {
  collections: WishlistCollection[];
  /** `null` selects the "Todas" (all collections, grouped) view. */
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/** Tab bar to switch/create/rename/delete wishlist collections (RF6). */
export function CollectionTabs({
  collections,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: CollectionTabsProps) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    onCreate(name);
    setDraftName("");
    setCreating(false);
  };

  const startRename = (collection: WishlistCollection) => {
    setRenamingId(collection.id);
    setRenameValue(collection.name);
  };

  const submitRename = (event: FormEvent, id: string) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (name) onRename(id, name);
    setRenamingId(null);
  };

  return (
    <div className={styles.wrap} role="tablist" aria-label="Colecciones de deseos">
      <button
        type="button"
        role="tab"
        aria-selected={activeId === null}
        className={activeId === null ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        onClick={() => onSelect(null)}
      >
        Todas
      </button>

      {collections.map((collection) =>
        renamingId === collection.id ? (
          <form
            key={collection.id}
            className={styles.inlineForm}
            onSubmit={(event) => submitRename(event, collection.id)}
          >
            <input
              autoFocus
              className={styles.inlineInput}
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              aria-label={`Renombrar ${collection.name}`}
            />
            <button type="submit" className={styles.iconBtn} aria-label="Guardar nombre">
              <Check size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setRenamingId(null)}
              aria-label="Cancelar renombrado"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <div key={collection.id} className={styles.tabGroup}>
            <button
              type="button"
              role="tab"
              aria-selected={activeId === collection.id}
              className={
                activeId === collection.id ? `${styles.tab} ${styles.tabActive}` : styles.tab
              }
              onClick={() => onSelect(collection.id)}
            >
              {collection.name}
              <span className={styles.count}>{collection.items.length}</span>
            </button>
            <button
              type="button"
              className={styles.tabAction}
              onClick={() => startRename(collection)}
              aria-label={`Renombrar ${collection.name}`}
            >
              <Pencil size={11} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.tabAction} ${styles.tabActionDanger}`}
              onClick={() => onDelete(collection.id)}
              aria-label={`Eliminar ${collection.name}`}
            >
              <Trash2 size={11} aria-hidden="true" />
            </button>
          </div>
        ),
      )}

      {creating ? (
        <form className={styles.inlineForm} onSubmit={submitCreate}>
          <input
            autoFocus
            className={styles.inlineInput}
            placeholder="Nombre de la colección"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            aria-label="Nombre de la nueva colección"
          />
          <button type="submit" className={styles.iconBtn} aria-label="Crear colección">
            <Check size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setCreating(false)}
            aria-label="Cancelar creación"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <button type="button" className={styles.newTab} onClick={() => setCreating(true)}>
          <Plus size={13} aria-hidden="true" />
          Nueva
        </button>
      )}
    </div>
  );
}
