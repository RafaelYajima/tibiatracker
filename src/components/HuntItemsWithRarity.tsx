"use client";

import { useEffect, useState } from "react";
import { Filter, Loader2, Package, Sparkles } from "lucide-react";
import {
  type ItemRarity,
  type ItemWithRarity,
  type ValueTier,
  RARITY_META,
  VALUE_TIER_META,
} from "@/lib/itemrarity";
import { formatFull, formatGP } from "@/lib/format";

interface Props {
  items: Array<{ name: string; qty: number }>;
  creatures?: string[];
  huntId: string;
}

type SortMode = "value" | "rarity" | "qty" | "name";

const RARITY_ORDER: ItemRarity[] = ["very rare", "rare", "semi-rare", "uncommon", "common", "always", "unknown"];
const VALUE_ORDER: ValueTier[] = ["godlike", "high", "medium", "low", "trash", "unknown"];

function sortItems(items: ItemWithRarity[], mode: SortMode): ItemWithRarity[] {
  const arr = [...items];
  switch (mode) {
    case "value":
      return arr.sort((a, b) => b.marketValueMax - a.marketValueMax);
    case "rarity":
      return arr.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    case "qty":
      return arr.sort((a, b) => b.qty - a.qty);
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
  }
}

const EMPTY_ITEM: Omit<ItemWithRarity, "name" | "qty"> = {
  rarity: "unknown",
  chance: null,
  marketValueMax: 0,
  valueTier: "unknown",
  marketable: false,
};

export function HuntItemsWithRarity({ items, creatures = [], huntId }: Props) {
  const [enriched, setEnriched] = useState<ItemWithRarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("value");
  const [showFilters, setShowFilters] = useState(false);

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
        setEnriched(items.map((i) => ({ ...i, ...EMPTY_ITEM })));
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

  const displayItems = loaded
    ? sortItems(enriched, sortMode)
    : items.map((i) => ({ ...i, ...EMPTY_ITEM }));

  const totalEstimated = loaded
    ? enriched.reduce((acc, i) => acc + i.marketValueMax * i.qty, 0)
    : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
          {loading && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gold-400/80">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> carregando…
            </span>
          )}
          {loaded && !loading && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gold-500/60">
              <Sparkles className="h-2.5 w-2.5" /> TibiaWiki
            </span>
          )}
          {/* Botão de filtros */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] transition-all ${
              showFilters
                ? "border-gold-500/40 bg-gold-500/15 text-gold-300"
                : "border-night-700 text-ink-muted hover:border-night-600 hover:text-ink"
            }`}
          >
            <Filter className="h-2.5 w-2.5" /> Ordenar
          </button>
        </div>
        {loaded && totalEstimated > 0 && (
          <span className="text-[10px] font-bold text-gold-400">
            Valor estimado: ~{formatGP(totalEstimated)}
          </span>
        )}
      </div>

      {/* Botões de ordenação — só visíveis quando o usuário clica em "Ordenar" */}
      {showFilters && (
        <div className="animate-fade-up flex flex-wrap items-center gap-1.5 rounded-lg border border-night-700/60 bg-night-900/40 px-3 py-2">
          <span className="mr-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted/60">Ordenar por:</span>
          {([
            { mode: "value" as SortMode, label: "Valor" },
            { mode: "rarity" as SortMode, label: "Raridade" },
            { mode: "qty" as SortMode, label: "Quantidade" },
            { mode: "name" as SortMode, label: "Nome" },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSortMode(mode)}
              className={`rounded-full border px-2.5 py-1 text-[9px] font-bold transition-all ${
                sortMode === mode
                  ? "border-gold-500/45 bg-gold-500/15 text-gold-300"
                  : "border-night-700 text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Grid de itens — visual limpo, cor = tier de valor */}
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => {
          const vMeta = VALUE_TIER_META[item.valueTier];
          const isValuable = loaded && item.valueTier !== "unknown" && item.valueTier !== "trash";

          return (
            <div
              key={item.name}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: isValuable ? vMeta.bg : "rgba(32,32,46,0.6)",
                border: `1px solid ${isValuable ? vMeta.border : "rgba(42,42,58,0.8)"}`,
                boxShadow: isValuable ? vMeta.glow : "none",
              }}
            >
              <span className="font-medium text-ink">{item.name}</span>
              <span
                className="font-extrabold tabular-nums"
                style={{ color: isValuable ? vMeta.color : "#d4a843" }}
              >
                {formatFull(item.qty)}×
              </span>
              {loaded && item.marketValueMax > 0 && (
                <span className="text-[9px] font-bold text-ink-muted/70">
                  ~{formatGP(item.marketValueMax)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda de cores — sempre visível, simples e clara */}
      {loaded && (
        <div className="flex flex-wrap items-center gap-3 border-t border-night-700/30 pt-2">
          {(["godlike", "high", "medium", "low", "trash"] as ValueTier[]).map((t) => {
            if (!enriched.some((i) => i.valueTier === t)) return null;
            const m = VALUE_TIER_META[t];
            return (
              <span key={t} className="inline-flex items-center gap-1.5 text-[9px] font-bold" style={{ color: m.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: m.color, boxShadow: m.glow }} />
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
