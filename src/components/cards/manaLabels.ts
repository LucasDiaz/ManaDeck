const LABELS: Record<string, string> = {
  W: "Blanco",
  U: "Azul",
  B: "Negro",
  R: "Rojo",
  G: "Verde",
  C: "Incoloro",
  S: "Nieve",
  X: "X genérico",
  T: "Girar",
  Q: "Enderezar",
  E: "Energía",
};

/** Human label for a mana / cost symbol code, used as the SVG `alt`. */
export function manaSymbolLabel(symbol: string): string {
  const code = symbol.replace(/[{}]/g, "").toUpperCase();
  if (LABELS[code]) return LABELS[code];
  if (/^\d+$/.test(code)) return `${code} genérico`;
  if (code.includes("/")) return code.replace("/", " o ");
  return code;
}
