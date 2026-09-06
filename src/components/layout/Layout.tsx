import { Outlet } from "react-router-dom";
import { useScrollToTop } from "../../hooks";
import { OfflineBanner } from "../common";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import styles from "./Layout.module.css";

/** Persistent app shell: brand header, routed content, fixed bottom nav. */
export function Layout() {
  useScrollToTop();

  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <OfflineBanner />
    </div>
  );
}
