import { Home, Search, Heart, History, Mail } from "lucide-react";
import type { NavItem } from "../../types";

/** Destinations shown in the persistent bottom navigation bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/deseos", label: "Deseos", icon: Heart },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/contacto", label: "Contacto", icon: Mail },
];
