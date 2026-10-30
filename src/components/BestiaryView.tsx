"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowDownZA, CheckCircle2, ChevronDown, Loader2, Search, Swords, Trophy } from "lucide-react";
import type { BestiaryEntry } from "@/types";
import { formatFull } from "@/lib/format";
import { EmptyState } from "./ui";

/* ─── 6 cores distintas, uma por dificuldade ─── */
const DIFF_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
  harmless:    { bg: "rgba(74,222,128,0.10)",  text: "#4ade80", bar: "#4ade80" },   // verde limão
  trivial:     { bg: "rgba(34,211,238,0.10)",  text: "#22d3ee", bar: "#22d3ee" },   // ciano
  easy:        { bg: "rgba(96,165,250,0.10)",  text: "#60a5fa", bar: "#60a5fa" },   // azul
  medium:      { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", bar: "#fbbf24" },   // amarelo
  hard:        { bg: "rgba(249,115,22,0.12)",  text: "#f97316", bar: "#f97316" },   // laranja
  challenging: { bg: "rgba(239,68,68,0.12)",   text: "#f87171", bar: "#f87171" },   // vermelho
  unknown:     { bg: "rgba(136,136,160,0.08)", text: "#8888a0", bar: "#8888a0" },
};

const DIFF_LABEL: Record<string, string> = {
  harmless: "Inofensivo", trivial: "Trivial", easy: "Fácil",
  medium: "Médio", hard: "Difícil", challenging: "Desafiador", unknown: "?",
};

const DIFF_ORDER = ["harmless", "trivial", "easy", "medium", "hard", "challenging", "unknown"];
const STAGE_LABEL = ["Bloqueado", "1º Estágio", "2º Estágio", "Completo"] as const;

