import { useCallback, useSyncExternalStore } from "react";
import type { Card, WishlistCollection, WishlistDraft, WishlistItem } from "../types";
import { toCardSummary } from "../types";
import { getCardImage } from "../services";
import { createPersistentStore } from "../lib/persistentStore";
import { createId } from "../lib/id";

const STORAGE_KEY = "manadeck_wishlist_v2";
/** Pre-collections storage key: a flat array of entries with a `category` field. */
const LEGACY_FLAT_KEY = "manadeck_wishlist";
const DEFAULT_COLLECTION_NAME = "Mi lista de deseos";

export interface WishlistState {
  collections: WishlistCollection[];
  activeCollectionId: string | null;
}

const EMPTY_STATE: WishlistState = { collections: [], activeCollectionId: null };

/** Shape of one entry in the pre-collections flat wishlist. Migration-only. */
interface LegacyWishlistEntry {
  id: string;
  name: string;
  setName: string;
  collectorNumber?: string;
  image?: string;
  typeLine?: string;
  priority: number;
  category: string;
  note?: string;
  addedAt: number;
}

function isLegacyEntry(value: unknown): value is LegacyWishlistEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.priority === "number" &&
    typeof v.addedAt === "number"
  );
}

/**
 * One-off migration: the pre-collections wishlist was a flat array of
 * entries with a free-text `category` field (the user's own "deck" label).
 * Each distinct category becomes its own collection so that organisation
 * isn't lost when upgrading. Runs once at module load, before the
 * persistent store below reads `STORAGE_KEY` for the first time.
 */
function migrateLegacyWishlist(): WishlistState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LEGACY_FLAT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isLegacyEntry)) {
      return null;
    }

    const byCategory = new Map<string, WishlistCollection>();
    for (const entry of parsed) {
      const name = entry.category.trim() || DEFAULT_COLLECTION_NAME;
      let collection = byCategory.get(name);
      if (!collection) {
        collection = { id: createId(), name, createdAt: entry.addedAt, items: [] };
        byCategory.set(name, collection);
      }
      const { category: _category, ...item } = entry;
      collection.items.push(item);
    }

    const collections = [...byCategory.values()];
    return { collections, activeCollectionId: collections[0]?.id ?? null };
  } catch {
    return null;
  } finally {
    try {
      localStorage.removeItem(LEGACY_FLAT_KEY);
    } catch {
      // ignore — storage unavailable
    }
  }
}

(function seedFromLegacyWishlist() {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    const migrated = migrateLegacyWishlist();
    if (migrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    // storage unavailable — createPersistentStore's own read() falls back safely
  }
})();

const store = createPersistentStore<WishlistState>(STORAGE_KEY, EMPTY_STATE);

const byPriorityThenRecency = (a: WishlistItem, b: WishlistItem) =>
  a.priority - b.priority || b.addedAt - a.addedAt;

function withCollection(
  state: WishlistState,
  id: string,
  update: (collection: WishlistCollection) => WishlistCollection,
): WishlistState {
  return {
    ...state,
    collections: state.collections.map((collection) =>
      collection.id === id ? update(collection) : collection,
    ),
  };
}

export interface UseWishlistResult {
  collections: WishlistCollection[];
  activeCollectionId: string | null;
  activeCollection: WishlistCollection | null;
  setActiveCollection: (id: string | null) => void;

  createCollection: (name: string, description?: string) => WishlistCollection;
  renameCollection: (id: string, name: string, description?: string) => void;
  deleteCollection: (id: string) => void;
  /** Remove every item from a collection without deleting the collection itself. */
  clearCollection: (id: string) => void;

  /** Add or replace (upsert by card id) a card inside one collection. */
  addCardToCollection: (
    collectionId: string,
    card: Card,
    draft: WishlistDraft,
  ) => WishlistItem;
  /** Update only the metadata (priority/note) of an existing item. */
  updateCardInCollection: (
    collectionId: string,
    cardId: string,
    draft: WishlistDraft,
  ) => void;
  removeCardFromCollection: (collectionId: string, cardId: string) => void;
  /** Move one card from one collection to another, preserving its metadata. */
  moveCard: (cardId: string, fromCollectionId: string, toCollectionId: string) => void;

  /** True when the card is saved in at least one collection. */
  hasCard: (cardId: string) => boolean;
  /** Every collection that currently contains this card. */
  findCollectionsForCard: (cardId: string) => WishlistCollection[];
}

