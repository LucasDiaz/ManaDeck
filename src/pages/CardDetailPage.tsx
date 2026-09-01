import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, RefreshCw, ExternalLink } from "lucide-react";
import type { Card, CardFace } from "../types";
import { getCardById, getCardImage, getCardPrints } from "../services";
import { useFetch, useHistory, useWishlist } from "../hooks";
import { Spinner, ErrorState } from "../components/common";
import { ManaCost, OracleText, SetIcon, rarityLabel } from "../components/cards";
import { WishlistModal } from "../components/wishlist";
import styles from "./CardDetailPage.module.css";

function faceStats(source: Card | CardFace): string | null {
  if (source.power != null && source.toughness != null) {
    return `${source.power}/${source.toughness}`;
  }
  if (source.loyalty != null) return `Lealtad ${source.loyalty}`;
  if (source.defense != null) return `Defensa ${source.defense}`;
  return null;
}

function priceLine(card: Card): { label: string; value: string }[] {
  const p = card.prices;
  if (!p) return [];
  const rows: { label: string; value: string }[] = [];
  if (p.usd) rows.push({ label: "Normal", value: `$${p.usd}` });
  if (p.usd_foil) rows.push({ label: "Foil", value: `$${p.usd_foil}` });
  if (p.eur) rows.push({ label: "EUR", value: `€${p.eur}` });
  return rows;
}

const LEGALITY_FORMATS: { key: string; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "pioneer", label: "Pioneer" },
  { key: "modern", label: "Modern" },
  { key: "legacy", label: "Legacy" },
  { key: "pauper", label: "Pauper" },
  { key: "commander", label: "Commander" },
];