/* ─── Barra em 3 segmentos iguais com marcadores circulares ─── */
function StageBar({ entry }: { entry: BestiaryEntry }) {
  const colors = DIFF_COLOR[entry.difficulty.toLowerCase()] ?? DIFF_COLOR.unknown;
  const { stage1, stage2, stage3 } = entry.stages;
  const s = entry.currentStage;

  let fill = 0;
  if      (s === 0) fill = Math.min(33, (entry.totalKills / stage1) * 33);
  else if (s === 1) fill = 33 + Math.min(33, ((entry.totalKills - stage1) / (stage2 - stage1)) * 33);
  else if (s === 2) fill = 66 + Math.min(34, ((entry.totalKills - stage2) / (stage3 - stage2)) * 34);
  else              fill = 100;

  return (
    <div className="space-y-2.5">
      {/* Trilho */}
      <div className="relative h-4 overflow-visible">
        <div className="absolute inset-y-0 left-0 right-0 rounded-full border border-night-700/60 bg-night-950/90 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${fill}%`, background: s === 3 ? "linear-gradient(90deg,#d4a843,#f0d078)" : colors.bar }}
          />
          <div className="absolute inset-y-0 left-1/3 w-px bg-night-600/60" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-night-600/60" />
        </div>

        {/* Marcadores circulares — Stage 1, 2, 3 */}
        {[
          { pos: "left-1/3",  unlocked: s >= 1 },
          { pos: "left-2/3",  unlocked: s >= 2 },
          { pos: "right-0",   unlocked: s >= 3 },
        ].map(({ pos, unlocked }, i) => (
          <div
            key={i}
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 flex items-center justify-center ${pos} ${i === 2 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{
              background: unlocked ? colors.bar : "#111118",
              borderColor: unlocked ? colors.bar : "rgba(136,136,160,0.3)",
              boxShadow: unlocked ? `0 0 10px ${colors.bar}aa` : "none",
              zIndex: 10,
            }}
          >
            {unlocked && <div className="h-1.5 w-1.5 rounded-full bg-white/80" />}
          </div>
        ))}
      </div>

      {/* Labels de cada stage */}
      <div className="grid grid-cols-3 text-center">
        {[{ kills: stage1, n: 1, unlocked: s >= 1 }, { kills: stage2, n: 2, unlocked: s >= 2 }, { kills: stage3, n: 3, unlocked: s >= 3 }].map((st) => (
          <div key={st.n}>
            <p className={`text-[10px] font-black ${st.unlocked ? "text-gold-400" : "text-ink-muted/40"}`}>{formatFull(st.kills)}</p>
            <p className={`text-[8px] uppercase tracking-wider ${st.unlocked ? "text-gold-500/60" : "text-ink-muted/30"}`}>Stage {st.n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Card de criatura ─── */
function BestiaryCard({ entry, delay }: { entry: BestiaryEntry; delay: number }) {
  const diff = entry.difficulty.toLowerCase();
  const colors = DIFF_COLOR[diff] ?? DIFF_COLOR.unknown;
  const isComplete = entry.currentStage === 3;
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="animate-fade-up group overflow-hidden rounded-2xl border border-night-700 bg-night-850 transition-all hover:-translate-y-0.5 hover:border-night-600 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hero */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-night-950/70">
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at center, ${colors.bar}, transparent 70%)` }} />
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.imageUrl} alt={entry.creatureName}
            className="relative z-10 h-20 w-20 object-contain transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)} />
        ) : (
          <div className="relative z-10 flex h-20 w-20 items-center justify-center text-night-700">
            <Swords className="h-8 w-8" />
          </div>
        )}
        {isComplete && (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-gold-500/90 px-2 py-0.5 text-[9px] font-black text-night-950">
            <CheckCircle2 className="h-2.5 w-2.5" /> Completo
          </div>
        )}
        {!isComplete && entry.killsNeeded > 0 && entry.killsNeeded <= Math.ceil(entry.nextTarget * 0.15) && (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-purple-500/90 px-2 py-0.5 text-[9px] font-black text-white animate-pulse">
            ⚡ Quase lá!
          </div>
        )}
        <span className="absolute left-3 top-3 z-20 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
          style={{ color: colors.text, background: colors.bg, borderColor: `${colors.bar}30` }}>
          {DIFF_LABEL[diff] ?? diff}
        </span>
      </div>

      {/* Corpo */}
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-black text-ink">{entry.creatureName}</p>
            <p className="mt-0.5 text-lg font-black text-ink">
              {formatFull(entry.totalKills)}&nbsp;
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">kills</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-black" style={{ color: isComplete ? "#d4a843" : colors.text }}>
              {STAGE_LABEL[entry.currentStage]}
            </p>
            <p className="text-[9px] text-ink-muted/60">{entry.stages.charmPoints} charm pts</p>
          </div>
        </div>

        <StageBar entry={entry} />

        {!isComplete && (
          <p className="text-center text-[10px] font-semibold text-ink-muted/60">
            faltam{" "}
            <span className="font-black" style={{ color: colors.text }}>{formatFull(entry.killsNeeded)}</span>
            {" "}kills para o próximo estágio
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Legenda premium 2×3 ─── */
const LEGEND_DATA = [
  { key: "harmless",    stages: "5 / 10 / 25",       pts: "1"   },
  { key: "trivial",     stages: "10 / 100 / 250",     pts: "5"   },
  { key: "easy",        stages: "25 / 250 / 500",     pts: "15"  },
  { key: "medium",      stages: "50 / 500 / 1.000",   pts: "25"  },
  { key: "hard",        stages: "100 / 1k / 2.5k",    pts: "50"  },
  { key: "challenging", stages: "200 / 2k / 5k",      pts: "100" },
];

function DifficultyLegend() {
  return (
    <div className="rounded-2xl border border-night-700/50 bg-night-900/20 p-5">
      <p className="mb-4 text-center text-[9px] font-black uppercase tracking-[0.22em] text-ink-muted/50">
        Estágios oficiais · kills necessários por dificuldade
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {LEGEND_DATA.map(({ key, stages, pts }) => {
          const c = DIFF_COLOR[key];
          return (
            <div key={key} className="rounded-xl border px-3 py-2.5 flex items-center gap-3"
              style={{ borderColor: `${c.bar}22`, background: c.bg }}>
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.bar, boxShadow: `0 0 8px ${c.bar}90` }} />
              <div className="min-w-0">
                <p className="text-[11px] font-black" style={{ color: c.text }}>{DIFF_LABEL[key]}</p>
                <p className="text-[9px] text-ink-muted/60 leading-relaxed">{stages} · {pts} pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tipo de filtros ─── */
type SortKey = "kills_desc" | "kills_asc" | "name_asc" | "stage_desc";
type DiffFilter = "all" | "harmless" | "trivial" | "easy" | "medium" | "hard" | "challenging";
type StageFilter = "all" | "0" | "1" | "2" | "3";

/* ─── View principal ─── */
export function BestiaryView() {
  const [entries, setEntries] = useState<BestiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("kills_desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/bestiary")
      .then((r) => r.json())
      .then((data) => setEntries(data.bestiary || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const processed = useMemo(() => {
    let result = [...entries];

    if (query.trim()) result = result.filter((e) => e.creatureName.toLowerCase().includes(query.toLowerCase()));
    if (diffFilter !== "all") result = result.filter((e) => e.difficulty.toLowerCase() === diffFilter);
    if (stageFilter !== "all") result = result.filter((e) => String(e.currentStage) === stageFilter);

    switch (sortKey) {
      case "kills_desc": result.sort((a, b) => b.totalKills - a.totalKills); break;
      case "kills_asc":  result.sort((a, b) => a.totalKills - b.totalKills); break;
      case "name_asc":   result.sort((a, b) => a.creatureName.localeCompare(b.creatureName)); break;
      case "stage_desc": result.sort((a, b) => b.currentStage - a.currentStage); break;
    }

    return result;
  }, [entries, query, diffFilter, stageFilter, sortKey]);

  const totalKills = entries.reduce((acc, e) => acc + e.totalKills, 0);
  const completed = entries.filter((e) => e.currentStage === 3).length;
  const mostKilled = entries.length > 0 ? entries.reduce((a, b) => a.totalKills > b.totalKills ? a : b) : null;
  const almostDone = entries.filter((e) => e.currentStage < 3 && e.killsNeeded <= Math.ceil(e.nextTarget * 0.15)).length;

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      {/* Header */}
      <header className="animate-fade-up text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 shadow-[0_0_40px_-8px_rgba(168,85,247,0.5)] text-white">
          <Trophy className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Seu <span className="text-purple-400">Bestiário</span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted max-w-md mx-auto">
            Progresso de abates e estágios oficiais de cada criatura do Tibia.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Swords} title="Bestiário vazio"
          message="Registre suas hunts para que as criaturas apareçam automaticamente aqui." />
      ) : (
        <>
          {/* Estatísticas */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 animate-fade-up">
            {[
              { label: "Criaturas",      value: entries.length,                       color: "text-ink" },
              { label: "Total Kills",    value: formatFull(totalKills),               color: "text-purple-400" },
              { label: "Completos",      value: completed,                            color: "text-gold-400" },
              { label: "Em progresso",   value: entries.length - completed,           color: "text-blue-400" },
              { label: "Quase lá!",      value: almostDone,                           color: "text-purple-300" },
              { label: "Mais caçada",    value: mostKilled?.creatureName ?? "—",      color: "text-ink" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-night-700 bg-night-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">{label}</p>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <DifficultyLegend />

          {/* Filtros */}
          <div className="animate-fade-up rounded-2xl border border-night-700/50 bg-night-900/30 p-4 space-y-4">
            {/* Linha 1: busca + botão de mostrar filtros */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 flex items-center gap-2 rounded-xl border border-night-700 bg-night-900/60 px-4 py-2.5">
                <Search className="h-4 w-4 text-ink-muted shrink-0" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar criatura..."
                  className="bg-transparent border-none outline-none text-sm text-ink w-full placeholder:text-ink-muted/30" />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  showFilters
                    ? "border-gold-500/40 bg-gold-500/10 text-gold-300"
                    : "border-night-700 bg-night-900/60 text-ink-muted hover:border-night-600 hover:text-ink"
                }`}
              >
                Filtros <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Linha 2+: filtros expansíveis */}
            {showFilters && (
              <div className="animate-fade-up grid gap-4 sm:grid-cols-3 border-t border-night-700/50 pt-4">
                {/* Dificuldade */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted/60">Dificuldade</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "harmless", "trivial", "easy", "medium", "hard", "challenging"] as DiffFilter[]).map((d) => {
                      const c = d === "all" ? null : DIFF_COLOR[d];
                      const active = diffFilter === d;
                      return (
                        <button key={d} type="button" onClick={() => setDiffFilter(d)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                            active ? "border-gold-500/45 bg-gold-500/15 text-gold-300" : "border-night-700 text-ink-muted hover:text-ink"
                          }`}
                          style={active && c ? { borderColor: `${c.bar}50`, background: c.bg, color: c.text } : undefined}
                        >
                          {d === "all" ? "Todos" : DIFF_LABEL[d]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Estágio */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted/60">Estágio atual</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "0", "1", "2", "3"] as StageFilter[]).map((s) => (
                      <button key={s} type="button" onClick={() => setStageFilter(s)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                          stageFilter === s
                            ? "border-gold-500/45 bg-gold-500/15 text-gold-300"
                            : "border-night-700 text-ink-muted hover:text-ink"
                        }`}
                      >
                        {s === "all" ? "Todos" : STAGE_LABEL[Number(s)]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ordenação */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted/60">Ordenar por</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { key: "kills_desc", label: "Mais kills" },
                      { key: "kills_asc",  label: "Menos kills" },
                      { key: "stage_desc", label: "Estágio" },
                      { key: "name_asc",   label: "Nome A-Z" },
                    ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => setSortKey(key)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                          sortKey === key
                            ? "border-gold-500/45 bg-gold-500/15 text-gold-300"
                            : "border-night-700 text-ink-muted hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contagem de resultados */}
            <p className="text-[10px] text-ink-muted/50 text-right">
              {processed.length} {processed.length === 1 ? "criatura" : "criaturas"} encontradas
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processed.map((entry, i) => (
              <BestiaryCard key={entry.id} entry={entry} delay={Math.min(i * 20, 500)} />
            ))}
          </div>

          {processed.length === 0 && (
            <div className="py-16 text-center text-sm text-ink-muted opacity-60">
              Nenhuma criatura encontrada com os filtros selecionados.
            </div>
          )}
        </>
      )}
    </div>
  );
}
