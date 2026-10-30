"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Sparkles, Swords, Trophy } from "lucide-react";
import type { BestiaryEntry } from "@/types";
import { SectionCard, EmptyState } from "./ui";
import { formatFull } from "@/lib/format";

export function BestiaryView() {
  const [entries, setEntries] = useState<BestiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/bestiary")
      .then(r => r.json())
      .then(data => setEntries(data.bestiary || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => 
    e.creatureName.toLowerCase().includes(query.toLowerCase())
  );

  const totalKills = entries.reduce((acc, e) => acc + e.totalKills, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Centralizado */}
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 shadow-[0_0_40px_-8px_rgba(168,85,247,0.5)] text-white">
          <Trophy className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Seu <span className="text-purple-400">Bestiário</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-lg mx-auto">
            Acompanhe sua contagem acumulada de abates através de todos os registros salvos.
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
          title="Bestiário Vazio" 
          message="Comece a registrar suas hunts para que as criaturas mortas apareçam aqui automaticamente." 
        />
      ) : (
        <>
          {/* Stats de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
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
                onChange={e => setQuery(e.target.value)}
                placeholder="Filtrar por nome..."
                className="bg-transparent border-none outline-none text-sm text-ink w-full placeholder:text-ink-muted/30"
              />
            </div>
          </div>

          {/* Grid de Criaturas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((entry, i) => (
              <div 
                key={entry.id} 
                className="animate-fade-up group relative flex flex-col items-center gap-4 rounded-2xl border border-night-700 bg-night-850 p-6 transition-all hover:-translate-y-1 hover:border-purple-500/30 hover:bg-night-800 shadow-lg"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-night-950/50 border border-night-700 overflow-hidden group-hover:border-purple-500/20 transition-colors">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                    src={entry.imageUrl} 
                    alt={entry.creatureName}
                    className="max-h-16 max-w-16 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://tibia.fandom.com/wiki/Special:FilePath/Question_Mark.gif';
                    }}
                   />
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="truncate text-sm font-black text-ink group-hover:text-purple-300 transition-colors">{entry.creatureName}</p>
                  <p className="mt-1 text-[10px] font-bold text-ink-muted uppercase tracking-widest bg-night-900 rounded-full px-2 py-0.5 inline-block border border-night-700">
                    {formatFull(entry.totalKills)} Kills
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
