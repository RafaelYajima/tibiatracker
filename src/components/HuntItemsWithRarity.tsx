"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, Sparkles } from "lucide-react";
import type { ItemRarity } from "@/lib/itemrarity";
import { RARITY_META } from "@/lib/itemrarity";
import { formatFull } from "@/lib/format";

interface Item {
  name: string;
  qty: number;
  rarity?: ItemRarity;
  chance?: string | null;
}

interface HuntItemsWithRarityProps {
  items: Item[];
  /** Nomes dos monstros mortos nesta hunt. */
  creatures?: string[];
  huntId: string;
}

const RARITY_ORDER: ItemRarity[] = [
  "very rare",
  "rare",
  "semi-rare",
  "uncommon",
  "common",
  "always",
  "unknown",
];

/**
 * Lista de itens de uma hunt, enriquecida com raridade via API.
 * Ordena por raridade (mais raro primeiro) e exibe badges coloridos.
 */
export function HuntItemsWithRarity({ items, creatures = [], huntId }: HuntItemsWithRarityProps) {
  const [enriched, setEnriched] = useState<Item[]>(items);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (items.length === 0 || creatures.length === 0 || loaded) return;

    setLoading(true);
    fetch("/api/items/rarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, creatures }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          // Ordena: muito raro primeiro
          const sorted = [...data.items].sort((a, b) => {
            const ai = RARITY_ORDER.indexOf(a.rarity ?? "unknown");
            const bi = RARITY_ORDER.indexOf(b.rarity ?? "unknown");
            return ai - bi;
          });
          setEnriched(sorted);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }, [items, creatures, huntId, loaded]);

  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-ink-muted">
        <Package className="h-3.5 w-3.5" /> Nenhum item registrado nesta sessão.
      </p>
    );
  }

  return (
    <div>
      {/* Header com indicador de carregamento */}
      <div className="mb-2.5 flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {enriched.length} {enriched.length === 1 ? "item" : "itens"}
        </p>
        {loading && (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gold-500/70">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> buscando raridades…
          </span>
        )}
        {loaded && creatures.length > 0 && !loading && (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gold-500/60">
            <Sparkles className="h-2.5 w-2.5" /> raridades do TibiaWiki
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {enriched.map((item) => {
          const rarity = item.rarity ?? "unknown";
          const meta = RARITY_META[rarity];
          return (
            <div
              key={item.name}
              className="group relative inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition-all duration-200"
              style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                boxShadow: loaded && rarity !== "unknown" && rarity !== "common" ? meta.glow : "none",
              }}
              title={
                item.chance
                  ? `${meta.label} — ${item.chance} por kill`
                  : rarity !== "unknown"
                    ? meta.label
                    : "Raridade desconhecida"
              }
            >
              <span className="font-medium text-ink">{item.name}</span>
              <span
                className="font-extrabold tabular-nums"
                style={{ color: meta.color }}
              >
                {formatFull(item.qty)}×
              </span>
              {loaded && rarity !== "unknown" && (
                <span
                  className="ml-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em]"
                  style={{
                    color: meta.color,
                    background: `${meta.bg}`,
                    border: `1px solid ${meta.border}`,
                  }}
                >
                  {meta.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda de raridades (exibe apenas quando carregado) */}
      {loaded && creatures.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-night-700/40 pt-2.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-muted/60">Raridade:</span>
          {(["very rare", "rare", "semi-rare", "uncommon", "common"] as ItemRarity[]).map((r) => {
            const m = RARITY_META[r];
            const hasItem = enriched.some((i) => i.rarity === r);
            if (!hasItem) return null;
            return (
              <span
                key={r}
                className="inline-flex items-center gap-1 text-[9px] font-bold"
                style={{ color: m.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: m.color, boxShadow: m.glow }}
                />
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
