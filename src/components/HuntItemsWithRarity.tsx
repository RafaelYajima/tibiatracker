"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, Loader2, Package, Sparkles } from "lucide-react";
import {
  type ItemRarity,
  type ItemWithRarity,
  type ValueTier,
  RARITY_META,
  VALUE_TIER_META,
} from "@/lib/itemrarity";
import { formatFull, formatGP } from "@/lib/format";

interface HuntItemsWithRarityProps {
  items: Array<{ name: string; qty: number }>;
  creatures?: string[];
  huntId: string;
}

type SortMode = "rarity" | "value" | "qty" | "name";

const RARITY_ORDER: ItemRarity[] = [
  "very rare", "rare", "semi-rare", "uncommon", "common", "always", "unknown",
];
const VALUE_ORDER: ValueTier[] = [
  "godlike", "high", "medium", "low", "trash", "unknown",
];

function sortItems(items: ItemWithRarity[], mode: SortMode): ItemWithRarity[] {
  const arr = [...items];
  switch (mode) {
    case "rarity":
      return arr.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    case "value":
      return arr.sort((a, b) => VALUE_ORDER.indexOf(a.valueTier) - VALUE_ORDER.indexOf(b.valueTier));
    case "qty":
      return arr.sort((a, b) => b.qty - a.qty);
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/** Chip individual de item com badge duplo (raridade + valor). */
function ItemChip({ item, loaded }: { item: ItemWithRarity; loaded: boolean }) {
  const rMeta = RARITY_META[item.rarity];
  const vMeta = VALUE_TIER_META[item.valueTier];

  // A borda e glow principal são definidos pelo tier de valor (mais relevante para profit)
  const borderColor = loaded && item.valueTier !== "unknown" ? vMeta.border : "rgba(42,42,58,0.8)";
  const bg = loaded && item.valueTier !== "unknown" ? vMeta.bg : "rgba(32,32,46,0.7)";
  const glow = loaded && item.valueTier !== "unknown" ? vMeta.glow : "none";

  return (
    <div
      className="group relative inline-flex flex-col gap-1 rounded-xl p-2.5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: bg, border: `1px solid ${borderColor}`, boxShadow: glow }}
    >
      {/* Nome + Quantidade */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-ink">{item.name}</span>
        <span
          className="shrink-0 text-[12px] font-extrabold tabular-nums"
          style={{ color: loaded && item.valueTier !== "unknown" ? vMeta.color : "#d4a843" }}
        >
          {formatFull(item.qty)}×
        </span>
      </div>

      {/* Badges de raridade e valor */}
      {loaded && (
        <div className="flex items-center gap-1.5">
          {/* Badge de raridade (drop chance) */}
          {item.rarity !== "unknown" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em]"
              style={{ color: rMeta.color, background: rMeta.bg, border: `1px solid ${rMeta.border}` }}
            >
              {rMeta.label}
            </span>
          )}
          {/* Badge de valor de mercado */}
          {item.valueTier !== "unknown" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em]"
              style={{ color: vMeta.color, background: vMeta.bg, border: `1px solid ${vMeta.border}`, boxShadow: vMeta.glow }}
            >
              {item.marketValueMax > 0 ? `~${formatGP(item.marketValueMax)}` : vMeta.short}
            </span>
          )}
        </div>
      )}

      {/* Tooltip ao hover: valor total do loot desse item */}
      {loaded && item.marketValueMax > 0 && (
        <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-night-700 bg-night-900 px-2 py-1 text-[10px] font-bold text-ink shadow-xl group-hover:block z-10">
          Total: ~{formatGP(item.marketValueMax * item.qty)}
        </div>
      )}
    </div>
  );
}

