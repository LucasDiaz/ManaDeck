import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import styles from "./OfflineBanner.module.css";

const getOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/**
 * Non-intrusive toast shown while the browser reports no connection.
 * History and Wishlist keep working from localStorage; only live
 * Scryfall data is unavailable.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(getOffline);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <CloudOff size={15} strokeWidth={2} aria-hidden="true" />
      <span>Sin conexión — tus listas siguen disponibles</span>
    </div>
  );
}
