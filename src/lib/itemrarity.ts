/**
 * Sistema de raridade E valor de mercado usando a ByteWizards Tibia API.
 * https://tibiadata.bytewizards.de
 *
 * Raridades (drop chance, do wiki oficial do Tibia):
 *   always    = 100%
 *   common    = 25%–100%
 *   uncommon  = 5%–25%
 *   semi-rare = 1%–5%
 *   rare      = 0.5%–1%
 *   very rare = <0.5%
 *
 * Tier de valor de mercado (inspirado nas cores do market do Tibia):
 *   trash   = < 100 gp          → cinza
 *   low     = 100 – 9.999 gp    → verde
 *   medium  = 10k – 99.999 gp   → azul
 *   high    = 100k – 999.999 gp → roxo
 *   godlike = ≥ 1kk gp          → dourado
 */

export type ItemRarity =
  | "always"
  | "common"
  | "uncommon"
  | "semi-rare"
  | "rare"
  | "very rare"
  | "unknown";

export type ValueTier = "trash" | "low" | "medium" | "high" | "godlike" | "unknown";

export interface ItemWithRarity {
  name: string;
  qty: number;
  rarity: ItemRarity;
  chance: string | null;
  marketValueMax: number;
  valueTier: ValueTier;
  marketable: boolean;
}

export interface CreatureLootEntry {
  itemName: string;
  rarity: ItemRarity;
  chance: string | null;
}

const BASE = "https://tibiadata.bytewizards.de/api/v1";
const TIMEOUT_MS = 8_000;

const creatureCache = new Map<string, CreatureLootEntry[]>();
const itemValueCache = new Map<string, { marketValueMax: number; valueTier: ValueTier; marketable: boolean }>();

/** Calcula o tier de valor a partir do preço máximo estimado (gp). */
export function getValueTier(maxGp: number): ValueTier {
  if (maxGp <= 0) return "unknown";
  if (maxGp < 1_000) return "trash";
  if (maxGp < 10_000) return "low";
  if (maxGp < 100_000) return "medium";
  if (maxGp < 1_000_000) return "high";
  return "godlike";
}

/**
 * Parseia strings tipo "25,000 - 50,000" ou "90,000 - 150,000" e retorna o valor máximo.
 * Trata vírgulas como separadores de milhar (padrão US do TibiaWiki).
 */
function parseValueRange(raw: string | null | undefined, npcValue: number): number {
  if (!raw) return npcValue;
  // Remove separadores de milhar: "25,000" → "25000"
  const withoutThousands = raw.replace(/(\d)[,.](\d{3})/g, "$1$2");
  // Extrai todos os números inteiros positivos
  const nums = [...withoutThousands.matchAll(/\d+/g)]
    .map((m) => parseInt(m[0], 10))
    .filter((n) => n > 0);
  if (nums.length === 0) return npcValue;
  return Math.max(...nums, npcValue);
}

function creatureSlug(name: string): string {
  return encodeURIComponent(
    name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
  );
}

