export interface BestiaryMeta {
  occurrence: "Common" | "Uncommon" | "Rare" | "Very Rare" | "Unknown";
  difficulty: string;
  thresholds: number[];
  imageUrl: string;
}

const BASE = "https://tibiadata.bytewizards.de/api/v1";
const TIMEOUT_MS = 7000;
const cache = new Map<string, BestiaryMeta>();

/** Thresholds do bestiary do Tibia por ocorrência. */
export function thresholdsForOccurrence(occurrence: string): number[] {
  switch ((occurrence || "").toLowerCase()) {
    case "common":
      return [500, 1000, 2500];
    case "uncommon":
      return [250, 500, 1000];
    case "rare":
      return [50, 100, 250];
    case "very rare":
      return [5, 10, 25];
    default:
      return [100, 500, 1000];
  }
}

/**
 * Busca metadados de bestiary e imagem da criatura via ByteWizards.
 * Cai para Fandom Special:FilePath se algo falhar.
 */
export async function fetchBestiaryMeta(creatureName: string): Promise<BestiaryMeta> {
  const key = creatureName.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const fallbackImage = `https://tibia.fandom.com/wiki/Special:FilePath/${encodeURIComponent(creatureName)}.gif`;
  const fallback: BestiaryMeta = {
    occurrence: "Unknown",
    difficulty: "unknown",
    thresholds: [100, 500, 1000],
    imageUrl: fallbackImage,
  };

  try {
    const res = await fetch(`${BASE}/creatures/${encodeURIComponent(creatureName)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      cache.set(key, fallback);
      return fallback;
    }

    const data = await res.json();
    const info = data?.structuredData?.infobox ?? {};
    const occurrence = (info.bestiaryOccurrence || "Unknown") as BestiaryMeta["occurrence"];
    const difficulty = String(info.bestiaryDifficulty || "unknown");
    const thresholds = thresholdsForOccurrence(occurrence);

    // Melhor palpite para imagem: Special:FilePath/Nome.gif
    // (o route já está aceitando espaços; sem underscores)
    const imageUrl = fallbackImage;

    const result: BestiaryMeta = { occurrence, difficulty, thresholds, imageUrl };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, fallback);
    return fallback;
  }
}

/** Progresso 0..100 em relação ao último tier do bestiary. */
export function getBestiaryProgress(kills: number, thresholds: number[]): number {
  const max = thresholds[thresholds.length - 1] || 1;
  return Math.max(0, Math.min(100, (kills / max) * 100));
}
