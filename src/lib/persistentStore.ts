/**
 * Minimal localStorage-backed store with an external-store subscription API
 * (for `useSyncExternalStore`). Keeps every tab and every component in sync.
 */
export interface PersistentStore<T> {
  get: () => T;
  set: (next: T) => void;
  update: (updater: (current: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createPersistentStore<T>(
  key: string,
  fallback: T,
): PersistentStore<T> {
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  let snapshot: T = read();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const set = (next: T): void => {
    snapshot = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage full / unavailable — keep the in-memory value
    }
    emit();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === key || event.key === null) {
        snapshot = read();
        emit();
      }
    });
  }

  return {
    get: () => snapshot,
    set,
    update: (updater) => set(updater(snapshot)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
