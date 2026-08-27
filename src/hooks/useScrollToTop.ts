import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the viewport back to the top whenever the pathname changes.
 * Mounted once inside the persistent layout.
 */
export function useScrollToTop(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}
