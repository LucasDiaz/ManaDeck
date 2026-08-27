import { Heart } from "lucide-react";
import { PageHeader, EmptyState } from "../components/common";
import styles from "./Page.module.css";

/** Wishlist of cards the user wants to acquire. */
export function WishlistPage() {
  return (
    <section className={styles.section} aria-labelledby="wishlist-title">
      <PageHeader
        title="Lista de deseos"
        subtitle="Guarda las cartas que quieres conseguir y tenlas siempre a mano."
      />
      <EmptyState
        icon={Heart}
        title="Tu lista está vacía"
        description="Cuando marques una carta como deseada aparecerá aquí."
      />
    </section>
  );
}
