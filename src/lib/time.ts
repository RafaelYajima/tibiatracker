import { startOfDay, startOfMonth, subDays } from "date-fns";

export type TimeFilter = "today" | "7d" | "30d" | "month" | "all";

export const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 Dias" },
  { value: "30d", label: "30 Dias" },
  { value: "month", label: "Este Mês" },
  { value: "all", label: "Tudo" },
];

export function isTimeFilter(value: string | null): value is TimeFilter {
  return value === "today" || value === "7d" || value === "30d" || value === "month" || value === "all";
}

/** Data de início (inclusive) de cada filtro. `null` = sem limite. */
export function getFilterStartDate(filter: TimeFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case "today":
      return startOfDay(now);
    case "7d":
      return startOfDay(subDays(now, 6));
    case "30d":
      return startOfDay(subDays(now, 29));
    case "month":
      return startOfMonth(now);
    case "all":
      return null;
  }
}
