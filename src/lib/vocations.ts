import { Crosshair, Flame, Hand, Leaf, Shield, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface VocationMeta {
  color: string;
  icon: LucideIcon;
  label: string;
}

const FALLBACK: VocationMeta = { color: "#d4a843", icon: Sparkles, label: "Sem vocação" };

/** Cor/ícone de cada vocação para os cards e chips de personagem. */
export function getVocationMeta(vocation?: string | null): VocationMeta {
  const v = (vocation ?? "").toLowerCase();
  if (v.includes("knight")) return { color: "#60a5fa", icon: Shield, label: "Knight" };
  if (v.includes("paladin")) return { color: "#4ade80", icon: Crosshair, label: "Paladin" };
  if (v.includes("druid")) return { color: "#2dd4bf", icon: Leaf, label: "Druid" };
  if (v.includes("sorcerer")) return { color: "#f87171", icon: Flame, label: "Sorcerer" };
  if (v.includes("monk")) return { color: "#c084fc", icon: Hand, label: "Monk" };
  return vocation ? { ...FALLBACK, label: vocation } : FALLBACK;
}
