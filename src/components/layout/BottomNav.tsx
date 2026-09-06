import { Link, NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import styles from "./BottomNav.module.css";

/**
 * Primary navigation.
 * - Mobile / tablet (< 1024px): a fixed bottom bar.
 * - Desktop (>= 1024px): a sticky, full-height vertical navigation rail
 *   docked to the left edge, with the brand mark at the top.
 */
export function BottomNav() {
  return (
    <footer className={styles.bar}>
      <nav className={styles.nav} aria-label="Navegación principal">
        <Link to="/" className={styles.brand} aria-label="ManaDeck — Inicio">
          <span className={styles.brandMark} aria-hidden="true">
            <Sparkles size={18} strokeWidth={2.2} />
          </span>
          <span className={styles.brandWord}>
            Mana<span className={styles.brandAccent}>Deck</span>
          </span>
        </Link>
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
