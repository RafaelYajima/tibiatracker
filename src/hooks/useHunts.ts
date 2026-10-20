"use client";

import { useCallback, useEffect, useState } from "react";
import type { HuntWithItems } from "@/types";
import type { TimeFilter } from "@/lib/time";

interface UseHuntsResult {
  hunts: HuntWithItems[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Busca hunts na API aplicando filtro de tempo e, opcionalmente,
 * filtro de personagem ("all" ou id). Ambos resolvidos no servidor.
 */
export function useHunts(filter: TimeFilter, characterId: string = "all"): UseHuntsResult {
  const [hunts, setHunts] = useState<HuntWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHunts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ filter, character: characterId });
      const res = await fetch(`/api/hunts?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { hunts: HuntWithItems[] };
      setHunts(data.hunts ?? []);
    } catch (err) {
      console.error("[useHunts]", err);
      setError("Não foi possível carregar as hunts.");
    } finally {
      setLoading(false);
    }
  }, [filter, characterId]);

  useEffect(() => {
    fetchHunts();
  }, [fetchHunts]);

  return { hunts, loading, error, refetch: fetchHunts };
}
