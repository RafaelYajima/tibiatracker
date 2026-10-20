/**
 * Teste de regressão do parser do Hunt Analyser.
 *
 * As duas amostras abaixo são outputs REAIS do botão "Copy to Clipboard"
 * do client do Tibia (19/10/2026) — são a referência oficial de formato
 * do TibiaTracker. Se o parser mudar, este teste precisa continuar 100%.
 *
 * Rodar:  node tests/hunt-analyser-parser.test.mjs
 * (Node >= 22 executa o import .ts diretamente; em versões mais antigas:
 *  node --experimental-strip-types tests/hunt-analyser-parser.test.mjs)
 */
import { parseHuntAnalyser } from "../src/lib/parser.ts";

/** Amostra real 1 — rotação SEM loot (Balance negativo, Looted Items: None). */
const REAL_SAMPLE_NO_LOOT = `Session data: From 2026-10-19, 20:52:54 to 2026-10-19, 21:16:54
Session: 00:23h
Raw XP Gain: 120,294
XP Gain: 180,431
Raw XP/h: 300,818
XP/h: 451,202
Loot: 0
Supplies: 255,875
Balance: -255,875
Damage: 403,113
Damage/h: 1,174,559
Healing: 134,361
Healing/h: 391,490
Killed Monsters:
  12x flimsy lost soul
  2x freakish lost soul
  7x mean lost soul
  1x scorpion
  1x slime
Looted Items:
  None`;

/** Amostra real 2 — mesma rotação COM loot (23 itens). */
const REAL_SAMPLE_WITH_LOOT = `Session data: From 2026-10-19, 20:52:54 to 2026-10-19, 21:18:51
Session: 00:25h
Raw XP Gain: 120,294
XP Gain: 180,431
Raw XP/h: 278,135
XP/h: 417,179
Loot: 757,866
Supplies: 255,875
Balance: 501,991
Damage: 403,113
Damage/h: 1,073,041
Healing: 134,361
Healing/h: 357,653
Killed Monsters:
  12x flimsy lost soul
  2x freakish lost soul
  7x mean lost soul
  1x scorpion
  1x slime
Looted Items:
  1x a piggy bank
  1x a platinum coin
  1x a yellow gem
  1x a green gem
  6x a crystal coin
  4x a berserk potion
  29x a mastermind potion
  2x a silver token
  3x a gold token
  9x an ultimate mana potion
  13x an ultimate spirit potion
  2x a supreme health potion
  1x mysterious remains
  1x an energy bar
  1x a collar of red plasma
  96x a royal star
  1x a giant sapphire
  1x a writhing heart
  1x a giant amethyst
  3x a white gem
  1x a diamond
  2x a moonstone
  1x an ivory comb`;

/** Formato legado (seções Loot:/Supplies: com "Nome: quantidade"). */
const LEGACY_SAMPLE = `Session: 02:13h
XP Gain: 1,234,567
XP/h: 890,123
Loot: 1,234,567
Supplies: 200,000
Balance: 1,034,567

Loot:
Gold Token: 3
Silver Token: 7

Supplies:
Great Mana Potion: 200
Gold Token: 2`;

const r1 = parseHuntAnalyser(REAL_SAMPLE_NO_LOOT);
const r2 = parseHuntAnalyser(REAL_SAMPLE_WITH_LOOT);
const r3 = parseHuntAnalyser(LEGACY_SAMPLE);

const checks = [];
const eq = (name, got, want) =>
  checks.push([name, JSON.stringify(got) === JSON.stringify(want), got, want]);
const qtyOf = (r, n) => (r.items.find((i) => i.name === n) || {}).qty;

// --- Amostra real 1 (sem loot) ---
eq("s1 session", r1.session, "00:23h");
eq("s1 xpGain ignora Raw XP Gain", r1.xpGain, 180431);
eq("s1 xp/h ignora Raw XP/h", r1.xpPerHour, 451202);
eq("s1 loot zero", r1.loot, 0);
eq("s1 supplies", r1.supplies, 255875);
eq("s1 balance negativo", r1.balance, -255875);
eq("s1 Looted Items: None -> zero itens", r1.items.length, 0);
checks.push([
  "s1 Killed Monsters nao viram itens",
  !r1.items.some((i) => i.name.toLowerCase().includes("soul")),
]);

// --- Amostra real 2 (com loot) ---
eq("s2 session", r2.session, "00:25h");
eq("s2 xpGain", r2.xpGain, 180431);
eq("s2 xp/h", r2.xpPerHour, 417179);
eq("s2 loot", r2.loot, 757866);
eq("s2 supplies", r2.supplies, 255875);
eq("s2 balance", r2.balance, 501991);
eq("s2 total de itens", r2.items.length, 23);
eq("s2 Silver Token (artigo removido)", qtyOf(r2, "Silver Token"), 2);
eq("s2 Gold Token", qtyOf(r2, "Gold Token"), 3);
eq("s2 Royal Star x96", qtyOf(r2, "Royal Star"), 96);
eq("s2 Crystal Coin x6", qtyOf(r2, "Crystal Coin"), 6);
eq("s2 Mastermind Potion x29", qtyOf(r2, "Mastermind Potion"), 29);
eq("s2 Ultimate Mana Potion (artigo 'an')", qtyOf(r2, "Ultimate Mana Potion"), 9);
eq("s2 Mysterious Remains (sem artigo)", qtyOf(r2, "Mysterious Remains"), 1);
eq("s2 Collar of Red Plasma (of minusculo)", qtyOf(r2, "Collar of Red Plasma"), 1);
eq("s2 Ivory Comb", qtyOf(r2, "Ivory Comb"), 1);

// --- Legado ---
eq("legacy session", r3.session, "02:13h");
eq("legacy balance", r3.balance, 1034567);
eq("legacy merge de item entre secoes", qtyOf(r3, "Gold Token"), 5);
eq("legacy nomes unicos", r3.items.length, 3);

let failed = 0;
for (const [name, pass, got, want] of checks) {
  if (!pass) {
    failed += 1;
    console.error(`FAIL - ${name} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`);
  }
}
console.log(failed === 0 ? `OK - ${checks.length}/${checks.length} assercoes passaram` : `${failed} falhas`);
process.exit(failed === 0 ? 0 : 1);
