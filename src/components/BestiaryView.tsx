"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Search, Shield, Swords, Trophy } from "lucide-react";
import type { BestiaryEntry } from "@/types";
import { formatFull } from "@/lib/format";
import { EmptyState } from "./ui";

const DIFF_COLOR: Record<string, { bg: string; text: string; bar: string; soft: string }> = {
  harmless:    { bg: "rgba(74,222,128,0.12)",  text: "#4ade80", bar: "#4ade80", soft: "rgba(74,222,128,0.18)" },
  trivial:     { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", bar: "#60a5fa", soft: "rgba(96,165,250,0.18)" },
  easy:        { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", bar: "#60a5fa", soft: "rgba(96,165,250,0.18)" },
  medium:      { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", bar: "#fbbf24", soft: "rgba(251,191,36,0.18)" },
  hard:        { bg: "rgba(249,115,22,0.12)",  text: "#f97316", bar: "#f97316", soft: "rgba(249,115,22,0.18)" },
  challenging: { bg: "rgba(239,68,68,0.14)",   text: "#f87171", bar: "#f87171", soft: "rgba(239,68,68,0.18)" },
  unknown:     { bg: "rgba(136,136,160,0.10)", text: "#8888a0", bar: "#8888a0", soft: "rgba(136,136,160,0.18)" },
};

const DIFF_LABEL: Record<string, string> = {
  harmless: "Inofensivo",
  trivial: "Trivial",
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  challenging: "Desafiador",
  unknown: "Desconhecido",
};

const STAGE_LABEL = ["Bloqueado", "1º Estágio", "2º Estágio", "Completo"] as const;

/* ─────────────────────────── Barra em 3 partes iguais ─────────────────────────── */
function StageBar({ entry }: { entry: BestiaryEntry }) {
  const diff = entry.difficulty.toLowerCase();
  const colors = DIFF_COLOR[diff] ?? DIFF_COLOR.unknown;

  const { stage1, stage2, stage3 } = entry.stages;
  const stage = entry.currentStage;

  // Em vez de proporcional à quantidade, agora a barra é dividida em 3 blocos iguais:
  // [0%-33%] -> estágio 1
  // [33%-66%] -> estágio 2
  // [66%-100%] -> estágio 3
  let progressWidth = 0;
  if (stage === 0) {
    progressWidth = Math.min(33, (entry.totalKills / stage1) * 33);
  } else if (stage === 1) {
    progressWidth = 33 + Math.min(33, ((entry.totalKills - stage1) / (stage2 - stage1)) * 33);
  } else if (stage === 2) {
    progressWidth = 66 + Math.min(34, ((entry.totalKills - stage2) / (stage3 - stage2)) * 34);
  } else {
    progressWidth = 100;
  }

  return (
    <div className="space-y-2">
      {/* Barra segmentada */}
      <div className="relative h-4 overflow-hidden rounded-full border border-night-700/80 bg-night-950/90">
        {/* preenchimento */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
          style={{ width: `${progressWidth}%`, background: colors.bar }}
        />

        {/* divisões fortes visuais */}
        <div className="absolute inset-y-0 left-1/3 w-px bg-night-700/90" />
        <div className="absolute inset-y-0 left-2/3 w-px bg-night-700/90" />

        {/* marcadores circulares maiores */}
        {[33.333, 66.666, 100].map((pos, index) => {
          const unlocked = stage >= index + 1;
          const leftClass = pos === 100 ? "right-0 translate-x-0" : pos === 66.666 ? "left-2/3 -translate-x-1/2" : "left-1/3 -translate-x-1/2";
          return (
            <div
              key={index}
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 ${leftClass}`}
              style={{
                background: unlocked ? colors.bar : "#0f0f14",
                borderColor: unlocked ? colors.bar : "rgba(136,136,160,0.35)",
                boxShadow: unlocked ? `0 0 12px ${colors.bar}` : "none",
              }}
            />
          );
        })}
      </div>

      {/* labels abaixo */}
      <div className="grid grid-cols-3 gap-1 text-center">
        {[
          { label: `Stage 1`, kills: stage1, active: stage >= 1 },
          { label: `Stage 2`, kills: stage2, active: stage >= 2 },
          { label: `Stage 3`, kills: stage >= 3 ? stage3 : stage3, active: stage >= 3 },
        ].map((s) => (
          <div key={s.label} className="space-y-0.5">
            <p className={`text-[10px] font-black ${s.active ? "text-gold-400" : "text-ink-muted/55"}`}>{formatFull(s.kills)}</p>
            <p className={`text-[8px] uppercase tracking-wider ${s.active ? "text-gold-500/70" : "text-ink-muted/35"}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {isComplete && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gold-500/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-night-950 z-20">
            <CheckCircle2 className="h-2.5 w-2.5" /> Completo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider z-20" style={{ color: colors.text, background: colors.bg, border: `1px solid ${colors.bar}33` }}>
          {DIFF_LABEL[diff] ?? diff}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-black text-ink leading-tight">{entry.creatureName}</p>
            <p className="mt-1 text-lg font-black text-ink">
              {formatFull(entry.totalKills)} <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">kills</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-black" style={{ color: isComplete ? "#d4a843" : colors.text }}>
              {STAGE_LABEL[entry.currentStage]}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-ink-muted/60">{entry.stages.charmPoints} pts</p>
          </div>
        </div>

        <StageBar entry={entry} />

        {!isComplete && (
          <div className="rounded-xl border border-night-700/40 bg-night-900/40 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-ink-muted/70">
              faltam <span style={{ color: colors.text }}>{formatFull(entry.killsNeeded)}</span> kills para o próximo estágio
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Legenda superior premium ─── */
const LEGEND_DATA = [
  { key: "harmless", stages: "5 / 10 / 25", pts: "1 charm" },
  { key: "trivial", stages: "10 / 100 / 250", pts: "5 charms" },
  { key: "easy", stages: "25 / 250 / 500", pts: "15 charms" },
  { key: "medium", stages: "50 / 500 / 1k", pts: "25 charms" },
  { key: "hard", stages: "100 / 1k / 2.5k", pts: "50 charms" },
  { key: "challenging", stages: "200 / 2k / 5k", pts: "100 charms" },
];

function DifficultyLegend() {
  return (
    <div className="animate-fade-up rounded-2xl border border-night-700/50 bg-gradient-to-b from-night-900/40 to-night-900/20 p-5">
      <div className="mb-5 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-ink-muted/50">Referência rápida do Bestiário</p>
        <p className="mt-1 text-sm font-bold text-ink-muted/80">Cada dificuldade possui metas oficiais de kills e recompensa em charm points</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {LEGEND_DATA.map(({ key, stages, pts }) => {
          const c = DIFF_COLOR[key];
          return (
            <div
              key={key}
              className="rounded-xl border p-4 transition-all hover:-translate-y-0.5"
              style={{ borderColor: `${c.bar}25`, background: c.bg }}
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: c.bar, boxShadow: `0 0 10px ${c.bar}80` }} />
                <div>
                  <p className="text-sm font-black" style={{ color: c.text }}>{DIFF_LABEL[key]}</p>
                  <p className="text-[10px] text-ink-muted/70">Stages: {stages}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-night-700/30 bg-night-900/40 px-3 py-2 text-[10px] font-bold text-ink-muted/80">
                recompensa: <span className="text-gold-400">{pts}</span>
              </div>
            </div>
          );
        })}
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
            Progresso de abates e desbloqueio de estágios oficiais de cada criatura.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Swords} title="Bestiário vazio" message="Registre suas hunts para que as criaturas apareçam automaticamente aqui." />
      ) : (
        <>
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

          <DifficultyLegend />

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
