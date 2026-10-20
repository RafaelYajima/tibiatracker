"use client";

import { Users } from "lucide-react";
import { useCharacters } from "@/hooks/useCharacters";
import { getVocationMeta } from "@/lib/vocations";

/**
 * Pills de filtro por personagem ("Todos" + cada boneco cadastrado).
 * Some automaticamente quando não há personagens cadastrados.
 */
export function CharacterFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { characters } = useCharacters();

  if (characters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtro de personagem">
      <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        <Users className="h-3.5 w-3.5 text-gold-500/80" /> Char
      </span>
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
          value === "all"
            ? "border-gold-500/45 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_-4px_rgba(212,168,67,0.45)]"
            : "border-night-700 bg-night-850 text-ink-muted hover:border-night-600 hover:bg-night-800 hover:text-ink"
        }`}
      >
        Todos
      </button>
      {characters.map((character) => {
        const meta = getVocationMeta(character.vocation);
        const active = value === character.id;
        return (
          <button
            key={character.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(character.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              active
                ? "border-gold-500/45 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_-4px_rgba(212,168,67,0.45)]"
                : "border-night-700 bg-night-850 text-ink-muted hover:border-night-600 hover:bg-night-800 hover:text-ink"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: meta.color, boxShadow: active ? `0 0 8px ${meta.color}` : "none" }}
            />
            {character.name}
          </button>
        );
      })}
    </div>
  );
}
