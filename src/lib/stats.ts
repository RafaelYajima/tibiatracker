import { format } from "date-fns";
import type { HuntWithItems } from "@/types";

export interface HuntSummary {
  profit: number;
  loot: number;
  supplies: number;
  sessions: number;
  xp: number;
}

export interface DayPoint {
  date: string;
  label: string;
  profit: number;
  loot: number;
  hunts: number;
}

export interface ItemTotal {
  name: string;
  qty: number;
}

export function summarize(hunts: HuntWithItems[]): HuntSummary {
  return hunts.reduce<HuntSummary>(
    (acc, h) => ({
      profit: acc.profit + h.balance,
      loot: acc.loot + h.loot,
      supplies: acc.supplies + h.supplies,
      sessions: acc.sessions + 1,
      xp: acc.xp + h.xpGain,
    }),
    { profit: 0, loot: 0, supplies: 0, sessions: 0, xp: 0 },
  );
}

/** Profit somado por dia (ordem cronológica) para o gráfico de área. */
export function profitByDay(hunts: HuntWithItems[]): DayPoint[] {
  const map = new Map<string, DayPoint>();
  for (const h of hunts) {
    const d = new Date(h.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = format(d, "yyyy-MM-dd");
    const point = map.get(key) ?? {
      date: key,
      label: format(d, "dd/MM"),
      profit: 0,
      loot: 0,
      hunts: 0,
    };
    point.profit += h.balance;
    point.loot += h.loot;
    point.hunts += 1;
    map.set(key, point);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Top N itens mais dropados no período (soma das quantidades). */
export function topItems(hunts: HuntWithItems[], limit = 8): ItemTotal[] {
  const map = new Map<string, number>();
  for (const h of hunts) {
    for (const item of h.items) {
      map.set(item.name, (map.get(item.name) ?? 0) + item.qty);
    }
  }
  return Array.from(map.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}