async function fetchCreatureLoot(creatureName: string): Promise<CreatureLootEntry[]> {
  const key = creatureName.toLowerCase();
  if (creatureCache.has(key)) return creatureCache.get(key)!;

  try {
    const res = await fetch(`${BASE}/creatures/${creatureSlug(creatureName)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) { creatureCache.set(key, []); return []; }

    const data = await res.json();
    const lootList: CreatureLootEntry[] = (data.lootStatistics ?? []).map(
      (e: { itemName: string; rarity: string; chance: string | null }) => ({
        itemName: e.itemName,
        rarity: (e.rarity ?? "unknown") as ItemRarity,
        chance: e.chance ?? null,
      })
    );
    creatureCache.set(key, lootList);
    return lootList;
  } catch {
    creatureCache.set(key, []);
    return [];
  }
}

async function fetchItemValue(itemName: string) {
  const key = itemName.toLowerCase();
  if (itemValueCache.has(key)) return itemValueCache.get(key)!;

  const fallback = { marketValueMax: 0, valueTier: "unknown" as ValueTier, marketable: false };
  try {
    const url = `${BASE}/items/${encodeURIComponent(itemName)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) { itemValueCache.set(key, fallback); return fallback; }

    const data = await res.json();
    const npcValue = typeof data.npcValue === "number" ? data.npcValue : 0;
    const marketable = data.marketable === "yes" || data.marketable === true;
    const marketValueMax = parseValueRange(data.value, npcValue);
    const valueTier = getValueTier(marketValueMax);

    const result = { marketValueMax, valueTier, marketable };
    itemValueCache.set(key, result);
    return result;
  } catch {
    itemValueCache.set(key, fallback);
    return fallback;
  }
}

const RARITY_ORDER: ItemRarity[] = [
  "very rare", "rare", "semi-rare", "uncommon", "common", "always", "unknown",
];

async function resolveItemRarity(
  itemName: string,
  creatureNames: string[]
): Promise<{ rarity: ItemRarity; chance: string | null }> {
  const normalizedItem = itemName.toLowerCase();
  let bestRarity: ItemRarity = "unknown";
  let bestChance: string | null = null;

  for (const creature of creatureNames) {
    const loot = await fetchCreatureLoot(creature);
    const match = loot.find((l) => l.itemName.toLowerCase() === normalizedItem);
    if (match) {
      const currentIdx = RARITY_ORDER.indexOf(bestRarity);
      const matchIdx = RARITY_ORDER.indexOf(match.rarity);
      if (matchIdx < currentIdx) {
        bestRarity = match.rarity;
        bestChance = match.chance;
      }
    }
  }
  return { rarity: bestRarity, chance: bestChance };
}

/**
 * Enriquece itens com raridade (drop chance) + valor de mercado.
 * As duas lookups rodam em paralelo por item.
 */
export async function enrichItemsWithRarity(
  items: Array<{ name: string; qty: number }>,
  killedCreatures: string[]
): Promise<ItemWithRarity[]> {
  const results = await Promise.all(
    items.map(async (item) => {
      const [rarityData, valueData] = await Promise.all([
        killedCreatures.length > 0
          ? resolveItemRarity(item.name, killedCreatures)
          : Promise.resolve({ rarity: "unknown" as ItemRarity, chance: null }),
        fetchItemValue(item.name),
      ]);

      return {
        ...item,
        rarity: rarityData.rarity,
        chance: rarityData.chance,
        marketValueMax: valueData.marketValueMax,
        valueTier: valueData.valueTier,
        marketable: valueData.marketable,
      };
    })
  );
  return results;
}

/* ------------------------------------------------------------------ */
/* Metadados visuais                                                    */
/* ------------------------------------------------------------------ */

export const RARITY_META: Record<
  ItemRarity,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  always:      { label: "Sempre",     color: "#e2e2e8", bg: "rgba(226,226,232,0.08)", border: "rgba(226,226,232,0.2)",   glow: "none" },
  common:      { label: "Comum",      color: "#8888a0", bg: "rgba(136,136,160,0.08)", border: "rgba(136,136,160,0.2)",   glow: "none" },
  uncommon:    { label: "Incomum",    color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",    glow: "none" },
  "semi-rare": { label: "Semi-raro",  color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)",    glow: "none" },
  rare:        { label: "Raro",       color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.25)",  glow: "0 0 12px rgba(192,132,252,0.35)" },
  "very rare": { label: "Muito Raro", color: "#f0d078", bg: "rgba(240,208,120,0.10)", border: "rgba(212,168,67,0.35)",   glow: "0 0 16px rgba(212,168,67,0.55)" },
  unknown:     { label: "?",          color: "#8888a0", bg: "rgba(136,136,160,0.06)", border: "rgba(136,136,160,0.15)",  glow: "none" },
};

export const VALUE_TIER_META: Record<
  ValueTier,
  { label: string; short: string; color: string; bg: string; border: string; glow: string }
> = {
  trash:   { label: "Sem valor",      short: "Lixo",    color: "#8888a0", bg: "rgba(136,136,160,0.07)", border: "rgba(136,136,160,0.15)", glow: "none" },
  low:     { label: "Baixo valor",    short: "Baixo",   color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",   glow: "none" },
  medium:  { label: "Médio valor",    short: "Médio",   color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)",   glow: "none" },
  high:    { label: "Alto valor",     short: "Alto",    color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.25)", glow: "0 0 12px rgba(192,132,252,0.3)" },
  godlike: { label: "Muito valioso",  short: "Premium", color: "#f0d078", bg: "rgba(240,208,120,0.12)", border: "rgba(212,168,67,0.45)",  glow: "0 0 20px rgba(212,168,67,0.6)" },
  unknown: { label: "Valor ?",        short: "?",       color: "#8888a0", bg: "rgba(136,136,160,0.05)", border: "rgba(136,136,160,0.12)", glow: "none" },
};
