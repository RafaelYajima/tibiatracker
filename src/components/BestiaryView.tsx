"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Search, Swords, Trophy } from "lucide-react";
import type { BestiaryEntry } from "@/types";
import { formatFull } from "@/lib/format";
import { EmptyState } from "./ui";

const DIFF_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
  harmless:    { bg: "rgba(74,222,128,0.12)",  text: "#4ade80", bar: "#4ade80" },
  trivial:     { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", bar: "#60a5fa" },
  easy:        { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", bar: "#60a5fa" },
  medium:      { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", bar: "#fbbf24" },
  hard:        { bg: "rgba(249,115,22,0.12)",  text: "#f97316", bar: "#f97316" },
  challenging: { bg: "rgba(239,68,68,0.14)",   text: "#f87171", bar: "#f87171" },
  unknown:     { bg: "rgba(136,136,160,0.10)", text: "#8888a0", bar: "#8888a0" },
};

const DIFF_LABEL: Record<string, string> = {
  harmless: "Inofensivo", trivial: "Trivial", easy: "Fácil",
  medium: "Médio", hard: "Difícil", challenging: "Desafiador", unknown: "?",
};

const STAGE_LABEL = ["Bloqueado", "1º Estágio", "2º Estágio", "Completo"] as const;

/* ─── Barra de progresso com marcadores integrados ─── */
function StageBar({ entry }: { entry: BestiaryEntry }) {
  const diff = entry.difficulty.toLowerCase();
  const colors = DIFF_COLOR[diff] ?? DIFF_COLOR.unknown;
  const { stage1, stage2, stage3 } = entry.stages;
  const isComplete = entry.currentStage === 3;

  // Progresso total relativo ao stage3 (max)
  const totalProgress = Math.min(100, (entry.totalKills / stage3) * 100);
  // Posição dos marcadores (% do stage3)
  const mark1 = (stage1 / stage3) * 100;
  const mark2 = (stage2 / stage3) * 100;

  return (
    <div className="space-y-1">
      <div className="relative h-3 rounded-full bg-night-950/80 border border-night-700/60 overflow-hidden">
        {/* Barra de preenchimento */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
          style={{ width: `${totalProgress}%`, background: isComplete ? "#d4a843" : colors.bar }}
        />
        {/* Marcador Stage 1 */}
        <div
          className="absolute inset-y-0 w-px"
          style={{ left: `${mark1}%`, background: entry.currentStage >= 1 ? `${colors.bar}` : "rgba(136,136,160,0.4)" }}
        />
        {/* Marcador Stage 2 */}
        <div
          className="absolute inset-y-0 w-px"
          style={{ left: `${mark2}%`, background: entry.currentStage >= 2 ? `${colors.bar}` : "rgba(136,136,160,0.4)" }}
        />
      </div>
      {/* Labels dos 3 marcadores */}
      <div className="relative flex text-[8px] font-bold">
        <span className="absolute" style={{ left: `${mark1}%`, transform: "translateX(-50%)", color: entry.currentStage >= 1 ? colors.text : "#8888a060" }}>
          {formatFull(stage1)}
        </span>
        <span className="absolute" style={{ left: `${mark2}%`, transform: "translateX(-50%)", color: entry.currentStage >= 2 ? colors.text : "#8888a060" }}>
          {formatFull(stage2)}
        </span>
        <span className="absolute right-0" style={{ color: entry.currentStage >= 3 ? "#d4a843" : "#8888a060" }}>
          {formatFull(stage3)}
        </span>
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
      className="animate-fade-up group overflow-hidden rounded-2xl border border-night-700 bg-night-850 transition-all hover:-translate-y-1 hover:border-night-600 hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hero banner */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-night-950/70">
        <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(ellipse at center, ${colors.bar}, transparent 70%)` }} />
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.imageUrl} alt={entry.creatureName} className="relative z-10 h-20 w-20 object-contain transition-transform duration-500 group-hover:scale-110" onError={() => setImgError(true)} />
        ) : (
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-night-700 bg-night-900/60 text-ink-muted">
            <Swords className="h-8 w-8 opacity-30" />
          </div>
        )}
        {isComplete && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gold-500/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-night-950 z-20">
            <CheckCircle2 className="h-2.5 w-2.5" /> Completo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider z-20" style={{ color: colors.text, background: colors.bg, border: `1px solid ${colors.bar}33` }}>
          {DIFF_LABEL[diff] ?? diff}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-black text-ink leading-tight">{entry.creatureName}</p>
            <p className="mt-0.5 text-lg font-black text-ink">{formatFull(entry.totalKills)} <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">kills</span></p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-black" style={{ color: isComplete ? "#d4a843" : colors.text }}>
              {STAGE_LABEL[entry.currentStage]}
            </p>
            <p className="text-[9px] text-ink-muted/60">{entry.stages.charmPoints} charm pts</p>
          </div>
        </div>

        {/* Barra com marcadores */}
        <StageBar entry={entry} />

        {/* Info de faltam X kills */}
        {!isComplete && (
          <p className="text-center text-[10px] font-bold text-ink-muted/70">
            faltam <span style={{ color: colors.text }}>{formatFull(entry.killsNeeded)}</span> kills para o próximo estágio
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Legenda de dificuldades ─── */
const LEGEND_DATA = [
  { key: "harmless", stages: "5 / 10 / 25", pts: "1" },
  { key: "trivial", stages: "10 / 100 / 250", pts: "5" },
  { key: "easy", stages: "25 / 250 / 500", pts: "15" },
  { key: "medium", stages: "50 / 500 / 1k", pts: "25" },
  { key: "hard", stages: "100 / 1k / 2.5k", pts: "50" },
  { key: "challenging", stages: "200 / 2k / 5k", pts: "100" },
];

function DifficultyLegend() {
  return (
    <div className="animate-fade-up rounded-2xl border border-night-700/50 bg-night-900/30 p-5">
      <p className="text-center text-[9px] font-black uppercase tracking-widest text-ink-muted/50 mb-4">
        Tabela de Dificuldades · Estágios Oficiais do Tibia
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LEGEND_DATA.map(({ key, stages, pts }) => {
          const c = DIFF_COLOR[key];
          return (
            <div key={key} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: `${c.bar}25`, background: `${c.bg}` }}>
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.bar, boxShadow: `0 0 8px ${c.bar}80` }} />
              <div className="min-w-0">
                <p className="text-[11px] font-black" style={{ color: c.text }}>{DIFF_LABEL[key]}</p>
                <p className="text-[9px] text-ink-muted/60 leading-tight">{stages} · {pts} pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── View principal ─── */
export function BestiaryView() {
  const [entries, setEntries] = useState<BestiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/bestiary")
      .then((r) => r.json())
      .then((data) => setEntries(data.bestiary || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => entries.filter((e) => e.creatureName.toLowerCase().includes(query.toLowerCase())),
    [entries, query],
  );

  const totalKills = entries.reduce((acc, e) => acc + e.totalKills, 0);
  const completed = entries.filter((e) => e.currentStage === 3).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 shadow-[0_0_40px_-8px_rgba(168,85,247,0.5)] text-white">
          <Trophy className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Seu <span className="text-purple-400">Bestiário</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-lg mx-auto">
            Progresso de abates seguindo os estágios oficiais do Bestiary do Tibia.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Swords} title="Bestiário vazio" message="Registre suas hunts para que as criaturas apareçam aqui automaticamente." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4 animate-fade-up">
            <div className="rounded-2xl border border-night-700 bg-night-900/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">Criaturas</p>
              <p className="text-2xl font-black text-ink">{entries.length}</p>
            </div>
            <div className="rounded-2xl border border-night-700 bg-night-900/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">Total de Kills</p>
              <p className="text-2xl font-black text-purple-400">{formatFull(totalKills)}</p>
            </div>
            <div className="rounded-2xl border border-night-700 bg-night-900/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">Completos</p>
              <p className="text-2xl font-black text-gold-400">{completed}</p>
            </div>
            <div className="relative flex items-center gap-2 p-5 rounded-2xl border border-night-700 bg-night-900/40">
              <Search className="h-4 w-4 text-ink-muted shrink-0" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar criatura..." className="bg-transparent border-none outline-none text-sm text-ink w-full placeholder:text-ink-muted/30" />
            </div>
          </div>

          {/* Legenda de dificuldades — grade 2×3 centralizada */}
          <DifficultyLegend />

          {/* Grid de criaturas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((entry, i) => (
              <BestiaryCard key={entry.id} entry={entry} delay={Math.min(i * 25, 600)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
