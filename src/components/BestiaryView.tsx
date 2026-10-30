"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Swords, Trophy } from "lucide-react";
import type { BestiaryEntry } from "@/types";
import { getBestiaryProgress } from "@/lib/bestiary";
import { formatFull } from "@/lib/format";
import { EmptyState } from "./ui";

const OCCURRENCE_COLOR: Record<string, string> = {
  Common: "#4ade80",
  Uncommon: "#60a5fa",
  Rare: "#c084fc",
  "Very Rare": "#f0d078",
  Unknown: "#8888a0",
};

function BestiaryCard({ entry, delay }: { entry: BestiaryEntry; delay: number }) {
  const progress = getBestiaryProgress(entry.totalKills, entry.thresholds);
  const color = OCCURRENCE_COLOR[entry.occurrence] ?? OCCURRENCE_COLOR.Unknown;

  return (
    <div
      className="animate-fade-up rounded-2xl border border-night-700 bg-night-850 p-4 transition-all hover:-translate-y-0.5 hover:border-night-600 hover:bg-night-800/80"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-night-700 bg-night-950/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.imageUrl}
            alt={entry.creatureName}
            className="h-12 w-12 object-contain"
            onError={(e) => {
              const img = e.currentTarget;
              // fallback elegante: usa o próprio nome da criatura em PNG, depois interrogação
              if (!img.dataset.fallbackStep) {
                img.dataset.fallbackStep = "1";
                img.src = `https://tibia.fandom.com/wiki/Special:FilePath/${encodeURIComponent(entry.creatureName)}.png`;
              } else {
                img.src = "https://tibia.fandom.com/wiki/Special:FilePath/Question_Mark.gif";
              }
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{entry.creatureName}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
              style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
            >
              {entry.occurrence}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ink-muted/70">{entry.difficulty}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black" style={{ color }}>{formatFull(entry.totalKills)}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-muted/60">kills</p>
        </div>
      </div>

      {/* Barra estilo Tibia */}
      <div className="mt-4 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-night-950/80 border border-night-700/80">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold text-ink-muted/70">
          <span>{entry.thresholds[0]}</span>
          <span>{entry.thresholds[1]}</span>
          <span>{entry.thresholds[2]}</span>
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
            Acompanhe sua contagem acumulada de criaturas mortas em todas as hunts registradas.
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
          <div className="grid gap-4 sm:grid-cols-3 animate-fade-up">
            <div className="rounded-2xl border border-night-700 bg-night-900/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">Criaturas Descobertas</p>
              <p className="text-2xl font-black text-ink">{entries.length}</p>
            </div>
            <div className="rounded-2xl border border-night-700 bg-night-900/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-1">Total de Abates</p>
              <p className="text-2xl font-black text-purple-400">{formatFull(totalKills)}</p>
            </div>
            <div className="relative flex items-center gap-2 p-5 rounded-2xl border border-night-700 bg-night-900/40">
              <Search className="h-4 w-4 text-ink-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar por criatura..."
                className="bg-transparent border-none outline-none text-sm text-ink w-full placeholder:text-ink-muted/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entry, i) => (
              <BestiaryCard key={entry.id} entry={entry} delay={i * 30} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
