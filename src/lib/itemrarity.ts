/**
 * Sistema de raridade de itens usando a ByteWizards Tibia API.
 * https://tibiadata.bytewizards.de
 *
 * Raridades do Tibia (do wiki):
 *   always    = 100% (quest/event)
 *   common    = 25%–100%
 *   uncommon  = 5%–25%
 *   semi-rare = 1%–5%
 *   rare      = 0.5%–1%
 *   very rare = <0.5%
 */

export type ItemRarity =
  | "always"
  | "common"
  | "uncommon"
  | "semi-rare"
  | "rare"
  | "very rare"
  | "unknown";

export interface ItemWithRarity {
  name: string;
  qty: number;
  rarity: ItemRarity;
  chance: string | null;
}

export interface CreatureLootEntry {
  itemName: string;
  rarity: ItemRarity;
  chance: string | null;
}

const BASE = "https://tibiadata.bytewizards.de/api/v1";
const TIMEOUT_MS = 8_000;

/** Cache em memória (por processo) para não repetir chamadas. */
const creatureCache = new Map<string, CreatureLootEntry[]>();

/** Normaliza o nome da criatura para slug (espaços → %20). */
function creatureSlug(name: string): string {
  return encodeURIComponent(
    name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
  );
}

/**
 * Busca a lista de loot de uma criatura na API.
 * Retorna array vazio se a criatura não for encontrada.
 */
async function fetchCreatureLoot(creatureName: string): Promise<CreatureLootEntry[]> {
  const key = creatureName.toLowerCase();

  if (creatureCache.has(key)) {
    return creatureCache.get(key)!;
  }

  try {
    const url = `${BASE}/creatures/${creatureSlug(creatureName)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 }, // cache 24h no Next.js
    });

    if (!res.ok) {
      creatureCache.set(key, []);
      return [];
    }

    const data = await res.json();
    const lootList: CreatureLootEntry[] = (data.lootStatistics ?? []).map(
      (entry: { itemName: string; rarity: string; chance: string | null }) => ({
        itemName: entry.itemName,
        rarity: (entry.rarity ?? "unknown") as ItemRarity,
        chance: entry.chance ?? null,
      })
    );

    creatureCache.set(key, lootList);
    return lootList;
  } catch {
    creatureCache.set(key, []);
    return [];
  }
}

/**
 * Dado o nome de um item e a lista de criaturas mortas,
 * retorna a raridade encontrada para aquele item.
 */
async function resolveItemRarity(
  itemName: string,
  creatureNames: string[]
): Promise<{ rarity: ItemRarity; chance: string | null }> {
  const normalizedItem = itemName.toLowerCase();

  // Raridade mais baixa encontrada vence (= item mais valioso/raro)
  const RARITY_ORDER: ItemRarity[] = [
    "very rare",
    "rare",
    "semi-rare",
    "uncommon",
    "common",
    "always",
    "unknown",
  ];

  let bestRarity: ItemRarity = "unknown";
  let bestChance: string | null = null;

  for (const creature of creatureNames) {
    const loot = await fetchCreatureLoot(creature);
    const match = loot.find(
      (l) => l.itemName.toLowerCase() === normalizedItem
    );

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
 * Enriquece uma lista de itens com raridade, consultando a API para cada criatura.
 * Paraleliza as buscas para ser rápido.
 */
export async function enrichItemsWithRarity(
  items: Array<{ name: string; qty: number }>,
  killedCreatures: string[]
): Promise<ItemWithRarity[]> {
  if (killedCreatures.length === 0) {
    return items.map((i) => ({ ...i, rarity: "unknown", chance: null }));
  }

  const results = await Promise.all(
    items.map(async (item) => {
      const { rarity, chance } = await resolveItemRarity(item.name, killedCreatures);
      return { ...item, rarity, chance };
    })
  );

  return results;
}

/** Metadados visuais de cada raridade. */
export const RARITY_META: Record<
  ItemRarity,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  always: {
    label: "Sempre",
    color: "#e2e2e8",
    bg: "rgba(226,226,232,0.08)",
    border: "rgba(226,226,232,0.2)",
    glow: "none",
  },
  common: {
    label: "Comum",
    color: "#8888a0",
    bg: "rgba(136,136,160,0.08)",
    border: "rgba(136,136,160,0.2)",
    glow: "none",
  },
  uncommon: {
    label: "Incomum",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.2)",
    glow: "none",
  },
  "semi-rare": {
    label: "Semi-raro",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.2)",
    glow: "none",
  },
  rare: {
    label: "Raro",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.10)",
    border: "rgba(192,132,252,0.25)",
    glow: "0 0 12px rgba(192,132,252,0.35)",
  },
  "very rare": {
    label: "Muito Raro",
    color: "#f0d078",
    bg: "rgba(240,208,120,0.10)",
    border: "rgba(212,168,67,0.35)",
    glow: "0 0 16px rgba(212,168,67,0.55)",
  },
  unknown: {
    label: "?",
    color: "#8888a0",
    bg: "rgba(136,136,160,0.06)",
    border: "rgba(136,136,160,0.15)",
    glow: "none",
  },
};
