import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import type { Card } from "../../types";
import { getCardImage } from "../../services";
import { ManaCost } from "./ManaCost";
import { formatCardPrice, rarityLabel, cardSubline } from "./cardHelpers";
import styles from "./CardCard.module.css";

interface CardCardProps {
  card: Card;
}

/** Card tile: art, name, mana cost / type, rarity badge, price tag. */
export function CardCard({ card }: CardCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // Prefer the cropped art for the tile (no card frame / duplicate name),
  // fall back to the full card image, then the small thumbnail.
  const image =
    getCardImage(card, "art_crop") ??
    getCardImage(card, "normal") ??
    getCardImage(card, "small");
  const price = formatCardPrice(card);
  const { manaCost, typeLine } = cardSubline(card);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <li className={styles.wrapper}>
      <Link to={`/carta/${card.id}`} className={styles.link}>
        <div className={styles.art} data-rarity={card.rarity}>
          {showImage ? (
            <img
              src={image}
              alt={card.name}
              className={styles.image}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.fallback}>
              <ImageOff size={22} aria-hidden="true" />
              <span>{card.name}</span>
            </div>
          )}

          <span
            className={styles.rarity}
            data-rarity={card.rarity}
            title={rarityLabel(card.rarity)}
          >
            {rarityLabel(card.rarity)}
          </span>

          {price ? (
            <span className={styles.price}>
              {price.symbol}
              {price.amount}
            </span>
          ) : null}
        </div>

        <div className={styles.body}>
          <span className={styles.name}>{card.name}</span>
          <span className={styles.meta}>
            {manaCost ? (
              <ManaCost cost={manaCost} size={16} />
            ) : (
              <span className={styles.typeLine}>{typeLine}</span>
            )}
          </span>
        </div>
      </Link>
    </li>
  );
}
