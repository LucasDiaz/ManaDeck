import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

/** A single destination in the persistent bottom navigation bar. */
export interface NavItem {
  /** Route path this item links to. */
  to: string;
  /** Visible label (Spanish UI). */
  label: string;
  /** Icon component from lucide-react. */
  icon: ComponentType<LucideProps>;
  /** Whether the route should match exactly (used for the Home "/" route). */
  end?: boolean;
}
