"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Search, Swords, Trophy } from "lucide-react";
import type { BestiaryEntry } from "@/types";
import { formatFull } from "@/lib/format";
import { EmptyState } from "./ui";

/* ─── cores de dificuldade ─── */
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
  harmless:    "Inofensivo",
  trivial:     "Trivial",
  easy:        "Fácil",
  medium:      "Médio",
  hard:        "Difícil",
  challenging: "Desafiador",
  unknown:     "Desconhecido",
};

const STAGE_LABEL = ["Bloqueado", "1º Estágio", "2º Estágio", "Completo"] as const;

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
      {/* ── Imagem como hero banner ── */}
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-night-950/70">
        {/* Fundo gradiente baseado na dificuldade */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(ellipse at center, ${colors.bar}, transparent 70%)` }}
        />
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageUrl}
            alt={entry.creatureName}
            className="relative z-10 h-20 w-20 object-contain transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-night-700 bg-night-900/60 text-ink-muted">
            <Swords className="h-8 w-8 opacity-30" />
          </div>
        )}
        {/* Estágio completo badge */}
        {isComplete && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gold-500/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-night-950 z-20">
            <CheckCircle2 className="h-2.5 w-2.5" /> Completo
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-base font-black text-ink leading-tight">{entry.creatureName}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.text }}>
            {DIFF_LABEL[diff] ?? diff}
          </p>
        </div>

        {/* Kills e estágio atual */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-xl font-black text-ink">{formatFull(entry.totalKills)}</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-muted/60">kills totais</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black" style={{ color: isComplete ? "#d4a843" : colors.text }}>
              {STAGE_LABEL[entry.currentStage]}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-ink-muted/60">
              {entry.stages.charmPoints} charm pts
            </p>
          </div>
        </div>

        {/* Barra de progresso horizontal estilo Tibia */}
        {!isComplete && (
          <div className="space-y-1.5">
            <div className="relative h-2.5 overflow-hidden rounded-full bg-night-950/80 border border-night-700/80">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${entry.stagePercent}%`, background: colors.bar }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-ink-muted/60">
              <span>{entry.currentStage === 0 ? 0 : entry.currentStage === 1 ? entry.stages.stage1 : entry.stages.stage2}</span>
              <span className="text-ink-muted/80">faltam {formatFull(entry.killsNeeded)} kills</span>
              <span>{entry.nextTarget}</span>
            </div>
          </div>
        )}

        {/* Thresholds dos 3 estágios */}
        <div className="grid grid-cols-3 gap-1 border-t border-night-700/50 pt-3">
          {([
            { n: 1, kills: entry.stages.stage1, unlocked: entry.currentStage >= 1 },
            { n: 2, kills: entry.stages.stage2, unlocked: entry.currentStage >= 2 },
            { n: 3, kills: entry.stages.stage3, unlocked: entry.currentStage >= 3 },
          ]).map(({ n, kills, unlocked }) => (
            <div key={n} className="text-center">
              <p
                className={`text-[10px] font-black ${unlocked ? "text-gold-400" : "text-ink-muted/50"}`}
              >
                {formatFull(kills)}
              </p>
              <p className={`text-[8px] uppercase tracking-wider ${unlocked ? "text-gold-500/70" : "text-ink-muted/40"}`}>
                Stage {n}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
            Acompanhe seu progresso de abates e desbloqueio de estágios de cada criatura.
            A barra de progresso segue os estágios oficiais do Bestiary do Tibia.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
          <p className="mt-3 text-sm text-ink-muted">Abrindo pergaminhos de abates…</p>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="Bestiário vazio"
          message="Comece a registrar suas hunts para que as criaturas mortas apareçam automaticamente aqui."
        />
      ) : (
        <>
          {/* Stats + Search */}
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
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar criatura..."
                className="bg-transparent border-none outline-none text-sm text-ink w-full placeholder:text-ink-muted/30"
              />
            </div>
          </div>

          {/* Legenda de dificuldades */}
          <div className="animate-fade-up flex flex-wrap gap-2 rounded-2xl border border-night-700/50 bg-night-900/30 p-4">
            <p className="mr-2 self-center text-[9px] font-black uppercase tracking-widest text-ink-muted/60">Dificuldade:</p>
            {[
              { key: "harmless", stages: "5 / 10 / 25", pts: "1" },
              { key: "trivial",  stages: "10 / 100 / 250", pts: "5" },
              { key: "easy",     stages: "25 / 250 / 500", pts: "15" },
              { key: "medium",   stages: "50 / 500 / 1.000", pts: "25" },
              { key: "hard",     stages: "100 / 1.000 / 2.500", pts: "50" },
              { key: "challenging", stages: "200 / 2.000 / 5.000", pts: "100" },
            ].map(({ key, stages, pts }) => {
              const c = DIFF_COLOR[key];
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px]"
                  style={{ borderColor: `${c.bar}30`, background: c.bg }}
                >
                  <span className="font-black" style={{ color: c.text }}>{DIFF_LABEL[key]}</span>
                  <span className="text-ink-muted/60">{stages} kills · {pts} charm pts</span>
                </div>
              );
            })}
          </div>

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
