import { type FormEvent, useCallback, useMemo, useState } from "react";
import { Search as SearchIcon, X, SlidersHorizontal } from "lucide-react";
import type { Card, CardFilters, CardType, FormatFilter, RarityFilter } from "../../types";
import { searchCards } from "../../services";
import { useAsync } from "../../hooks";
import { PageHeader, EmptyState, ErrorState, Spinner } from "../../components/common";
import {
  CardGrid,
  CardCard,
  CardCardSkeleton,
  ManaSymbol,
  type ManaSymbolCode,
} from "../../components/cards";
import {
  COLOR_OPTIONS,
  TYPE_OPTIONS,
  FORMAT_OPTIONS,
  RARITY_OPTIONS,
} from "./searchOptions";
import styles from "./Search.module.css";

const SKELETON_COUNT = 12;
/** How many cards to reveal per "Cargar más" click. */
const DISPLAY_STEP = 24;

function hasCriteria(f: CardFilters): boolean {
  return Boolean(f.q || f.colors?.length || f.type || f.format || f.rarity);
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [colors, setColors] = useState<ReadonlySet<ManaSymbolCode>>(new Set());
  const [type, setType] = useState<CardType | null>(null);
  const [format, setFormat] = useState<FormatFilter | null>(null);
  const [rarity, setRarity] = useState<RarityFilter | null>(null);

  const [committed, setCommitted] = useState<CardFilters | null>(null);
  const [page, setPage] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [apiHasMore, setApiHasMore] = useState(false);
  const [visible, setVisible] = useState(DISPLAY_STEP);

  const search = useAsync(searchCards);

  const buildFilters = useCallback(
    (overrides: Partial<{
      query: string;
      colors: ReadonlySet<ManaSymbolCode>;
      type: CardType | null;
      format: FormatFilter | null;
      rarity: RarityFilter | null;
    }> = {}): CardFilters => {
      const c = overrides.colors ?? colors;
      const q = (overrides.query ?? query).trim();
      return {
        q: q || undefined,
        colors: c.size ? [...c] : undefined,
        type: (overrides.type !== undefined ? overrides.type : type) ?? undefined,
        format:
          (overrides.format !== undefined ? overrides.format : format) ??
          undefined,
        rarity:
          (overrides.rarity !== undefined ? overrides.rarity : rarity) ??
          undefined,
      };
    },
    [colors, query, type, format, rarity],
  );

  const runSearch = useCallback(
    async (filters: CardFilters, nextPage: number) => {
      if (!hasCriteria(filters)) return;
      setCommitted(filters);
      setPage(nextPage);

      if (nextPage === 1) setVisible(DISPLAY_STEP);

      const result = await search.run(filters, nextPage);
      if (!result) return; // error — surfaced via search.error

      setTotalCards(result.total_cards ?? result.data.length);
      setApiHasMore(result.has_more);
      setCards((prev) => {
        if (nextPage === 1) return result.data;
        const seen = new Set(prev.map((card) => card.id));
        return [...prev, ...result.data.filter((card) => !seen.has(card.id))];
      });
    },
    [search],
  );

  const liveFilters = buildFilters();
  const canSearch = hasCriteria(liveFilters);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSearch) void runSearch(liveFilters, 1);
  };

  /** Toggle a chip and, if a search is already active, re-run immediately. */
  const toggleColor = (symbol: string) => {
    const color = symbol as ManaSymbolCode;
    const next = new Set(colors);
    if (next.has(color)) next.delete(color);
    else next.add(color);
    setColors(next);
    if (committed) void runSearch(buildFilters({ colors: next }), 1);
  };

  const pickType = (value: CardType) => {
    const next = type === value ? null : value;
    setType(next);
    if (committed) void runSearch(buildFilters({ type: next }), 1);
  };

  const pickFormat = (value: FormatFilter) => {
    const next = format === value ? null : value;
    setFormat(next);
    if (committed) void runSearch(buildFilters({ format: next }), 1);
  };

  const pickRarity = (value: RarityFilter) => {
    const next = rarity === value ? null : value;
    setRarity(next);
    if (committed) void runSearch(buildFilters({ rarity: next }), 1);
  };

  const clearAll = () => {
    setQuery("");
    setColors(new Set());
    setType(null);
    setFormat(null);
    setRarity(null);
    setCommitted(null);
    setCards([]);
    setTotalCards(0);
    setApiHasMore(false);
    setVisible(DISPLAY_STEP);
    search.reset();
  };

  const activeCount = useMemo(
    () =>
      (liveFilters.q ? 1 : 0) +
      (liveFilters.colors?.length ?? 0) +
      (liveFilters.type ? 1 : 0) +
      (liveFilters.format ? 1 : 0) +
      (liveFilters.rarity ? 1 : 0),
    [liveFilters],
  );

  const initialLoading = search.isLoading && page === 1;
  const loadingMore = search.isLoading && page > 1;
  const showEmptyResults =
    committed !== null &&
    !search.isLoading &&
    !search.isError &&
    cards.length === 0;

  const shownCards = cards.slice(0, visible);
  const canLoadMore = visible < cards.length || apiHasMore;

  const loadMore = () => {
    setVisible((v) => v + DISPLAY_STEP);
    // Fetch the next Scryfall page when the local buffer is about to run out.
    if (
      committed &&
      apiHasMore &&
      !search.isLoading &&
      visible + DISPLAY_STEP > cards.length
    ) {
      void runSearch(committed, page + 1);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Buscar"
        subtitle="Filtra por texto, color, tipo, formato y rareza."
      />

      <form className={styles.filters} onSubmit={handleSubmit} role="search">
        <div className={styles.searchRow}>
          <div className={styles.inputWrap}>
            <SearchIcon size={17} aria-hidden="true" className={styles.inputIcon} />
            <input
              type="search"
              className={styles.input}
              placeholder="Nombre de la carta…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Texto de búsqueda"
              enterKeyHint="search"
            />
            {query ? (
              <button
                type="button"
                className={styles.inputClear}
                onClick={() => setQuery("")}
                aria-label="Borrar texto"
              >
                <X size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className={styles.submit}
            disabled={!canSearch || initialLoading}
          >
            Buscar
          </button>
        </div>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Colores de maná</legend>
          <div className={styles.colorRow}>
            {COLOR_OPTIONS.map((color) => (
              <ManaSymbol
                key={color}
                symbol={color}
                size={34}
                selected={colors.has(color)}
                onToggle={toggleColor}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Tipo de carta</legend>
          <div className={styles.pillRow}>
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={styles.pill}
                data-active={type === opt.value}
                aria-pressed={type === opt.value}
                onClick={() => pickType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Formato</legend>
          <div className={styles.pillRow}>
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={styles.pill}
                data-active={format === opt.value}
                aria-pressed={format === opt.value}
                onClick={() => pickFormat(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Rareza</legend>
          <div className={styles.pillRow}>
            {RARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={styles.pill}
                data-active={rarity === opt.value}
                aria-pressed={rarity === opt.value}
                onClick={() => pickRarity(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {activeCount > 0 ? (
          <div className={styles.filterFoot}>
            <span className={styles.filterCount}>
              <SlidersHorizontal size={13} aria-hidden="true" />
              {activeCount} {activeCount === 1 ? "filtro activo" : "filtros activos"}
            </span>
            <button type="button" className={styles.clear} onClick={clearAll}>
              Limpiar
            </button>
          </div>
        ) : null}
      </form>

      <section className={styles.results} aria-live="polite">
        {committed === null && !initialLoading ? (
          <EmptyState
            icon={SearchIcon}
            title="Empieza tu búsqueda"
            description="Escribe un nombre o elige algún filtro para ver cartas."
          />
        ) : null}

        {initialLoading ? (
          <>
            <p className={styles.count}>Buscando cartas…</p>
            <CardGrid aria-label="Cargando resultados">
              {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <CardCardSkeleton key={i} />
              ))}
            </CardGrid>
          </>
        ) : null}

        {search.isError ? (
          <ErrorState
            title="La búsqueda falló"
            error={search.error}
            onRetry={() => committed && runSearch(committed, 1)}
          />
        ) : null}

        {showEmptyResults ? (
          <EmptyState
            icon={SearchIcon}
            title="Sin resultados"
            description="Ninguna carta coincide con esos filtros. Prueba a quitar alguno."
          />
        ) : null}

        {!initialLoading && !search.isError && cards.length > 0 ? (
          <>
            <p className={styles.count}>
              Mostrando <strong>{shownCards.length}</strong> de{" "}
              <strong>{totalCards.toLocaleString("es")}</strong> cartas
            </p>
            <CardGrid aria-label="Resultados de la búsqueda">
              {shownCards.map((card) => (
                <CardCard key={card.id} card={card} />
              ))}
            </CardGrid>

            {canLoadMore ? (
              <div className={styles.loadMoreWrap}>
                {loadingMore ? (
                  <Spinner label="Cargando más cartas…" showLabel />
                ) : (
                  <button
                    type="button"
                    className={styles.loadMore}
                    onClick={loadMore}
                  >
                    Cargar más
                  </button>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
