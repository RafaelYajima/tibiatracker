/**
 * Dados oficiais do Bestiary do Tibia.
 * Fonte: https://tibia.fandom.com/wiki/Bestiary/Difficulties
 *
 * Cada criatura tem:
 * - dificuldade (difficulty): harmless | trivial | easy | medium | hard | challenging
 * - ocorrência (occurrence): ordinary (comum) | very rare
 *
 * Os 3 estágios do Bestiary variam conforme a combinação:
 *
 * +─────────────┬───────────────┬──────────┬──────────┬────────────┬──────────────┐
 * │ Dificuldade │  Ocorrência   │ Stage 1  │ Stage 2  │  Stage 3   │ Charm Points │
 * ├─────────────┼───────────────┼──────────┼──────────┼────────────┼──────────────┤
 * │ Harmless    │ Ordinary      │     5    │    10    │     25     │      1       │
 * │ Harmless    │ Very Rare     │     2    │     3    │      5     │      5       │
 * │ Trivial     │ Ordinary      │    10    │   100    │    250     │      5       │
 * │ Trivial     │ Very Rare     │     2    │     3    │      5     │     10       │
 * │ Easy        │ Ordinary      │    25    │   250    │    500     │     15       │
 * │ Easy        │ Very Rare     │     2    │     3    │      5     │     30       │
 * │ Medium      │ Ordinary      │    50    │   500    │   1.000    │     25       │
 * │ Medium      │ Very Rare     │     2    │     3    │      5     │     50       │
 * │ Hard        │ Ordinary      │   100    │  1.000   │   2.500    │     50       │
 * │ Hard        │ Very Rare     │     2    │     3    │      5     │    100       │
 * │ Challenging │ Ordinary      │   200    │  2.000   │   5.000    │    100       │
 * │ Challenging │ Very Rare     │     2    │     3    │      5     │    200       │
 * └─────────────┴───────────────┴──────────┴──────────┴────────────┴──────────────┘
 */

export type BestiaryDifficulty =
  | "harmless"
  | "trivial"
  | "easy"
  | "medium"
  | "hard"
  | "challenging"
  | "unknown";

export type BestiaryOccurrence = "ordinary" | "very rare" | "unknown";

export interface BestiaryStages {
  stage1: number;
  stage2: number;
  stage3: number;
  charmPoints: number;
}

export interface BestiaryMeta {
  difficulty: BestiaryDifficulty;
  occurrence: BestiaryOccurrence;
  stages: BestiaryStages;
  imageUrl: string;
  /** assetId para montar a URL correta via ByteWizards. */
  assetId: number | null;
}

/** Retorna os stages corretos baseado em dificuldade + ocorrência. */
export function getStages(difficulty: string, occurrence: string): BestiaryStages {
  const diff = difficulty.toLowerCase() as BestiaryDifficulty;
  const isVeryRare = occurrence.toLowerCase().includes("very rare");

  if (isVeryRare) {
    const charmMap: Record<string, number> = {
      harmless: 5, trivial: 10, easy: 30, medium: 50, hard: 100, challenging: 200,
    };
    return { stage1: 2, stage2: 3, stage3: 5, charmPoints: charmMap[diff] ?? 25 };
  }

  switch (diff) {
    case "harmless":    return { stage1: 5,   stage2: 10,   stage3: 25,   charmPoints: 1   };
    case "trivial":     return { stage1: 10,  stage2: 100,  stage3: 250,  charmPoints: 5   };
    case "easy":        return { stage1: 25,  stage2: 250,  stage3: 500,  charmPoints: 15  };
    case "medium":      return { stage1: 50,  stage2: 500,  stage3: 1000, charmPoints: 25  };
    case "hard":        return { stage1: 100, stage2: 1000, stage3: 2500, charmPoints: 50  };
    case "challenging": return { stage1: 200, stage2: 2000, stage3: 5000, charmPoints: 100 };
    default:            return { stage1: 50,  stage2: 500,  stage3: 1000, charmPoints: 25  };
  }
}

/** Retorna qual estágio o usuário está (0 = nenhum, 1, 2 ou 3 = completo). */
export function getCurrentStage(kills: number, stages: BestiaryStages): 0 | 1 | 2 | 3 {
  if (kills >= stages.stage3) return 3;
  if (kills >= stages.stage2) return 2;
  if (kills >= stages.stage1) return 1;
  return 0;
}

/** Progresso de 0 a 100 para o estágio atual. */
export function getStageProgress(kills: number, stages: BestiaryStages): {
  percent: number;
  currentStage: 0 | 1 | 2 | 3;
  killsNeeded: number;
  nextTarget: number;
} {
  const currentStage = getCurrentStage(kills, stages);
  if (currentStage === 3) {
    return { percent: 100, currentStage: 3, killsNeeded: 0, nextTarget: stages.stage3 };
  }

  const from = currentStage === 0 ? 0 : currentStage === 1 ? stages.stage1 : stages.stage2;
  const to   = currentStage === 0 ? stages.stage1 : currentStage === 1 ? stages.stage2 : stages.stage3;
  const killsInStage = kills - from;
  const rangeSize = to - from;
  const percent = Math.min(100, Math.max(0, (killsInStage / rangeSize) * 100));
  const killsNeeded = to - kills;

  return { percent, currentStage, killsNeeded: Math.max(0, killsNeeded), nextTarget: to };
}

const BASE_IMG = "https://tibiadata.bytewizards.de/api/v1/assets";
const cache = new Map<string, BestiaryMeta>();
const TIMEOUT_MS = 7000;

/** Busca metadados reais de uma criatura via ByteWizards API. */
export async function fetchBestiaryMeta(creatureName: string): Promise<BestiaryMeta> {
  const key = creatureName.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const fallback: BestiaryMeta = {
    difficulty: "unknown",
    occurrence: "unknown",
    stages: getStages("medium", "ordinary"),
    imageUrl: `https://tibia.fandom.com/wiki/Special:FilePath/${encodeURIComponent(creatureName)}.gif`,
    assetId: null,
  };

  try {
    const res = await fetch(
      `https://tibiadata.bytewizards.de/api/v1/creatures/${encodeURIComponent(creatureName)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 86400 } },
    );
    if (!res.ok) { cache.set(key, fallback); return fallback; }

    const data = await res.json();
    const info = data?.structuredData?.infobox ?? {};
    const imgs: { assetId: number }[] = data?.images ?? [];

    const difficulty = (info.bestiaryDifficulty || "unknown").toLowerCase() as BestiaryDifficulty;
    const occurrence = (info.bestiaryOccurrence || "ordinary").toLowerCase() === "very rare"
      ? "very rare"
      : "ordinary";
    const stages = getStages(difficulty, occurrence);

    const assetId = imgs.length > 0 ? imgs[0].assetId : null;
    const imageUrl = assetId ? `${BASE_IMG}/${assetId}` : fallback.imageUrl;

    const result: BestiaryMeta = { difficulty, occurrence, stages, imageUrl, assetId };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, fallback);
    return fallback;
  }
}