/** Wishlist organised into named collections/folders (RF6). */
export function useWishlist(): UseWishlistResult {
  const state = useSyncExternalStore(store.subscribe, store.get, () => EMPTY_STATE);

  const setActiveCollection = useCallback((id: string | null) => {
    store.update((current) => ({ ...current, activeCollectionId: id }));
  }, []);

  const createCollection = useCallback(
    (name: string, description?: string): WishlistCollection => {
      const collection: WishlistCollection = {
        id: createId(),
        name: name.trim(),
        description: description?.trim() || undefined,
        createdAt: Date.now(),
        items: [],
      };
      store.update((current) => ({
        collections: [...current.collections, collection],
        activeCollectionId: collection.id,
      }));
      return collection;
    },
    [],
  );

  const renameCollection = useCallback(
    (id: string, name: string, description?: string) => {
      store.update((current) =>
        withCollection(current, id, (collection) => ({
          ...collection,
          name: name.trim(),
          description: description?.trim() || undefined,
        })),
      );
    },
    [],
  );

  const deleteCollection = useCallback((id: string) => {
    store.update((current) => {
      const collections = current.collections.filter((collection) => collection.id !== id);
      const activeCollectionId =
        current.activeCollectionId === id
          ? (collections[0]?.id ?? null)
          : current.activeCollectionId;
      return { collections, activeCollectionId };
    });
  }, []);

  const clearCollection = useCallback((id: string) => {
    store.update((current) =>
      withCollection(current, id, (collection) => ({ ...collection, items: [] })),
    );
  }, []);

  const addCardToCollection = useCallback(
    (collectionId: string, card: Card, draft: WishlistDraft): WishlistItem => {
      const summary = toCardSummary(
        card,
        getCardImage(card, "art_crop") ?? getCardImage(card, "small"),
      );
      const now = Date.now();
      let saved: WishlistItem | null = null;

      store.update((current) =>
        withCollection(current, collectionId, (collection) => {
          const previous = collection.items.find((item) => item.id === card.id);
          const item: WishlistItem = {
            ...summary,
            priority: draft.priority,
            note: draft.note?.trim() || undefined,
            addedAt: previous?.addedAt ?? now,
          };
          saved = item;
          return {
            ...collection,
            items: [item, ...collection.items.filter((i) => i.id !== card.id)].sort(
              byPriorityThenRecency,
            ),
          };
        }),
      );

      if (!saved) {
        throw new Error(`No existe la colección "${collectionId}".`);
      }
      return saved;
    },
    [],
  );

  const updateCardInCollection = useCallback(
    (collectionId: string, cardId: string, draft: WishlistDraft) => {
      store.update((current) =>
        withCollection(current, collectionId, (collection) => ({
          ...collection,
          items: collection.items
            .map((item) =>
              item.id === cardId
                ? { ...item, priority: draft.priority, note: draft.note?.trim() || undefined }
                : item,
            )
            .sort(byPriorityThenRecency),
        })),
      );
    },
    [],
  );

  const removeCardFromCollection = useCallback((collectionId: string, cardId: string) => {
    store.update((current) =>
      withCollection(current, collectionId, (collection) => ({
        ...collection,
        items: collection.items.filter((item) => item.id !== cardId),
      })),
    );
  }, []);

  const moveCard = useCallback(
    (cardId: string, fromCollectionId: string, toCollectionId: string) => {
      if (fromCollectionId === toCollectionId) return;

      store.update((current) => {
        const from = current.collections.find((c) => c.id === fromCollectionId);
        const item = from?.items.find((i) => i.id === cardId);
        if (!item) return current;

        return {
          ...current,
          collections: current.collections.map((collection) => {
            if (collection.id === fromCollectionId) {
              return {
                ...collection,
                items: collection.items.filter((i) => i.id !== cardId),
              };
            }
            if (collection.id === toCollectionId) {
              return {
                ...collection,
                items: [item, ...collection.items.filter((i) => i.id !== cardId)].sort(
                  byPriorityThenRecency,
                ),
              };
            }
            return collection;
          }),
        };
      });
    },
    [],
  );

  const hasCard = useCallback(
    (cardId: string) =>
      state.collections.some((collection) =>
        collection.items.some((item) => item.id === cardId),
      ),
    [state.collections],
  );

  const findCollectionsForCard = useCallback(
    (cardId: string) =>
      state.collections.filter((collection) =>
        collection.items.some((item) => item.id === cardId),
      ),
    [state.collections],
  );

  const activeCollection =
    state.collections.find((collection) => collection.id === state.activeCollectionId) ?? null;

  return {
    collections: state.collections,
    activeCollectionId: state.activeCollectionId,
    activeCollection,
    setActiveCollection,
    createCollection,
    renameCollection,
    deleteCollection,
    clearCollection,
    addCardToCollection,
    updateCardInCollection,
    removeCardFromCollection,
    moveCard,
    hasCard,
    findCollectionsForCard,
  };
}
