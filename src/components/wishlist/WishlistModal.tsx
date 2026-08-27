import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Heart } from "lucide-react";
import type { Card, WishlistDraft } from "../../types";
import { useWishlist } from "../../hooks";
import styles from "./WishlistModal.module.css";

const NOTE_MAX = 200;
const CATEGORY_MIN = 2;

interface WishlistModalProps {
  card: Card;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FieldErrors {
  priority?: string;
  category?: string;
  note?: string;
}

function validate(
  priorityRaw: string,
  category: string,
  note: string,
): { errors: FieldErrors; draft?: WishlistDraft } {
  const errors: FieldErrors = {};

  const priority = Number(priorityRaw);
  if (priorityRaw.trim() === "") {
    errors.priority = "La prioridad es obligatoria.";
  } else if (!Number.isFinite(priority) || priority <= 0) {
    errors.priority = "Debe ser un número mayor que 0.";
  }

  if (category.trim().length < CATEGORY_MIN) {
    errors.category = `Mínimo ${CATEGORY_MIN} caracteres.`;
  }

  if (note.length > NOTE_MAX) {
    errors.note = `Máximo ${NOTE_MAX} caracteres.`;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    draft: {
      priority,
      category: category.trim(),
      note: note.trim() || undefined,
    },
  };
}

/** Accessible modal to add a card to the wishlist with client-side validation. */
export function WishlistModal({
  card,
  open,
  onClose,
  onSaved,
}: WishlistModalProps) {
  const { save, items } = useWishlist();
  const existing = items.find((item) => item.id === card.id);

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  // Seed / reset fields whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setPriority(existing ? String(existing.priority) : "1");
    setCategory(existing?.category ?? "");
    setNote(existing?.note ?? "");
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
        ?.querySelector<HTMLElement>("input, textarea, button")
        ?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validate(priority, category, note);
    setErrors(result.errors);
    if (!result.draft) return;

    save(card, result.draft);
    setSaved(true);
    onSaved?.();
    window.setTimeout(onClose, 900);
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
                {existing ? "Editar deseo" : "Añadir a deseos"}
              </h2>
              <p className={styles.cardName}>{card.name}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar"
          >
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
              <label htmlFor="wl-category" className={styles.label}>
                Categoría / Mazo <span className={styles.req}>*</span>
              </label>
              <input
                id="wl-category"
                type="text"
                className={styles.input}
                placeholder="p. ej. Mono-Red Aggro"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? "wl-category-err" : undefined}
              />
              {errors.category ? (
                <p id="wl-category-err" className={styles.error}>
                  {errors.category}
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
                className={
                  noteOver ? `${styles.counter} ${styles.counterOver}` : styles.counter
                }
              >
                {noteLength}/{NOTE_MAX}
              </p>
              {errors.note ? <p className={styles.error}>{errors.note}</p> : null}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancel}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.submit}>
                {existing ? "Guardar cambios" : "Añadir"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
