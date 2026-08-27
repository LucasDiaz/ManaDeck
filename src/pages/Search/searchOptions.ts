import type { CardType, FormatFilter, RarityFilter } from "../../types";
import type { ManaSymbolCode } from "../../components/cards";

export const COLOR_OPTIONS: readonly ManaSymbolCode[] = [
  "W",
  "U",
  "B",
  "R",
  "G",
  "C",
];

export const TYPE_OPTIONS: readonly { value: CardType; label: string }[] = [
  { value: "creature", label: "Criatura" },
  { value: "instant", label: "Instantáneo" },
  { value: "sorcery", label: "Conjuro" },
  { value: "artifact", label: "Artefacto" },
  { value: "enchantment", label: "Encantamiento" },
  { value: "planeswalker", label: "Planeswalker" },
  { value: "land", label: "Tierra" },
];

export const FORMAT_OPTIONS: readonly { value: FormatFilter; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "commander", label: "Commander" },
  { value: "modern", label: "Modern" },
  { value: "legacy", label: "Legacy" },
  { value: "pauper", label: "Pauper" },
];

export const RARITY_OPTIONS: readonly { value: RarityFilter; label: string }[] = [
  { value: "common", label: "Común" },
  { value: "uncommon", label: "Infrecuente" },
  { value: "rare", label: "Rara" },
  { value: "mythic", label: "Mítica" },
];
