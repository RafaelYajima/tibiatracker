"use client";

import { useState } from "react";
import { CircleAlert, History, Plus, RefreshCw } from "lucide-react";
import { useHunts } from "@/hooks/useHunts";
import type { TimeFilter } from "@/lib/time";
import { TimeFilterPills } from "./TimeFilterPills";
import { CharacterFilter } from "./CharacterFilter";
import { HuntsTable } from "./HuntsTable";
import { EmptyState, GoldLink, OutlineButton, SectionCard, TableSkeleton } from "./ui";

const FILTER_PERIOD: Record<TimeFilter, string> = {
  today: "hoje",
  "7d": "nos últimos 7 dias",
  "30d": "nos últimos 30 dias",
  month: "neste mês",
  all: "no total",
};

export function HistoryView() {
  const [filter, setFilter] = useState<TimeFilter>("7d");
  const [characterId, setCharacterId] = useState("all");
  const { hunts, loading, error, refetch } = useHunts(filter, characterId);

  return (
    <div>
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">
            Boss Rotation
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Histórico{" "}
            <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">
              de Hunts
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {loading
              ? "Carregando sessões…"
              : `${hunts.length} ${hunts.length === 1 ? "hunt" : "hunts"} ${FILTER_PERIOD[filter]} · clique numa linha para ver os itens`}
          </p>
        </div>
        <GoldLink href="/new" className="shrink-0">
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Nova Hunt
        </GoldLink>
      </header>

      <div className="animate-fade-up mt-6 flex flex-col gap-3" style={{ animationDelay: "60ms" }}>
        <TimeFilterPills value={filter} onChange={setFilter} />
        <CharacterFilter value={characterId} onChange={setCharacterId} />
      </div>

      <div className="mt-6">
        {error ? (
          <SectionCard contentClassName="p-0">
            <EmptyState
              icon={CircleAlert}
              title="Falha ao carregar o histórico"
              message={error}
              action={
                <OutlineButton onClick={refetch}>
                  <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                </OutlineButton>
              }
            />
          </SectionCard>
        ) : loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <SectionCard
            title="Todas as Hunts"
            subtitle={`${hunts.length} ${hunts.length === 1 ? "sessão" : "sessões"} em ordem da mais recente`}
            icon={History}
            contentClassName="p-0"
            delay={120}
          >
            <HuntsTable hunts={hunts} expandable paginated pageSize={12} />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
