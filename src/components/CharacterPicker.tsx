"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Plus, Users } from "lucide-react";
import { useCharacters } from "@/hooks/useCharacters";
import { getVocationMeta } from "@/lib/vocations";
import { AddCharacterForm } from "./AddCharacterForm";

const LAST_CHAR_KEY = "tibiatracker:last-char";

/**
 * Seletor de personagem para vincular a hunt a um boneco.
 * Lembra a última escolha no localStorage e permite cadastrar um novo inline.
 */
export function CharacterPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { characters, loading, addCharacter } = useCharacters();
  const [adding, setAdding] = useState(false);

  // Restaura o último personagem utilizado
  useEffect(() => {
    if (value || characters.length === 0) return;
    try {
      const saved = localStorage.getItem(LAST_CHAR_KEY);
      if (saved && characters.some((c) => c.id === saved)) onChange(saved);
    } catch {
      /* localStorage indisponível */
    }
  }, [characters, value, onChange]);

  // Persiste a escolha
  useEffect(() => {
    if (!value) return;
    try {
      localStorage.setItem(LAST_CHAR_KEY, value);
    } catch {
      /* localStorage indisponível */
    }
  }, [value]);

  if (loading) {
    return (
      <div className="grid animate-pulse gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-[68px] rounded-xl bg-night-750/70" />
        ))}
      </div>
    );
  }

  // Nenhum personagem ainda: vai direto pro formulário de cadastro
  if (characters.length === 0) {
    return (
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs leading-relaxed text-ink-muted">
          <Users className="h-4 w-4 shrink-0 text-gold-400" />
          Nenhum boneco cadastrado ainda. Busque pelo nome exato — puxamos level, vocação e mundo
          direto da TibiaData API.
        </p>
        <AddCharacterForm
          compact
          onAdded={(character) => {
            addCharacter(character);
            onChange(character.id);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {characters.map((character) => {
          const meta = getVocationMeta(character.vocation);
          const Icon = meta.icon;
          const selected = value === character.id;
          return (
            <button
              key={character.id}
              type="button"
              onClick={() => onChange(selected ? null : character.id)}
              aria-pressed={selected}
              className={`group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                selected
                  ? "bg-night-800 shadow-[inset_0_0_24px_rgba(212,168,67,0.06)]"
                  : "border-night-700 bg-night-900/50 hover:border-night-600 hover:bg-night-800/70"
              }`}
              style={selected ? { borderColor: `${meta.color}88` } : undefined}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: `${meta.color}1a`,
                  borderColor: `${meta.color}44`,
                  color: meta.color,
                }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{character.name}</span>
                <span className="mt-0.5 block truncate text-[10px] text-ink-muted">
                  Lvl {character.level} · {character.vocation ?? "—"} · {character.world ?? "—"}
                </span>
              </span>
              <span
                className={`flex h-5.5 w-5.5 h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                  selected ? "border-transparent text-night-950" : "border-night-600 text-transparent"
                }`}
                style={selected ? { backgroundColor: meta.color } : undefined}
              >
                <Check className="h-3 w-3" strokeWidth={3.2} />
              </span>
            </button>
          );
        })}
      </div>

      {adding ? (
        <div className="animate-fade-up mt-3 rounded-xl border border-night-700 bg-night-900/50 p-3.5">
          <AddCharacterForm
            compact
            onAdded={(character) => {
              addCharacter(character);
              onChange(character.id);
              setAdding(false);
            }}
          />
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 transition-colors hover:text-gold-300"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} /> Adicionar novo boneco
          </button>
          <Link
            href="/characters"
            className="text-[11px] font-semibold text-ink-muted transition-colors hover:text-gold-300"
          >
            Gerenciar personagens →
          </Link>
        </div>
      )}
    </div>
  );
}