export function CardDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logVisit } = useHistory();
  const { has } = useWishlist();

  const card = useFetch<Card>(
    (signal) => getCardById(id, { signal }),
    [id],
    { enabled: id.length > 0 },
  );

  const data = card.data;
  const [faceIndex, setFaceIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAllPrints, setShowAllPrints] = useState(false);

  // Reset the flipped face when navigating to a different card (render-phase
  // state adjustment — no effect needed).
  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setFaceIndex(0);
  }

  // RF4 — log the visit once the card resolves.
  useEffect(() => {
    if (data) logVisit(data);
  }, [data, logVisit]);

  const faces = data?.card_faces ?? [];
  const hasImageFaces = faces.filter((f) => f.image_uris).length >= 2;
  const activeFace: CardFace | undefined = faces[faceIndex];

  const image = useMemo(() => {
    if (!data) return undefined;
    if (hasImageFaces && activeFace?.image_uris) {
      return activeFace.image_uris.normal ?? activeFace.image_uris.large;
    }
    return (
      getCardImage(data, "normal") ??
      getCardImage(data, "large") ??
      getCardImage(data, "small")
    );
  }, [data, hasImageFaces, activeFace]);

  const prints = useFetch<Card[]>(
    (signal) =>
      data?.oracle_id
        ? getCardPrints(data.oracle_id, { signal })
        : Promise.resolve([]),
    [data?.oracle_id],
    { enabled: Boolean(data?.oracle_id) },
  );

  const PRINTS_PREVIEW = 15;
  const allPrints = prints.data ?? [];
  const visiblePrints = showAllPrints
    ? allPrints
    : allPrints.slice(0, PRINTS_PREVIEW);

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver
        </button>
      </div>

      {card.isLoading ? <Spinner label="Cargando carta…" showLabel /> : null}

      {card.isError ? (
        <ErrorState
          title="No se pudo cargar la carta"
          error={card.error}
          onRetry={card.refetch}
        />
      ) : null}

      {data ? (
        <>
          <article className={styles.showcase}>
            <div className={styles.artWrap}>
              {image ? (
                <img
                  src={image}
                  alt={data.name}
                  className={styles.art}
                  decoding="async"
                />
              ) : (
                <div className={styles.artFallback}>{data.name}</div>
              )}
              {hasImageFaces ? (
                <button
                  type="button"
                  className={styles.flip}
                  onClick={() =>
                    setFaceIndex((i) => (i + 1) % faces.length)
                  }
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Girar carta
                </button>
              ) : null}
            </div>

            <div className={styles.headline}>
              <div className={styles.titleRow}>
                <h1 className={styles.name}>{data.name}</h1>
                {data.mana_cost ? (
                  <ManaCost cost={data.mana_cost} size={20} />
                ) : null}
              </div>
              <p className={styles.typeLine}>
                {data.type_line || activeFace?.type_line}
              </p>
              <div className={styles.badges}>
                <span className={styles.rarity} data-rarity={data.rarity}>
                  {rarityLabel(data.rarity)}
                </span>
                <span className={styles.set}>
                  {data.set_name} · #{data.collector_number}
                </span>
                {faceStats(data) ? (
                  <span className={styles.stats}>{faceStats(data)}</span>
                ) : null}
              </div>

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={
                    has(data.id)
                      ? `${styles.wishBtn} ${styles.wishBtnActive}`
                      : styles.wishBtn
                  }
                  onClick={() => setModalOpen(true)}
                >
                  {has(data.id) ? (
                    <Heart size={16} aria-hidden="true" fill="currentColor" />
                  ) : (
                    <Heart size={16} aria-hidden="true" />
                  )}
                  {has(data.id) ? "En tu lista" : "Añadir a deseos"}
                </button>
                {data.scryfall_uri ? (
                  <a
                    className={styles.scryfallLink}
                    href={data.scryfall_uri}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Scryfall
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </article>

          {/* Oracle text — per face for multi-faced cards */}
          <section className={styles.section}>
            {faces.length > 0 ? (
              faces.map((face, i) => (
                <div key={i} className={styles.faceBlock}>
                  <div className={styles.faceHead}>
                    <h2 className={styles.faceName}>{face.name}</h2>
                    <div className={styles.faceMeta}>
                      {face.mana_cost ? (
                        <ManaCost cost={face.mana_cost} size={16} />
                      ) : null}
                      {faceStats(face) ? (
                        <span className={styles.stats}>{faceStats(face)}</span>
                      ) : null}
                    </div>
                  </div>
                  {face.type_line ? (
                    <p className={styles.faceType}>{face.type_line}</p>
                  ) : null}
                  <OracleText text={face.oracle_text} flavor={face.flavor_text} />
                </div>
              ))
            ) : (
              <OracleText
                text={data.oracle_text}
                flavor={data.flavor_text}
              />
            )}
          </section>

          {/* Prices + legalities */}
          <section className={styles.metaGrid}>
            {priceLine(data).length > 0 ? (
              <div className={styles.metaCard}>
                <h3 className={styles.metaTitle}>Precio de mercado</h3>
                <ul className={styles.priceList} role="list">
                  {priceLine(data).map((row) => (
                    <li key={row.label} className={styles.priceRow}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={styles.metaCard}>
              <h3 className={styles.metaTitle}>Legalidad</h3>
              <ul className={styles.legalList} role="list">
                {LEGALITY_FORMATS.map(({ key, label }) => {
                  const status = data.legalities[key] ?? "not_legal";
                  return (
                    <li key={key} className={styles.legalRow}>
                      <span>{label}</span>
                      <span
                        className={styles.legalTag}
                        data-status={status}
                      >
                        {status === "legal"
                          ? "Legal"
                          : status === "banned"
                            ? "Prohibida"
                            : status === "restricted"
                              ? "Restringida"
                              : "No legal"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {data.artist ? (
            <p className={styles.artist}>Ilustración: {data.artist}</p>
          ) : null}

          {/* Versiones / prints */}
          <section className={styles.section} aria-labelledby="prints-title">
            <h2 id="prints-title" className={styles.sectionTitle}>
              Versiones
            </h2>

            {prints.isLoading ? (
              <Spinner label="Buscando otras ediciones…" showLabel />
            ) : null}

            {prints.isError ? (
              <ErrorState
                title="No se pudieron cargar las versiones"
                error={prints.error}
                onRetry={prints.refetch}
              />
            ) : null}

            {allPrints.length > 0 ? (
              <ul className={styles.printList} role="list">
                {visiblePrints.map((print) => (
                  <li key={print.id}>
                    <Link
                      to={`/carta/${print.id}`}
                      className={
                        print.id === data.id
                          ? `${styles.printRow} ${styles.printCurrent}`
                          : styles.printRow
                      }
                    >
                      <SetIcon
                        setCode={print.set}
                        size={22}
                        className={styles.setIcon}
                      />
                      <span className={styles.printInfo}>
                        <span className={styles.printSet}>{print.set_name}</span>
                        <span className={styles.printNo}>
                          #{print.collector_number}
                          {print.id === data.id ? " · actual" : ""}
                        </span>
                      </span>
                      <span className={styles.printPrices}>
                        {print.prices?.usd ? <span>${print.prices.usd}</span> : null}
                        {print.prices?.usd_foil ? (
                          <span className={styles.foil}>
                            ${print.prices.usd_foil} foil
                          </span>
                        ) : null}
                        {!print.prices?.usd && !print.prices?.usd_foil ? (
                          <span className={styles.noPrice}>—</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {allPrints.length > PRINTS_PREVIEW ? (
              <button
                type="button"
                className={styles.morePrints}
                onClick={() => setShowAllPrints((v) => !v)}
              >
                {showAllPrints
                  ? "Ver menos"
                  : `Ver todas las ediciones (${allPrints.length})`}
              </button>
            ) : null}

            {allPrints.length === 0 && !prints.isLoading && !prints.isError ? (
              <p className={styles.emptyPrints}>Sin otras ediciones registradas.</p>
            ) : null}
          </section>
        </>
      ) : null}

      {data ? (
        <WishlistModal
          card={data}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
