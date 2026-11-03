"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Shield,
  Swords,
} from "lucide-react";
import { EmptyState } from "./ui";

interface HuntingPlace {
  id: number;
  name: string;
  city: string;
  vocation: string;
  wikiUrl: string;
}

const VOCATIONS = ["All", "Knight", "Paladin", "Druid", "Sorcerer"];

export function HuntGuideView() {
  const [places, setPlaces] = useState<HuntingPlace[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [vocFilter, setVocFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  async function fetchPlaces() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (cityFilter) params.set("city", cityFilter);
      if (vocFilter !== "all") params.set("vocation", vocFilter);

      const res = await fetch(`/api/hunting-places?${params.toString()}`);
      const data = await res.json();
      setPlaces(data.places ?? []);
      setTotal(data.total ?? 0);
      if (data.cities) setCities(data.cities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlaces();
  }, [vocFilter, cityFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPlaces();
  }

  function parseVocations(raw: string): string[] {
    const lower = raw.toLowerCase();
    if (lower.includes("all")) return ["All"];
    const vocs: string[] = [];
    if (lower.includes("knight")) vocs.push("Knight");
    if (lower.includes("paladin")) vocs.push("Paladin");
    if (lower.includes("druid")) vocs.push("Druid");
    if (lower.includes("sorcerer")) vocs.push("Sorcerer");
    return vocs.length > 0 ? vocs : ["All"];
  }

  const VOC_COLOR: Record<string, string> = {
    All: "text-ink-muted border-night-700 bg-night-800",
    Knight: "text-blue-400 border-blue-500/25 bg-blue-500/10",
    Paladin: "text-green-400 border-green-500/25 bg-green-500/10",
    Druid: "text-cyan-400 border-cyan-500/25 bg-cyan-500/10",
    Sorcerer: "text-red-400 border-red-500/25 bg-red-500/10",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-teal-600 shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)] text-white">
          <Compass className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Guia de <span className="text-green-400">Hunts</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-lg mx-auto">
            {total} locais de caça catalogados do TibiaWiki. Filtre por vocação, cidade ou busque diretamente.
          </p>
        </div>
      </header>

      {/* Barra de Busca e Filtros */}
      <div className="animate-fade-up rounded-2xl border border-night-700/50 bg-night-900/30 p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1 flex items-center gap-2 rounded-xl border border-night-700 bg-night-900/60 px-4 py-2.5">
            <Search className="h-4 w-4 text-ink-muted shrink-0" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar local de caça..."
              className="bg-transparent border-none outline-none text-sm text-ink w-full placeholder:text-ink-muted/30" />
          </div>
          <button type="submit" className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-bold text-green-400 transition-all hover:bg-green-500/20">
            Buscar
          </button>
          <button type="button" onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
              showFilters ? "border-gold-500/40 bg-gold-500/10 text-gold-300" : "border-night-700 bg-night-900/60 text-ink-muted hover:text-ink"
            }`}>
            Filtros <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </form>

        {showFilters && (
          <div className="animate-fade-up grid gap-4 sm:grid-cols-2 border-t border-night-700/50 pt-4">
            {/* Vocação */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted/60">Vocação</p>
              <div className="flex flex-wrap gap-1.5">
                {["all", ...VOCATIONS.slice(1).map((v) => v.toLowerCase())].map((v) => (
                  <button key={v} type="button" onClick={() => setVocFilter(v)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all ${
                      vocFilter === v ? "border-gold-500/45 bg-gold-500/15 text-gold-300" : "border-night-700 text-ink-muted hover:text-ink"
                    }`}>
                    {v === "all" ? "Todas" : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Cidade */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted/60">Cidade</p>
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                className="w-full rounded-xl border border-night-700 bg-night-900/60 px-4 py-2.5 text-sm text-ink focus:border-gold-500/50 focus:outline-none">
                <option value="">Todas as cidades</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-400" />
        </div>
      ) : places.length === 0 ? (
        <EmptyState icon={Compass} title="Nenhum local encontrado" message="Tente ajustar os filtros ou termos de busca." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place, i) => {
            const vocs = parseVocations(place.vocation);
            return (
              <a
                key={place.id}
                href={place.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-fade-up group rounded-2xl border border-night-700 bg-night-850 p-5 transition-all hover:-translate-y-0.5 hover:border-green-500/30 hover:shadow-lg"
                style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-ink group-hover:text-green-400 transition-colors truncate">{place.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-ink-muted">
                      <MapPin className="h-3 w-3 shrink-0" /> {place.city}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted/30 group-hover:text-green-400/70 transition-colors mt-0.5" />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vocs.map((v) => (
                    <span key={v} className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${VOC_COLOR[v] ?? VOC_COLOR.All}`}>
                      {v}
                    </span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {!loading && places.length > 0 && (
        <p className="text-center text-[10px] text-ink-muted/50">
          Mostrando {places.length} de {total} locais · Dados do TibiaWiki
        </p>
      )}
    </div>
  );
}
