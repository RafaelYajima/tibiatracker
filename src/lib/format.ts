/**
 * Formatação de valores em gold (GP) no padrão do Tibia:
 *  >= 1.000.000  -> "1.50kk"
 *  >= 1.000      -> "250.0k"
 *  senão         -> "950 gp"
 */
export function formatGP(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}kk`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${abs} gp`;
}

/** 1234567 -> "1.234.567" (pt-BR) — usado em tooltips e detalhes. */
export function formatFull(value: number): string {
  return value.toLocaleString("pt-BR");
}

/** Versão compacta com sinal explícito: +1.50kk / -250.0k */
export function formatSignedGP(value: number): string {
  if (value > 0) return `+${formatGP(value)}`;
  return formatGP(value);
}
