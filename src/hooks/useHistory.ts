import { useCallback, useSyncExternalStore } from "react";
import type { Card, HistoryEntry } from "../types";
import { toCardSummary } from "../types";
import { getCardImage } from "../services";
import { createPersistentStore } from "../lib/persistentStore";

const STORAGE_KEY = "manadeck:history";
const MAX_ENTRIES = 60;

const store = createPersistentStore<HistoryEntry[]>(STORAGE_KEY, []);

export interface UseHistoryResult {
  history: HistoryEntry[];
  /** Record a card view — moves it to the front, keeps reverse-chronological. */
  logVisit: (card: Card) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

/** Recently-viewed cards, newest first, persisted to localStorage (RF4). */
export function useHistory(): UseHistoryResult {
  const history = useSyncExternalStore(
    store.subscribe,
    store.get,
    () => [] as HistoryEntry[],
  );

  const logVisit = useCallback((card: Card) => {
    const entry: HistoryEntry = {
      ...toCardSummary(card, getCardImage(card, "art_crop") ?? getCardImage(card, "small")),
      viewedAt: Date.now(),
    };
    store.update((current) => [
      entry,
      ...current.filter((item) => item.id !== entry.id),
    ].slice(0, MAX_ENTRIES));
  }, []);

  const removeEntry = useCallback((id: string) => {
    store.update((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    store.set([]);
  }, []);

  return { history, logVisit, removeEntry, clearHistory };
}
