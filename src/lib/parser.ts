/**
 * Parser do texto copiado do Hunt Analyser do client do Tibia.
 *
 * FORMATO REAL (client atual):
 *   Session data: From 2026-10-19, 20:52:54 to 2026-10-19, 21:18:51
 *   Session: 00:25h
 *   Raw XP Gain: 120,294
 *   XP Gain: 180,431
 *   XP/h: 417,179
 *   Loot: 757,866
 *   Supplies: 255,875
 *   Balance: 501,991
 *   Damage: 403,113
 *   Healing: 134,361
 *   Killed Monsters:
 *     12x flimsy lost soul
 *   Looted Items:
 *     2x a silver token
 *     3x a gold token
 *     96x a royal star
 *
 * FORMATO LEGADO (também aceito):
 *   Session: 02:13h
 *   Loot: 1,234,567
 *   ...
 *   Loot:
 *   Gold Token: 3
 *   Supplies:
 *   Great Mana Potion: 200
 */

export interface ParsedItem {
  name: string;
  qty: number;
}

export interface ParsedHunt {
  session: string;
  xpGain: number;
  xpPerHour: number;
  loot: number;
  supplies: number;
  balance: number;
  items: ParsedItem[];
}

/** Chaves que são headers/métricas — nunca viram itens. */
const HEADER_KEYS = new Set([
  "session",
  "session data",
  "xp gain",
  "xp/h",
  "raw xp gain",
  "raw xp/h",
  "loot",
  "supplies",
  "balance",
  "damage",
  "damage/h",
  "healing",
  "healing/h",
  "killed monsters",
  "looted items",
  "loot type",
  "none",
]);

/* --- Headers numéricos --- */
const RE_SESSION = /^session\s*:\s*(.+)$/i;
const RE_XP_GAIN = /^xp\s*gain\s*:\s*([-\d.,]+)\s*$/i;
const RE_XP_PER_HOUR = /^xp\s*\/\s*h\s*:\s*([-\d.,]+)\s*$/i;
const RE_LOOT_VALUE = /^loot\s*:\s*([-\d.,]+)\s*$/i;
const RE_SUPPLIES_VALUE = /^supplies\s*:\s*([-\d.,]+)\s*$/i;
const RE_BALANCE = /^balance\s*:\s*(-?[\d.,]+)\s*$/i;

/* --- Seções --- */
const RE_LOOT_SECTION = /^loot\s*:?\s*$/i;
const RE_SUPPLIES_SECTION = /^supplies\s*:?\s*$/i;
const RE_LOOTED_ITEMS_SECTION = /^looted\s+items\s*:?\s*(?:none\.?)?$/i;
const RE_KILLED_MONSTERS_SECTION = /^killed\s+monsters\s*:?\s*(?:none\.?)?$/i;

/* --- Itens --- */
const RE_ITEM_COLON = /^(.+?):\s*([\d.,]+)\s*$/; // "Gold Token: 3" (legado)
const RE_ITEM_QTYX = /^([\d,]+)\s*x\s+(.+)$/i; // "3x a gold token" (client real)
const RE_NONE = /^none\.?$/i;

/** Palavras que ficam minúsculas no Title Case (exceto na 1ª posição). */
const TITLE_SMALL_WORDS = new Set(["a", "an", "the", "of", "and"]);

/** "1,234,567" -> 1234567 | "-45,000" -> -45000 */
function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d-]/g, "");
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

function isHeaderName(name: string): boolean {
  return HEADER_KEYS.has(name.trim().toLowerCase());
}

function smartTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && TITLE_SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/**
 * Normaliza nomes do formato real ("a platinum coin" / "an energy bar" /
 * "mysterious remains") -> "Platinum Coin" / "Energy Bar" / "Mysterious Remains".
 */
function normalizeLowercaseItemName(raw: string): string {
  const lowered = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const withoutArticle = lowered.replace(/^(?:a|an|the)\s+/, "");
  return smartTitleCase(withoutArticle);
}

/**
 * Faz o parse do clipboard. Retorna `null` quando o texto não parece
 * ser um Hunt Analyser válido (heurística: precisa de Session + Balance).
 */
export function parseHuntAnalyser(text: string): ParsedHunt | null {
  if (!text || !text.trim()) return null;

  const lines = text.split(/\r?\n/);

  let session = "";
  let xpGain = 0;
  let xpPerHour = 0;
  let loot = 0;
  let supplies = 0;
  let balance = 0;
  let foundSession = false;
  let foundBalance = false;

  type Section = "header" | "loot" | "supplies" | "looted-items" | "monsters";
  let section: Section = "header";
  const itemMap = new Map<string, number>();

  const addItem = (name: string, qty: number) => {
    if (!name || qty <= 0) return;
    // Se o item aparece mais de uma vez, soma as quantidades.
    itemMap.set(name, (itemMap.get(name) ?? 0) + qty);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Transições de seção (valem em qualquer estado)
    if (RE_LOOTED_ITEMS_SECTION.test(line)) {
      section = "looted-items";
      continue;
    }
    if (RE_KILLED_MONSTERS_SECTION.test(line)) {
      section = "monsters";
      continue;
    }
    if (RE_LOOT_SECTION.test(line)) {
      section = "loot";
      continue;
    }
    if (RE_SUPPLIES_SECTION.test(line)) {
      section = "supplies";
      continue;
    }

    if (section === "header") {
      let m = line.match(RE_SESSION);
      if (m) {
        session = m[1].trim();
        foundSession = true;
        continue;
      }
      m = line.match(RE_XP_GAIN);
      if (m) {
        xpGain = parseNumber(m[1]);
        continue;
      }
      m = line.match(RE_XP_PER_HOUR);
      if (m) {
        xpPerHour = parseNumber(m[1]);
        continue;
      }
      m = line.match(RE_LOOT_VALUE);
      if (m) {
        loot = parseNumber(m[1]);
        continue;
      }
      m = line.match(RE_SUPPLIES_VALUE);
      if (m) {
        supplies = parseNumber(m[1]);
        continue;
      }
      m = line.match(RE_BALANCE);
      if (m) {
        balance = parseNumber(m[1]);
        foundBalance = true;
        continue;
      }
      // "Session data: ...", "Raw XP Gain: ...", "Damage/h: ..." etc. são ignorados.
      continue;
    }

    // Lista de monstros mortos — ignorada por completo.
    if (section === "monsters") continue;

    // Seção real do client: "Nx [a/an] nome do item"
    if (section === "looted-items") {
      if (RE_NONE.test(line)) continue;
      const m = line.match(RE_ITEM_QTYX);
      if (m) {
        addItem(normalizeLowercaseItemName(m[2]), parseNumber(m[1]));
      }
      continue;
    }

    // Seções legadas "Loot:" / "Supplies:" — aceita "Nome: qtd" e "Nx nome".
    const colonMatch = line.match(RE_ITEM_COLON);
    if (colonMatch) {
      const name = colonMatch[1].trim();
      if (!isHeaderName(name)) {
        addItem(name, parseNumber(colonMatch[2]));
      }
      continue;
    }
    const qtyMatch = line.match(RE_ITEM_QTYX);
    if (qtyMatch) {
      addItem(normalizeLowercaseItemName(qtyMatch[2]), parseNumber(qtyMatch[1]));
    }
  }

  if (!foundSession || !foundBalance) return null;

  return {
    session,
    xpGain,
    xpPerHour,
    loot,
    supplies,
    balance,
    items: Array.from(itemMap.entries()).map(([name, qty]) => ({ name, qty })),
  };
}
