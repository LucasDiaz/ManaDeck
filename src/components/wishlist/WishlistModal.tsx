import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Heart } from "lucide-react";
import type { Card, WishlistDraft, WishlistItem } from "../../types";
import { useWishlist } from "../../hooks";
import styles from "./WishlistModal.module.css";

const NOTE_MAX = 200;
const COLLECTION_NAME_MIN = 2;
/** Sentinel `<select>` value meaning "create a new collection on the fly". */
const NEW_COLLECTION_VALUE = "__new__";

export interface WishlistEditTarget {
  collectionId: string;
  item: WishlistItem;
}

interface WishlistModalProps {
  /** Add flow: the full card being wishlisted. */
  card?: Card;
  /** Edit flow: an existing item plus the collection it lives in. */
  editing?: WishlistEditTarget;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FieldErrors {
  priority?: string;
  collection?: string;
  note?: string;
}

interface ValidatedFields {
  draft: WishlistDraft;
  collectionId: string;
  newCollectionName?: string;
}

function validate(
  priorityRaw: string,
  note: string,
  collectionId: string,
  newCollectionName: string,
): { errors: FieldErrors; result?: ValidatedFields } {
  const errors: FieldErrors = {};

  const priority = Number(priorityRaw);
  if (priorityRaw.trim() === "") {
    errors.priority = "La prioridad es obligatoria.";
  } else if (!Number.isFinite(priority) || priority <= 0) {
    errors.priority = "Debe ser un número mayor que 0.";
  }

  const creatingNew = collectionId === NEW_COLLECTION_VALUE;
  if (!collectionId) {
    errors.collection = "Elegí una colección.";
  } else if (creatingNew && newCollectionName.trim().length < COLLECTION_NAME_MIN) {
    errors.collection = `Mínimo ${COLLECTION_NAME_MIN} caracteres.`;
  }

  if (note.length > NOTE_MAX) {
    errors.note = `Máximo ${NOTE_MAX} caracteres.`;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    result: {
      draft: { priority, note: note.trim() || undefined },
      collectionId,
      newCollectionName: creatingNew ? newCollectionName.trim() : undefined,
    },
  };
}

/**
 * Accessible modal to add or edit a wishlist card. In the add flow the user
 * picks an existing collection or creates one on the fly; in the edit flow
 * the collection is fixed (moving between collections happens from the
 * Wishlist page itself, see `moveCard`).
 */
export function WishlistModal({ card, editing, open, onClose, onSaved }: WishlistModalProps) {
  const { collections, activeCollectionId, createCollection, addCardToCollection, updateCardInCollection } =
    useWishlist();

  const targetName = card?.name ?? editing?.item.name ?? "";

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  const [priority, setPriority] = useState("");
  const [note, setNote] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  // Seed / reset fields whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setPriority(String(editing.item.priority));
      setNote(editing.item.note ?? "");
      setCollectionId(editing.collectionId);
    } else {
      setPriority("1");
      setNote("");
      setCollectionId(activeCollectionId ?? collections[0]?.id ?? NEW_COLLECTION_VALUE);
    }
    setNewCollectionName("");
    setErrors({});
    setSaved(false);
    openerRef.current = document.activeElement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Body scroll lock + Esc + focus management while open.
  useEffect(() => {
    if (!open) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("input, textarea, select, button")
        ?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open || (!card && !editing)) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { errors: fieldErrors, result } = validate(priority, note, collectionId, newCollectionName);
    setErrors(fieldErrors);
    if (!result) return;

    if (editing) {
      updateCardInCollection(editing.collectionId, editing.item.id, result.draft);
    } else if (card) {
      const targetCollectionId = result.newCollectionName
        ? createCollection(result.newCollectionName).id
        : result.collectionId;
      addCardToCollection(targetCollectionId, card, result.draft);
    }

    setSaved(true);
    onSaved?.();
    window.setTimeout(onClose, 900);
  };

  const noteLength = note.length;
  const noteOver = noteLength > NOTE_MAX;
  const creatingNew = collectionId === NEW_COLLECTION_VALUE;
  const editingCollectionName = editing
    ? (collections.find((c) => c.id === editing.collectionId)?.name ?? "Colección eliminada")
    : null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <header className={styles.header}>
          <div className={styles.headTitle}>
            <span className={styles.headIcon} aria-hidden="true">
              <Heart size={16} />
            </span>
            <div>
              <h2 id={titleId} className={styles.title}>
                {editing ? "Editar deseo" : "Añadir a deseos"}
              </h2>
              <p className={styles.cardName}>{targetName}</p>
            </div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {saved ? (
          <div className={styles.success} role="status">
            <span className={styles.successIcon} aria-hidden="true">
              <Check size={20} />
            </span>
            Guardado en tu lista de deseos
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="wl-priority" className={styles.label}>
                Prioridad <span className={styles.req}>*</span>
              </label>
              <input
                id="wl-priority"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className={styles.input}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-invalid={Boolean(errors.priority)}
                aria-describedby={errors.priority ? "wl-priority-err" : undefined}
              />
              <p className={styles.hint}>1 = lo consigo primero.</p>
              {errors.priority ? (
                <p id="wl-priority-err" className={styles.error}>
                  {errors.priority}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              {editing ? (
                <>
                  <span className={styles.label}>Colección</span>
                  <p className={styles.hint}>{editingCollectionName}</p>
                </>
              ) : (
                <>
                  <label htmlFor="wl-collection" className={styles.label}>
                    Colección <span className={styles.req}>*</span>
                  </label>
                  <select
                    id="wl-collection"
                    className={styles.input}
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    aria-invalid={Boolean(errors.collection)}
                    aria-describedby={errors.collection ? "wl-collection-err" : undefined}
                  >
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name} ({collection.items.length})
                      </option>
                    ))}
                    <option value={NEW_COLLECTION_VALUE}>+ Crear nueva colección…</option>
                  </select>
                  {creatingNew ? (
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="p. ej. Commander Deck: Atraxa"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      aria-label="Nombre de la nueva colección"
                    />
                  ) : null}
                  {errors.collection ? (
                    <p id="wl-collection-err" className={styles.error}>
                      {errors.collection}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="wl-note" className={styles.label}>
                Nota personal
              </label>
              <textarea
                id="wl-note"
                className={styles.textarea}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-invalid={noteOver}
                aria-describedby="wl-note-count"
              />
              <p
                id="wl-note-count"
                className={noteOver ? `${styles.counter} ${styles.counterOver}` : styles.counter}
              >
                {noteLength}/{NOTE_MAX}
              </p>
              {errors.note ? <p className={styles.error}>{errors.note}</p> : null}
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancel} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={styles.submit}>
                {editing ? "Guardar cambios" : "Añadir"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
