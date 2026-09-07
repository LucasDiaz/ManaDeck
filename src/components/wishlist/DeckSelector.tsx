import { type FormEvent, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import type { WishlistCollection } from "../../types";
import styles from "./DeckSelector.module.css";

interface DeckSelectorProps {
  collections: WishlistCollection[];
  /** `null` selects the "Todos los mazos" (all decks, grouped) view. */
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string) => void;
}

/** Sentinel `<select>` value standing in for the `null` (all decks) state. */
const ALL_VALUE = "all";

/**
 * Compact dropdown to switch between wishlist decks, with a "+ Nuevo mazo"
 * button pinned alongside it. Replaces the old horizontal tab-chip row —
 * one native control instead of N chips scales better once a user has more
 * than a handful of decks.
 */
export function DeckSelector({ collections, activeId, onSelect, onCreate }: DeckSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    onCreate(name);
    setDraftName("");
    setCreating(false);
  };

  return (
    <div className={styles.wrap}>
      <label htmlFor="deck-select" className={styles.srOnly}>
        Mazo activo
      </label>
      <div className={styles.selectWrap}>
        <select
          id="deck-select"
          className={styles.select}
          value={activeId ?? ALL_VALUE}
          onChange={(event) =>
            onSelect(event.target.value === ALL_VALUE ? null : event.target.value)
          }
        >
          <option value={ALL_VALUE}>Todos los mazos</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name} ({collection.items.length})
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
      </div>

      {creating ? (
        <form className={styles.inlineForm} onSubmit={submitCreate}>
          <input
            autoFocus
            className={styles.inlineInput}
            placeholder="Nombre del mazo"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setCreating(false);
                setDraftName("");
              }
            }}
            aria-label="Nombre del nuevo mazo"
          />
          <button type="submit" className={styles.iconBtn} aria-label="Crear mazo">
            <Check size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              setCreating(false);
              setDraftName("");
            }}
            aria-label="Cancelar creación"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <button type="button" className={styles.newBtn} onClick={() => setCreating(true)}>
          <Plus size={14} aria-hidden="true" />
          Nuevo mazo
        </button>
      )}
    </div>
  );
}
