import { useState } from "react";
import { getSetIconUrl } from "../../services";
import styles from "./SetIcon.module.css";

interface SetIconProps {
  /** Set code, e.g. `"neo"`. */
  setCode: string | undefined;
  size?: number;
  className?: string;
}

/**
 * Set symbol from Scryfall's SVG CDN. Some sets (promos like `pdtk`) 404 —
 * on load failure it swaps to an inline generic Magic pentagon glyph instead
 * of showing a broken image or logging a console warning.
 */
export function SetIcon({ setCode, size = 22, className }: SetIconProps) {
  // Track the failed state per set code (reset on change during render).
  const [state, setState] = useState({ code: setCode, failed: false });
  if (state.code !== setCode) setState({ code: setCode, failed: false });

  const cls = className ? `${styles.icon} ${className}` : styles.icon;

  if (!setCode || state.failed) {
    return (
      <svg
        className={cls}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label="Símbolo de expansión"
      >
        <path
          fill="currentColor"
          d="M12 2.4 3.9 8.3l3.1 9.5h10l3.1-9.5L12 2.4Zm0 3.1 5.5 4-2.1 6.4H8.6L6.5 9.5 12 5.5Z"
        />
        <circle cx="12" cy="11.4" r="2.2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <img
      src={getSetIconUrl(setCode)}
      alt=""
      className={cls}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setState({ code: setCode, failed: true })}
    />
  );
}