/** Seção de legenda (raridade + valor). */
function Legend({
  items,
  mode,
}: {
  items: ItemWithRarity[];
  mode: "rarity" | "value";
}) {
  if (mode === "rarity") {
    const present = new Set(items.map((i) => i.rarity));
    const tiers = (["very rare", "rare", "semi-rare", "uncommon", "common"] as ItemRarity[]).filter((r) =>
      present.has(r)
    );
    if (tiers.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-muted/60">Drop:</span>
        {tiers.map((r) => {
          const m = RARITY_META[r];
          return (
            <span key={r} className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: m.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color, boxShadow: m.glow }} />
              {m.label}
            </span>
          );
        })}
      </div>
    );
  }

  const present = new Set(items.map((i) => i.valueTier));
  const tiers = (["godlike", "high", "medium", "low", "trash"] as ValueTier[]).filter((t) => present.has(t));
  if (tiers.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-muted/60">Valor:</span>
      {tiers.map((t) => {
        const m = VALUE_TIER_META[t];
        return (
          <span key={t} className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: m.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color, boxShadow: m.glow }} />
            {m.label}
          </span>
        );
      })}
    </div>
  );
}

export function HuntItemsWithRarity({ items, creatures = [], huntId }: HuntItemsWithRarityProps) {
  const [enriched, setEnriched] = useState<ItemWithRarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("value");

  useEffect(() => {
    if (items.length === 0 || loaded) return;
    setLoading(true);

    fetch("/api/items/rarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, creatures }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setEnriched(data.items);
          setLoaded(true);
        }
      })
      .catch(() => {
        setEnriched(items.map((i) => ({
          ...i,
          rarity: "unknown" as ItemRarity,
          chance: null,
          marketValueMax: 0,
          valueTier: "unknown" as ValueTier,
          marketable: false,
        })));
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [items, creatures, huntId, loaded]);

  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-ink-muted">
        <Package className="h-3.5 w-3.5" /> Nenhum item registrado nesta sessão.
      </p>
    );
  }

  const displayItems = loaded ? sortItems(enriched, sortMode) : items.map((i) => ({
    ...i,
    rarity: "unknown" as ItemRarity,
    chance: null,
    marketValueMax: 0,
    valueTier: "unknown" as ValueTier,
    marketable: false,
  }));

  // Valor total estimado do loot desta hunt
  const totalEstimated = loaded
    ? enriched.reduce((acc, i) => acc + i.marketValueMax * i.qty, 0)
    : 0;

  return (
    <div className="space-y-3">
      {/* Header com controles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
          {loading && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/20 bg-gold-500/5 px-2 py-0.5 text-[9px] font-bold text-gold-400/80">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> buscando dados…
            </span>
          )}
          {loaded && !loading && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/15 bg-gold-500/5 px-2 py-0.5 text-[9px] font-bold text-gold-500/70">
              <Sparkles className="h-2.5 w-2.5" /> dados do TibiaWiki
            </span>
          )}
        </div>

        {/* Valor total estimado */}
        {loaded && totalEstimated > 0 && (
          <span className="text-[10px] font-bold text-gold-400">
            Valor estimado: ~{formatGP(totalEstimated)}
          </span>
        )}
      </div>

      {/* Botões de ordenação */}
      <div className="flex flex-wrap items-center gap-1.5">
        <ArrowUpDown className="h-3 w-3 text-ink-muted/50" />
        {([
          { mode: "value", label: "Valor" },
          { mode: "rarity", label: "Raridade drop" },
          { mode: "qty", label: "Quantidade" },
          { mode: "name", label: "Nome A–Z" },
        ] as { mode: SortMode; label: string }[]).map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSortMode(mode)}
            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition-all ${
              sortMode === mode
                ? "border-gold-500/45 bg-gold-500/15 text-gold-300"
                : "border-night-700 bg-night-850 text-ink-muted hover:border-night-600 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grade de itens */}
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => (
          <ItemChip key={item.name} item={item} loaded={loaded} />
        ))}
      </div>

      {/* Legendas */}
      {loaded && (
        <div className="flex flex-col gap-1.5 border-t border-night-700/40 pt-2.5">
          <Legend items={enriched} mode="value" />
          <Legend items={enriched} mode="rarity" />
        </div>
      )}
    </div>
  );
}
