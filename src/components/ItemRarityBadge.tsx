"use client";

import { type ItemRarity, RARITY_META } from "@/lib/itemrarity";

/** Badge colorido de raridade — usado nos chips de item. */
export function ItemRarityBadge({ rarity }: { rarity: ItemRarity }) {
  const meta = RARITY_META[rarity];
  if (rarity === "unknown") return null;

  return (
    <span
      className="ml-1.5 shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em]"
      style={{
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        boxShadow: meta.glow,
      }}
    >
      {meta.label}
    </span>
  );
}
