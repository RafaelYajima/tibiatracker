"use client";

import { useEffect, useState } from "react";
import { Check, Filter, Loader2, Package, Sparkles, X } from "lucide-react";
import {
  type ItemRarity,
  type ItemWithRarity,
  type ValueTier,
  VALUE_TIER_META,
  getValueTier,
} from "@/lib/itemrarity";
import { formatFull, formatGP } from "@/lib/format";
import { Modal } from "./Modal";
import { GoldButton } from "./ui";

interface Props {
  items: Array<{ name: string; qty: number }>;
  creatures?: string[];
  huntId: string;
}

type SortMode = "value" | "rarity" | "qty" | "name";

const RARITY_ORDER: ItemRarity[] = ["very rare", "rare", "semi-rare", "uncommon", "common", "always", "unknown"];

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

const EMPTY: Omit<ItemWithRarity, "name" | "qty"> = {
  rarity: "unknown",
  chance: null,
  npcPrice: 0,
  marketValueMax: 0,
  valueTier: "unknown",
  marketable: false,
};

/* ================================================================ */
/* Modal de preço customizado                                        */
/* ================================================================ */
function ItemPriceModal({
  item,
  onClose,
  onSaved,
}: {
  item: ItemWithRarity;
  onClose: () => void;
  onSaved: (itemName: string, price: number) => void;
}) {
  const [price, setPrice] = useState(item.marketValueMax > item.npcPrice ? item.marketValueMax : 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/item-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: item.name, customPrice: price }),
      });
      if (res.ok) {
        onSaved(item.name, price);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  const displayValue = price > 0 ? price : item.npcPrice;
  const tier = getValueTier(displayValue);
  const tierMeta = VALUE_TIER_META[tier];

  return (
    <Modal isOpen onClose={onClose} title={item.name}>
      <div className="space-y-5">
        {/* NPC Price */}
        <div className="rounded-xl border border-night-700 bg-night-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Valor NPC (fixo)</p>
              <p className="mt-1 text-lg font-extrabold text-ink">
                {item.npcPrice > 0 ? formatGP(item.npcPrice) : "Não vendável"}
              </p>
            </div>
            {item.npcPrice > 0 && (
              <span className="text-xs text-ink-muted">Venda garantida ao NPC</span>
            )}
          </div>
        </div>

        {/* Custom Market Price */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-muted">
            Valor de Market (seu preço personalizado)
          </label>
          <p className="mb-3 text-[10px] text-ink-muted/70">
            Defina quanto esse item vale no market do seu servidor. Esse valor será usado para calcular o tier de cor e o valor estimado total.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={price || ""}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Ex: 55000"
              min={0}
              className="flex-1 rounded-xl border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-gold-500/50 focus:outline-none"
            />
            <span className="shrink-0 text-xs text-ink-muted">gp</span>
          </div>
          {/* Preview do tier com o novo valor */}
          {displayValue > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: tierMeta.color, boxShadow: tierMeta.glow }} />
              <span className="text-[10px] font-bold" style={{ color: tierMeta.color }}>
                {tierMeta.label} — {formatGP(displayValue)}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <GoldButton onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar preço
          </GoldButton>
          {price > 0 && (
            <button
              type="button"
              onClick={() => setPrice(0)}
              className="rounded-xl border border-night-700 bg-night-800 px-3 py-2 text-xs font-bold text-ink-muted hover:text-red-400 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================ */
/* Componente principal                                              */
/* ================================================================ */
export function HuntItemsWithRarity({ items, creatures = [], huntId }: Props) {
  const [enriched, setEnriched] = useState<ItemWithRarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("value");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithRarity | null>(null);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Carrega dados da API + preços customizados do usuário
  useEffect(() => {
    if (items.length === 0 || loaded) return;
    setLoading(true);

    const names = items.map((i) => i.name).join(",");

    Promise.all([
      fetch("/api/items/rarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, creatures }),
      }).then((r) => r.json()),
      fetch(`/api/item-prices?names=${encodeURIComponent(names)}`).then((r) => r.json()),
    ])
      .then(([rarityData, pricesData]) => {
        const prices: Record<string, number> = pricesData.prices ?? {};
        setCustomPrices(prices);

        if (Array.isArray(rarityData.items)) {
          // Aplica preços customizados sobre os dados da API
          const merged = rarityData.items.map((item: ItemWithRarity) => {
            const custom = prices[item.name];
            if (custom && custom > 0) {
              return { ...item, marketValueMax: custom, valueTier: getValueTier(custom) };
            }
            return item;
          });
          setEnriched(merged);
        }
        setLoaded(true);
      })
      .catch(() => {
        setEnriched(items.map((i) => ({ ...i, ...EMPTY })));
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [items, creatures, huntId, loaded]);

  // Quando o usuário salva um preço customizado no modal
  function handlePriceSaved(itemName: string, price: number) {
    setCustomPrices((prev) => ({ ...prev, [itemName]: price }));
    setEnriched((prev) =>
      prev.map((item) => {
        if (item.name !== itemName) return item;
        const finalPrice = price > 0 ? price : item.npcPrice;
        return { ...item, marketValueMax: finalPrice, valueTier: getValueTier(finalPrice) };
      })
    );
  }

  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-ink-muted">
        <Package className="h-3.5 w-3.5" /> Nenhum item registrado nesta sessão.
      </p>
    );
  }

  const displayItems = loaded ? sortItems(enriched, sortMode) : items.map((i) => ({ ...i, ...EMPTY }));
  const totalEstimated = loaded ? enriched.reduce((acc, i) => acc + i.marketValueMax * i.qty, 0) : 0;

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
              <Sparkles className="h-2.5 w-2.5" /> clique num item para definir preço
            </span>
          )}
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

      {/* Filtros */}
      {showFilters && (
        <div className="animate-fade-up flex flex-wrap items-center gap-1.5 rounded-lg border border-night-700/60 bg-night-900/40 px-3 py-2">
          <span className="mr-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted/60">Por:</span>
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

      {/* Grid de itens — clicável */}
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => {
          const vMeta = VALUE_TIER_META[item.valueTier];
          const hasValue = loaded && item.marketValueMax > 0;
          const hasCustom = (customPrices[item.name] ?? 0) > 0;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelectedItem(item)}
              className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 cursor-pointer"
              style={{
                background: hasValue ? vMeta.bg : "rgba(32,32,46,0.6)",
                border: `1px solid ${hasValue ? vMeta.border : "rgba(42,42,58,0.8)"}`,
                boxShadow: hasValue ? vMeta.glow : "none",
              }}
            >
              <span className="font-medium text-ink">{item.name}</span>
              <span
                className="font-extrabold tabular-nums"
                style={{ color: hasValue ? vMeta.color : "#d4a843" }}
              >
                {formatFull(item.qty)}×
              </span>
              {loaded && item.marketValueMax > 0 && (
                <span className="text-[9px] font-bold text-ink-muted/70">
                  ~{formatGP(item.marketValueMax)}
                  {hasCustom && <span className="ml-0.5 text-gold-500/80">✎</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
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

      {/* Modal de preço */}
      {selectedItem && (
        <ItemPriceModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSaved={handlePriceSaved}
        />
      )}
    </div>
  );
}
