"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CircleAlert,
  Coins,
  Gem,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Swords,
  TrendingUp,
} from "lucide-react";
import { useHunts } from "@/hooks/useHunts";
import { profitByDay, summarize, topItems } from "@/lib/stats";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { TIME_FILTERS, type TimeFilter } from "@/lib/time";
import { StatCard } from "./StatCard";
import { TimeFilterPills } from "./TimeFilterPills";
import { CharacterFilter } from "./CharacterFilter";
import { ProfitAreaChart } from "./ProfitAreaChart";
import { TopItemsBarChart } from "./TopItemsBarChart";
import { HuntsTable } from "./HuntsTable";
import { EmptyState, GoldLink, OutlineButton, PanelSkeleton, SectionCard, StatCardSkeleton, TableSkeleton } from "./ui";

const FILTER_PERIOD: Record<TimeFilter, string> = {
  today: "hoje",
  "7d": "nos últimos 7 dias",
  "30d": "nos últimos 30 dias",
  month: "neste mês",
  all: "no total",
};

export function Dashboard() {
  const [filter, setFilter] = useState<TimeFilter>("7d");
  const [characterId, setCharacterId] = useState("all");
  const { hunts, loading, error, refetch } = useHunts(filter, characterId);

  const summary = useMemo(() => summarize(hunts), [hunts]);
  const dayData = useMemo(() => profitByDay(hunts), [hunts]);
  const items = useMemo(() => topItems(hunts, 8), [hunts]);

  const filterLabel = TIME_FILTERS.find((f) => f.value === filter)?.label ?? "";
  const profitPositive = summary.profit >= 0;
  const hasData = hunts.length > 0;

  return (
    <div>
      {/* Header */}
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">
            Boss Rotation
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Dashboard{" "}
            <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">
              de Profit
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {loading
              ? `Carregando sessões · ${filterLabel}…`
              : `${summary.sessions} ${summary.sessions === 1 ? "sessão registrada" : "sessões registradas"} ${FILTER_PERIOD[filter]}`}
          </p>
        </div>
        <GoldLink href="/new" className="shrink-0">
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Nova Hunt
        </GoldLink>
      </header>

      {/* Filtros */}
      <div className="animate-fade-up mt-6 flex flex-col gap-3" style={{ animationDelay: "60ms" }}>
        <TimeFilterPills value={filter} onChange={setFilter} />
        <CharacterFilter value={characterId} onChange={setCharacterId} />
      </div>

      {error ? (
        <div className="mt-6">
          <SectionCard contentClassName="p-0">
            <EmptyState
              icon={CircleAlert}
              title="Falha ao carregar os dados"
              message={error}
              action={
                <OutlineButton onClick={refetch}>
                  <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                </OutlineButton>
              }
            />
          </SectionCard>
        </div>
      ) : loading ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <PanelSkeleton className="lg:col-span-3" />
            <PanelSkeleton className="lg:col-span-2" />
          </div>
          <div className="mt-6">
            <TableSkeleton rows={6} />
          </div>
        </>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Profit Total"
              value={formatSignedGP(summary.profit)}
              sub={`${formatFull(summary.profit)} gp de balance`}
              icon={Coins}
              tone={profitPositive ? "green" : "red"}
              valueClassName={profitPositive ? "text-green-400" : "text-red-400"}
              delay={80}
            />
            <StatCard
              label="Loot Total"
              value={formatGP(summary.loot)}
              sub={`${formatFull(summary.loot)} gp em drops`}
              icon={Gem}
              tone="green"
              valueClassName="text-green-400"
              delay={140}
            />
            <StatCard
              label="Gasto Total"
              value={formatGP(summary.supplies)}
              sub={`${formatFull(summary.supplies)} gp em supplies`}
              icon={Receipt}
              tone="red"
              valueClassName="text-red-400"
              delay={200}
            />
            <StatCard
              label="Sessões"
              value={String(summary.sessions)}
              sub={`${formatFull(summary.xp)} de XP ganho`}
              icon={Swords}
              tone="blue"
              valueClassName="text-blue-400"
              delay={260}
            />
          </div>

          {hasData ? (
            <>
              {/* Gráficos */}
              <div className="mt-6 grid gap-6 lg:grid-cols-5">
                <SectionCard
                  className="lg:col-span-3"
                  title="Profit por dia"
                  subtitle="Balance somado por dia no período"
                  icon={TrendingUp}
                  contentClassName="p-2 sm:p-4"
                  delay={320}
                >
                  <ProfitAreaChart data={dayData} />
                </SectionCard>
                <SectionCard
                  className="lg:col-span-2"
                  title="Top Itens"
                  subtitle="Os 8 itens mais dropados no período"
                  icon={Package}
                  contentClassName="p-2 sm:p-4"
                  delay={380}
                >
                  {items.length > 0 ? (
                    <TopItemsBarChart data={items} />
                  ) : (
                    <EmptyState
                      icon={Package}
                      title="Sem itens registrados"
                      message="As hunts deste período não têm itens listados no texto do Hunt Analyser."
                    />
                  )}
                </SectionCard>
              </div>

              {/* Últimas hunts */}
              <SectionCard
                className="mt-6"
                title="Últimas Hunts"
                subtitle="As 10 sessões mais recentes do período"
                icon={Swords}
                contentClassName="p-0"
                delay={440}
                actions={
                  <Link
                    href="/history"
                    className="text-xs font-semibold text-gold-400 transition-colors hover:text-gold-300"
                  >
                    Ver todas →
                  </Link>
                }
              >
                <HuntsTable hunts={hunts.slice(0, 10)} />
              </SectionCard>
            </>
          ) : (
            <div className="mt-6">
              <SectionCard contentClassName="p-0" delay={320}>
                <EmptyState
                  icon={Swords}
                  title={`Nenhuma hunt ${FILTER_PERIOD[filter]}`}
                  message="Cole o texto do Hunt Analyser depois da próxima rotação de boss para começar a montar o histórico do time."
                  action={<GoldLink href="/new">Registrar primeira hunt</GoldLink>}
                />
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
