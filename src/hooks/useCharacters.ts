"use client";

import { useCallback, useEffect, useState } from "react";
import type { Character, CharacterWithStats } from "@/types";

interface UseCharactersResult {
  characters: CharacterWithStats[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addCharacter: (character: CharacterWithStats) => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (character: Character) => void;
}

/** Lista os personagens cadastrados (com agregados de hunts). */
export function useCharacters(): UseCharactersResult {
  const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { characters: CharacterWithStats[] };
      setCharacters(data.characters ?? []);
    } catch (err) {
      console.error("[useCharacters]", err);
      setError("Não foi possível carregar os personagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const addCharacter = useCallback((character: CharacterWithStats) => {
    setCharacters((prev) => [...prev, character].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const removeCharacter = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCharacter = useCallback((character: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === character.id ? { ...c, ...character } : c)));
  }, []);

  return { characters, loading, error, refetch: fetchCharacters, addCharacter, removeCharacter, updateCharacter };
}
