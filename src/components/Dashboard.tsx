"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, CircleAlert, Clock, Coins, Gem, Package, Plus, Receipt, RefreshCw, Swords, TrendingUp } from "lucide-react";
import { useHunts } from "@/hooks/useHunts";
import { type ActivityFilterValue } from "@/lib/activity";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { profitByDay, summarize, topItems } from "@/lib/stats";
import { TIME_FILTERS, type TimeFilter } from "@/lib/time";
import { FilterBar } from "./FilterBar";
import { HuntsTable } from "./HuntsTable";
import { ProfitAreaChart } from "./ProfitAreaChart";
import { StatCard } from "./StatCard";
import { TopItemsBarChart } from "./TopItemsBarChart";
import { EmptyState, GoldLink, OutlineButton, PanelSkeleton, SectionCard, StatCardSkeleton, TableSkeleton } from "./ui";

const FILTER_PERIOD: Record<TimeFilter, string> = {
  today: "hoje",
  "7d": "nos últimos 7 dias",
  "30d": "nos últimos 30 dias",
  month: "neste mês",
  all: "no total",
};

export function Dashboard() {
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [characterId, setCharacterId] = useState("all");
  const [activity, setActivity] = useState<ActivityFilterValue>("all");
  const { hunts, loading, error, refetch } = useHunts(filter, characterId, activity);

  const summary = useMemo(() => summarize(hunts), [hunts]);
  const dayData = useMemo(() => profitByDay(hunts), [hunts]);
  const items = useMemo(() => topItems(hunts, 8), [hunts]);

  const filterLabel = TIME_FILTERS.find((f) => f.value === filter)?.label ?? "";
  const profitPositive = summary.profit >= 0;
  const hasData = hunts.length > 0;

  // Última hunt
  const lastHunt = hunts.length > 0 ? hunts[0] : null;
  const lastHuntDate = lastHunt ? new Date(lastHunt.createdAt) : null;

  // Comparativo: profit das últimas 7 days vs 7 days anteriores
  const weekComparison = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = hunts.filter((h) => now - new Date(h.createdAt).getTime() < week);
    const lastWeek = hunts.filter((h) => {
      const age = now - new Date(h.createdAt).getTime();
      return age >= week && age < week * 2;
    });
    const thisProfit = thisWeek.reduce((acc, h) => acc + h.balance, 0);
    const lastProfit = lastWeek.reduce((acc, h) => acc + h.balance, 0);
    const diff = thisProfit - lastProfit;
    return { thisProfit, lastProfit, diff, hasBoth: lastWeek.length > 0 };
  }, [hunts]);

  return (
    <div>
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">Hunts & Bosses</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Dashboard <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">de Lucros</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {loading
              ? `Carregando · ${filterLabel}…`
              : `${summary.sessions} ${summary.sessions === 1 ? "registro" : "registros"} ${FILTER_PERIOD[filter]}`}
          </p>
        </div>
        <GoldLink href="/new" className="shrink-0">
          <Plus className="h-4 w-4" strokeWidth={2.6} /> Novo Registro
        </GoldLink>
      </header>

      <div className="mt-5">
        <FilterBar
          activity={activity}
          onActivityChange={setActivity}
          time={filter}
          onTimeChange={setFilter}
          character={characterId}
          onCharacterChange={setCharacterId}
        />
      </div>

      {/* Resumo da última hunt + comparativo */}
      {!loading && !error && hasData && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {/* Última hunt */}
          {lastHunt && (
            <div className="rounded-2xl border border-night-700 bg-night-900/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-3">Última Sessão</p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{lastHunt.title || "Sem título"}</p>
                  <p className="mt-0.5 text-[10px] text-ink-muted flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {lastHuntDate && !Number.isNaN(lastHuntDate.getTime()) ? format(lastHuntDate, "dd/MM 'às' HH:mm") : "—"}
                    {" · "}{lastHunt.duration}
                  </p>
                </div>
                <p className={`text-lg font-black shrink-0 ${lastHunt.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatSignedGP(lastHunt.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Comparativo semanal */}
          <div className="rounded-2xl border border-night-700 bg-night-900/50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-3">Esta semana vs anterior</p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">Profit 7 dias: {formatSignedGP(weekComparison.thisProfit)}</p>
                {weekComparison.hasBoth && (
                  <p className="mt-0.5 text-[10px] text-ink-muted">Semana passada: {formatSignedGP(weekComparison.lastProfit)}</p>
                )}
              </div>
              {weekComparison.hasBoth && (
                <div className={`flex items-center gap-1 text-sm font-black ${weekComparison.diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {weekComparison.diff >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {formatGP(Math.abs(weekComparison.diff))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Profit Total"
              value={formatSignedGP(summary.profit)}
              sub={`${formatFull(summary.profit)} gp`}
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
              label="Registros"
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
              <div className="mt-6 grid gap-6 lg:grid-cols-5">
                <SectionCard className="lg:col-span-3" title="Profit por dia" subtitle="Balance somado por dia no período" icon={TrendingUp} contentClassName="p-2 sm:p-4" delay={320}>
                  <ProfitAreaChart data={dayData} />
                </SectionCard>
                <SectionCard className="lg:col-span-2" title="Top Itens" subtitle="Top 8 por quantidade no período" icon={Package} contentClassName="p-2 sm:p-4" delay={380}>
                  {items.length > 0 ? (
                    <TopItemsBarChart data={items} />
                  ) : (
                    <EmptyState icon={Package} title="Sem itens registrados" message="Os registros deste período não têm itens listados." />
                  )}
                </SectionCard>
              </div>

              <SectionCard
                className="mt-6"
                title="Últimos Registros"
                subtitle="As 10 sessões mais recentes"
                icon={Swords}
                contentClassName="p-0"
                delay={440}
                actions={
                  <Link href="/history" className="text-xs font-semibold text-gold-400 transition-colors hover:text-gold-300">
                    Ver histórico →
                  </Link>
                }
              >
                <HuntsTable hunts={hunts.slice(0, 10)} onRefresh={refetch} />
              </SectionCard>
            </>
          ) : (
            <div className="mt-6">
              <SectionCard contentClassName="p-0" delay={320}>
                <EmptyState
                  icon={Swords}
                  title={`Nenhum registro ${FILTER_PERIOD[filter]}`}
                  message="Cadastre um lucro de hunt ou uma rotação de bosses para começar."
                  action={<GoldLink href="/new">Criar primeiro registro</GoldLink>}
                />
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
