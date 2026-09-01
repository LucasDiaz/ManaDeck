import { useCallback, useSyncExternalStore } from "react";
import type { Card, WishlistDraft, WishlistEntry } from "../types";
import { toCardSummary } from "../types";
import { getCardImage } from "../services";
import { createPersistentStore } from "../lib/persistentStore";

const STORAGE_KEY = "manadeck_wishlist";

const store = createPersistentStore<WishlistEntry[]>(STORAGE_KEY, [], {
  legacyKey: "manadeck:wishlist",
});

const bySort = (a: WishlistEntry, b: WishlistEntry) =>
  a.priority - b.priority || b.addedAt - a.addedAt;

export interface UseWishlistResult {
  items: WishlistEntry[];
  has: (id: string) => boolean;
  get: (id: string) => WishlistEntry | undefined;
  /** Add or replace the wishlist entry for a card. Returns the saved entry. */
  save: (card: Card, draft: WishlistDraft) => WishlistEntry;
  /** Update only the metadata of an existing entry (edit flow). */
  updateEntry: (id: string, draft: WishlistDraft) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/** Wishlist entries persisted to localStorage (RF6). */
export function useWishlist(): UseWishlistResult {
  const items = useSyncExternalStore(
    store.subscribe,
    store.get,
    () => [] as WishlistEntry[],
  );

  const has = useCallback(
    (id: string) => store.get().some((item) => item.id === id),
    [],
  );

  const get = useCallback(
    (id: string) => store.get().find((item) => item.id === id),
    [],
  );

  const save = useCallback((card: Card, draft: WishlistDraft): WishlistEntry => {
    const previous = store.get().find((item) => item.id === card.id);
    const entry: WishlistEntry = {
      ...toCardSummary(
        card,
        getCardImage(card, "art_crop") ?? getCardImage(card, "small"),
      ),
      priority: draft.priority,
      category: draft.category.trim(),
      note: draft.note?.trim() || undefined,
      addedAt: previous?.addedAt ?? Date.now(),
    };
    store.update((current) =>
      [entry, ...current.filter((item) => item.id !== entry.id)].sort(bySort),
    );
    return entry;
  }, []);

  const updateEntry = useCallback((id: string, draft: WishlistDraft) => {
    store.update((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                priority: draft.priority,
                category: draft.category.trim(),
                note: draft.note?.trim() || undefined,
              }
            : item,
        )
        .sort(bySort),
    );
  }, []);

  const remove = useCallback((id: string) => {
    store.update((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => store.set([]), []);

  return { items, has, get, save, updateEntry, remove, clear };
}
