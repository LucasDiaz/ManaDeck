import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import type { Card } from "../../types";
import { getCardImage } from "../../services";
import { formatCardPrice, rarityLabel } from "./cardHelpers";
import styles from "./CardCard.module.css";

interface CardCardProps {
  card: Card;
}

/** Grid tile: the authentic card image with price + rarity overlaid. */
export function CardCard({ card }: CardCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const image =
    getCardImage(card, "normal") ??
    getCardImage(card, "large") ??
    getCardImage(card, "small") ??
    getCardImage(card, "art_crop");
  const price = formatCardPrice(card);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <li className={styles.wrapper}>
      <Link
        to={`/carta/${card.id}`}
        className={styles.link}
        aria-label={`${card.name} — ${rarityLabel(card.rarity)}`}
      >
        <div className={styles.frame} data-rarity={card.rarity}>
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
      </Link>
    </li>
  );
}
