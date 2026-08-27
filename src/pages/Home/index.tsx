import { Link } from "react-router-dom";
import { Search, BookOpen, Layers, RefreshCw } from "lucide-react";
import { getRandomCards } from "../../services";
import { useFetch } from "../../hooks";
import { ErrorState } from "../../components/common";
import { CardGrid, CardCard, CardCardSkeleton } from "../../components/cards";
import styles from "./Home.module.css";

const FEATURED_COUNT = 6;
const MTG_RULES_URL = "https://magic.wizards.com/en/rules";

export function HomePage() {
  const featured = useFetch(
    (signal) => getRandomCards(FEATURED_COUNT, { signal }),
    [],
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <span className={styles.kicker}>Magic: The Gathering</span>
          <h1 id="hero-title" className={styles.heroTitle}>
            Invoca tu próxima <em>carta</em>
          </h1>
          <p className={styles.heroText}>
            Explora la base de datos completa de Scryfall, arma tu lista de
            deseos y consulta precios y legalidades al instante.
          </p>

          <nav className={styles.actions} aria-label="Accesos rápidos">
            <Link
              to="/buscar"
              className={`${styles.action} ${styles.actionPrimary}`}
            >
              <Search size={16} aria-hidden="true" />
              Buscar cartas
            </Link>
            <a
              className={styles.action}
              href={MTG_RULES_URL}
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={16} aria-hidden="true" />
              Ver reglas
            </a>
            <span
              className={`${styles.action} ${styles.actionDisabled}`}
              aria-disabled="true"
              title="Próximamente"
            >
              <Layers size={16} aria-hidden="true" />
              Crear mazo
            </span>
          </nav>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.sectionHead}>
          <h2 id="featured-title" className={styles.sectionTitle}>
            Cartas destacadas
          </h2>
          {featured.isSuccess ? (
            <button
              type="button"
              className={styles.refresh}
              onClick={featured.refetch}
              data-spinning={featured.isLoading}
            >
              <RefreshCw size={13} aria-hidden="true" />
              Barajar
            </button>
          ) : (
            <span className={styles.sectionHint}>Selección aleatoria</span>
          )}
        </div>

        {featured.isError ? (
          <ErrorState
            title="No se pudieron cargar las cartas"
            error={featured.error}
            onRetry={featured.refetch}
          />
        ) : (
          <CardGrid aria-label="Cartas destacadas">
            {featured.isLoading || !featured.data
              ? Array.from({ length: FEATURED_COUNT }, (_, i) => (
                  <CardCardSkeleton key={i} />
                ))
              : featured.data.map((card) => (
                  <CardCard key={card.id} card={card} />
                ))}
          </CardGrid>
        )}
      </section>
    </div>
  );
}
