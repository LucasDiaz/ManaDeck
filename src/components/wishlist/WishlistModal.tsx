import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Heart, Plus, ChevronDown } from "lucide-react";
import type { Card, WishlistDraft, WishlistItem } from "../../types";
import { useWishlist } from "../../hooks";
import styles from "./WishlistModal.module.css";

const NOTE_MAX = 200;
const COLLECTION_NAME_MIN = 2;

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
}

function validate(
  priorityRaw: string,
  note: string,
  collectionId: string,
): { errors: FieldErrors; result?: ValidatedFields } {
  const errors: FieldErrors = {};

  const priority = Number(priorityRaw);
  if (priorityRaw.trim() === "") {
    errors.priority = "La prioridad es obligatoria.";
  } else if (!Number.isFinite(priority) || priority <= 0) {
    errors.priority = "Debe ser un número mayor que 0.";
  }

  if (!collectionId) {
    errors.collection = "Elegí o creá una colección.";
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
    },
  };
}

/**
 * Accessible modal to add or edit a wishlist card. In the add flow the user
 * picks an existing collection or creates one on the fly; in the edit flow
 * the same `<select>` doubles as a "move to another deck" control (submit
 * calls `moveCard` when it no longer matches the item's original deck).
 */
export function WishlistModal({ card, editing, open, onClose, onSaved }: WishlistModalProps) {
  const {
    collections,
    activeCollectionId,
    createCollection,
    addCardToCollection,
    updateCardInCollection,
    moveCard,
  } = useWishlist();

  const targetName = card?.name ?? editing?.item.name ?? "";

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const newCollectionInputRef = useRef<HTMLInputElement>(null);

  const [priority, setPriority] = useState("");
  const [note, setNote] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
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
      setCollectionId(activeCollectionId ?? collections[0]?.id ?? "");
    }
    setCreatingCollection(false);
    setNewCollectionName("");
    setErrors({});
    setSaved(false);
    openerRef.current = document.activeElement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-focus the inline "new collection" input the moment it appears.
  useEffect(() => {
    if (creatingCollection) newCollectionInputRef.current?.focus();
  }, [creatingCollection]);

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
    const { errors: fieldErrors, result } = validate(priority, note, collectionId);
    setErrors(fieldErrors);
    if (!result) return;

    if (editing) {
      updateCardInCollection(editing.collectionId, editing.item.id, result.draft);
      if (result.collectionId !== editing.collectionId) {
        moveCard(editing.item.id, editing.collectionId, result.collectionId);
      }
    } else if (card) {
      addCardToCollection(result.collectionId, card, result.draft);
    }

    setSaved(true);
    onSaved?.();
    window.setTimeout(onClose, 900);
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (name.length < COLLECTION_NAME_MIN) {
      setErrors((prev) => ({ ...prev, collection: `Mínimo ${COLLECTION_NAME_MIN} caracteres.` }));
      return;
    }
    const created = createCollection(name);
    setCollectionId(created.id);
    setCreatingCollection(false);
    setNewCollectionName("");
    setErrors((prev) => ({ ...prev, collection: undefined }));
  };

  const noteLength = note.length;
  const noteOver = noteLength > NOTE_MAX;

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
              <label htmlFor="wl-collection" className={styles.label}>
                {editing ? "Mover a mazo" : "Colección"} <span className={styles.req}>*</span>
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="wl-collection"
                  className={styles.select}
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  aria-invalid={Boolean(errors.collection)}
                  aria-describedby={errors.collection ? "wl-collection-err" : undefined}
                >
                  {collections.length === 0 ? <option value="">Sin colecciones aún</option> : null}
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name} ({collection.items.length})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className={styles.selectChevron} aria-hidden="true" />
              </div>

              {!editing ? (
                <>
                  <button
                    type="button"
                    className={styles.addCollectionBtn}
                    aria-expanded={creatingCollection}
                    onClick={() => setCreatingCollection((v) => !v)}
                  >
                    <Plus size={14} aria-hidden="true" />
                    Nueva colección
                  </button>

                  {creatingCollection ? (
                    <div className={styles.newCollectionRow}>
                      <input
                        ref={newCollectionInputRef}
                        type="text"
                        className={styles.input}
                        placeholder="p. ej. Commander Deck: Atraxa"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCollection();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            setCreatingCollection(false);
                            setNewCollectionName("");
                          }
                        }}
                        aria-label="Nombre de la nueva colección"
                      />
                      <button
                        type="button"
                        className={styles.chipSave}
                        onClick={handleCreateCollection}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className={styles.chipCancel}
                        onClick={() => {
                          setCreatingCollection(false);
                          setNewCollectionName("");
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
              {errors.collection ? (
                <p id="wl-collection-err" className={styles.error}>
                  {errors.collection}
                </p>
              ) : null}
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
