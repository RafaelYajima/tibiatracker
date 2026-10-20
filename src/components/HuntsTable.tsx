"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Sparkles,
  Swords,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { HuntWithItems } from "@/types";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { EmptyState, GoldLink } from "./ui";

interface HuntsTableProps {
  hunts: HuntWithItems[];
  /** Permite expandir a linha para ver os itens da hunt. */
  expandable?: boolean;
  /** Ativa paginação client-side. */
  paginated?: boolean;
  pageSize?: number;
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = Array.from(set)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function ProfitCell({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap font-bold ${
        positive ? "text-green-400" : "text-red-400"
      }`}
      title={`${formatFull(value)} gp`}
    >
      {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {formatSignedGP(value)}
    </span>
  );
}

const iconBtnClass =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-night-700 text-ink-muted transition-all hover:border-gold-500/40 hover:text-gold-300 disabled:pointer-events-none disabled:opacity-30";

export function HuntsTable({ hunts, expandable = false, paginated = false, pageSize = 12 }: HuntsTableProps) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(hunts.length / pageSize));

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [hunts]);

  const visible = useMemo(() => {
    if (!paginated) return hunts;
    const start = (page - 1) * pageSize;
    return hunts.slice(start, start + pageSize);
  }, [hunts, paginated, page, pageSize]);

  if (hunts.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="Nenhuma hunt no período"
        message="Cole o Hunt Analyser depois da próxima rotação para começar a montar seu histórico de profit."
        action={<GoldLink href="/new">Registrar hunt</GoldLink>}
      />
    );
  }

  const colCount = expandable ? 6 : 5;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-night-700 bg-night-900/40">
              {expandable && <th className="w-10 px-3 py-3" aria-label="Expandir" />}
              {["Data", "Duração", "Loot", "Gasto", "Profit"].map((col, i) => (
                <th
                  key={col}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted ${
                    i >= 2 ? "text-right" : "text-left"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((hunt) => {
              const expanded = expandable && expandedId === hunt.id;
              const date = new Date(hunt.createdAt);
              return (
                <Fragment key={hunt.id}>
                  <tr
                    onClick={expandable ? () => setExpandedId(expanded ? null : hunt.id) : undefined}
                    className={`border-b border-night-700/60 transition-colors ${
                      expandable ? "cursor-pointer" : ""
                    } ${expanded ? "bg-gold-500/[0.04]" : "hover:bg-night-800/50"}`}
                  >
                    {expandable && (
                      <td className="px-3 py-3.5">
                        <ChevronRight
                          className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${
                            expanded ? "rotate-90 text-gold-400" : ""
                          }`}
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-ink">
                      {Number.isNaN(date.getTime()) ? "—" : format(date, "dd/MM/yyyy HH:mm")}
                      {hunt.character && (
                        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-gold-500/80">
                          {hunt.character.name}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                        <Clock className="h-3 w-3 text-gold-500/70" />
                        {hunt.duration}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold text-green-400">
                      {formatGP(hunt.loot)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold text-red-400">
                      {formatGP(hunt.supplies)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs">
                      <ProfitCell value={hunt.balance} />
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-night-700/60 bg-night-900/50">
                      <td colSpan={colCount} className="px-5 py-4">
                        {hunt.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {hunt.items.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1.5 rounded-md border border-night-700 bg-night-800 px-2 py-1 text-[11px]"
                              >
                                <span className="text-ink">{item.name}</span>
                                <span className="font-extrabold text-gold-400">{formatFull(item.qty)}×</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="flex items-center gap-2 text-[11px] text-ink-muted">
                            <Package className="h-3.5 w-3.5" /> Nenhum item registrado nesta sessão.
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ink-muted/90">
                          <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-gold-500/70" /> XP ganho: {formatFull(hunt.xpGain)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-gold-500/70" /> XP/h: {formatFull(hunt.xpPerHour)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {paginated && pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <p className="text-[11px] text-ink-muted">
            {hunts.length} hunts · página {page} de {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Página anterior" className={iconBtnClass} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              {pageWindow(page, pageCount).map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-ink-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-all ${
                      p === page
                        ? "border-gold-500/45 bg-gold-500/15 text-gold-300"
                        : "border-night-700 text-ink-muted hover:border-night-600 hover:text-ink"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              aria-label="Próxima página"
              className={iconBtnClass}
              disabled={page === pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
