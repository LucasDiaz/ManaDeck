import { useCallback, useSyncExternalStore } from "react";
import type { Card, WishlistDraft, WishlistEntry } from "../types";
import { toCardSummary } from "../types";
import { getCardImage } from "../services";
import { createPersistentStore } from "../lib/persistentStore";

const STORAGE_KEY = "manadeck:wishlist";

const store = createPersistentStore<WishlistEntry[]>(STORAGE_KEY, []);

export interface UseWishlistResult {
  items: WishlistEntry[];
  has: (id: string) => boolean;
  /** Add or replace the wishlist entry for a card. Returns the saved entry. */
  save: (card: Card, draft: WishlistDraft) => WishlistEntry;
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

  const save = useCallback((card: Card, draft: WishlistDraft): WishlistEntry => {
    const entry: WishlistEntry = {
      ...toCardSummary(
        card,
        getCardImage(card, "art_crop") ?? getCardImage(card, "small"),
      ),
      priority: draft.priority,
      category: draft.category.trim(),
      note: draft.note?.trim() || undefined,
      addedAt: Date.now(),
    };
    store.update((current) => {
      const without = current.filter((item) => item.id !== entry.id);
      return [entry, ...without].sort(
        (a, b) => a.priority - b.priority || b.addedAt - a.addedAt,
      );
    });
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    store.update((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => store.set([]), []);

  return { items, has, save, remove, clear };
}
