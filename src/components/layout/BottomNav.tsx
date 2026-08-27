import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";
import styles from "./BottomNav.module.css";

/** Fixed mobile-first bottom navigation with active-route highlighting. */
export function BottomNav() {
  return (
    <footer className={styles.bar}>
      <nav className={styles.nav} aria-label="Navegación principal">
        <ul className={styles.list} role="list">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className={styles.item}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={styles.iconWrap}>
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.4 : 1.9}
                        aria-hidden="true"
                      />
                    </span>
                    <span className={styles.label}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
