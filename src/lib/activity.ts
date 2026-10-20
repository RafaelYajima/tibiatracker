export type ActivityType = "hunt" | "boss_rotation";
export type ActivityFilterValue = ActivityType | "all";

export const ACTIVITY_OPTIONS: { value: ActivityType; label: string; shortLabel: string }[] = [
  { value: "hunt", label: "Lucro de Hunt", shortLabel: "Hunt" },
  { value: "boss_rotation", label: "Rotação de Bosses", shortLabel: "Rotação" },
];

export function isActivityType(value: string | null): value is ActivityType {
  return value === "hunt" || value === "boss_rotation";
}

export function isActivityFilterValue(value: string | null): value is ActivityFilterValue {
  return value === "all" || isActivityType(value);
}

export function getActivityLabel(value: ActivityType): string {
  return ACTIVITY_OPTIONS.find((option) => option.value === value)?.label ?? "Registro";
}

export function getActivityShortLabel(value: ActivityType): string {
  return ACTIVITY_OPTIONS.find((option) => option.value === value)?.shortLabel ?? "Registro";
}
