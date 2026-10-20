"use client";

import { useState } from "react";
import {
  CalendarDays,
  CircleAlert,
  Coins,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
  Swords,
  Trash2,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useCharacters } from "@/hooks/useCharacters";
import type { Character, CharacterWithStats } from "@/types";
import { formatGP, formatSignedGP } from "@/lib/format";
import { getVocationMeta } from "@/lib/vocations";
import { AddCharacterForm } from "./AddCharacterForm";
import { EmptyState, OutlineButton, SectionCard, TableSkeleton } from "./ui";

function MiniStat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-night-700/80 bg-night-900/60 px-2.5 py-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-extrabold ${valueClass ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

function CharacterCard({
  character,
  onUpdated,
  onRemoved,
}: {
  character: CharacterWithStats;
  onUpdated: (c: Character) => void;
  onRemoved: (id: string) => void;
}) {
  const meta = getVocationMeta(character.vocation);
  const Icon = meta.icon;
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const createdAt = new Date(character.createdAt);
  const profitPositive = character.totalProfit >= 0;

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/characters/${character.id}`, { method: "PATCH" });
      const data = (await res.json()) as { character?: Character; error?: string };
      if (!res.ok || !data.character) {
        setActionError(data.error ?? "Falha ao atualizar.");
        return;
      }
      onUpdated(data.character);
    } catch (err) {
      console.error("[CharacterCard] refresh", err);
      setActionError("Falha de conexão.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const confirmed = window.confirm(
      `Remover "${character.name}"?\n\nAs hunts registradas com esse boneco NÃO serão apagadas — só perdem o vínculo.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/characters/${character.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setActionError(data.error ?? "Falha ao remover.");
        return;
      }
      onRemoved(character.id);
    } catch (err) {
      console.error("[CharacterCard] delete", err);
      setActionError("Falha de conexão.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      className="animate-fade-up group relative overflow-hidden rounded-xl border border-night-700 bg-night-850 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-18px_rgba(0,0,0,0.8)]"
      style={{ borderTop: `2px solid ${meta.color}66` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(10rem 10rem at 90% -20%, ${meta.color}14, transparent 70%)` }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: `${meta.color}1f`, borderColor: `${meta.color}55`, color: meta.color }}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold tracking-tight text-ink">{character.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-ink-muted">
              {character.vocation ?? "Sem vocação"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-gold-500/25 bg-gold-500/10 px-1.5 py-0.5 text-[10px] font-bold text-gold-300">
                Lv {character.level}
              </span>
              {character.world && (
                <span className="inline-flex items-center gap-1 rounded-md border border-night-700 bg-night-800 px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                  <Globe className="h-3 w-3" /> {character.world}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Sessões" value={String(character.sessions)} valueClass="text-blue-400" />
          <MiniStat
            label="Profit"
            value={formatSignedGP(character.totalProfit)}
            valueClass={profitPositive ? "text-green-400" : "text-red-400"}
          />
          <MiniStat label="XP" value={formatGP(character.totalXp)} valueClass="text-gold-300" />
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-muted/70">
          <CalendarDays className="h-3 w-3" />
          Cadastrado em{" "}
          {Number.isNaN(createdAt.getTime()) ? "—" : format(createdAt, "dd/MM/yyyy")}
          {character.totalLoot > 0 && (
            <>
              <Coins className="ml-2 h-3 w-3" /> {formatGP(character.totalLoot)} loot acumulado
            </>
          )}
        </p>

        {actionError && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-[11px] font-semibold text-red-400">
            <CircleAlert className="mt-0.5 h-3 w-3 shrink-0" /> {actionError}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-night-700/80 pt-3.5">
          <OutlineButton onClick={handleRefresh} disabled={refreshing || deleting} className="flex-1">
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar dados
          </OutlineButton>
          <OutlineButton
            onClick={handleDelete}
            disabled={refreshing || deleting}
            className="hover:!border-red-400/40 hover:!text-red-400"
            aria-label={`Remover ${character.name}`}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </OutlineButton>
        </div>
      </div>
    </article>
  );
}

export function CharactersView() {
  const { characters, loading, error, refetch, addCharacter, removeCharacter, updateCharacter } =
    useCharacters();

  const totalSessions = characters.reduce((acc, c) => acc + c.sessions, 0);

  return (
    <div>
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">
            Boss Rotation
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">
              Personagens
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {loading
              ? "Carregando bonecos…"
              : `${characters.length} ${characters.length === 1 ? "boneco cadastrado" : "bonecos cadastrados"} · ${totalSessions} ${totalSessions === 1 ? "sessão vinculada" : "sessões vinculadas"}`}
          </p>
        </div>
      </header>

      <SectionCard
        className="mt-6"
        title="Adicionar personagem"
        subtitle="Buscamos level, vocação e mundo direto na TibiaData API (dados oficiais do tibia.com)"
        icon={UserRoundPlus}
        delay={80}
      >
        <AddCharacterForm onAdded={addCharacter} />
      </SectionCard>

      <div className="mt-6">
        {error ? (
          <SectionCard contentClassName="p-0">
            <EmptyState
              icon={CircleAlert}
              title="Falha ao carregar os personagens"
              message={error}
              action={
                <OutlineButton onClick={refetch}>
                  <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                </OutlineButton>
              }
            />
          </SectionCard>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <TableSkeleton key={i} rows={3} />
            ))}
          </div>
        ) : characters.length === 0 ? (
          <SectionCard contentClassName="p-0" delay={120}>
            <EmptyState
              icon={Users}
              title="Nenhum boneco cadastrado"
              message="Use o formulário acima para buscar seu personagem pelo nome exato no Tibia. Depois disso, cada hunt salva pode ser vinculada a um boneco — e o profit fica organizado por char."
            />
          </SectionCard>
        ) : (
          <>
            <div className="animate-fade-up mb-4 flex items-center gap-2 text-xs font-semibold text-ink-muted" style={{ animationDelay: "120ms" }}>
              <Swords className="h-3.5 w-3.5 text-gold-500/80" />
              Ganhos acumulados por boneco
              <span className="hidden items-center gap-1 sm:inline-flex">
                · <Sparkles className="h-3 w-3 text-gold-500/60" /> dados das hunts vinculadas
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onUpdated={updateCharacter}
                  onRemoved={removeCharacter}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
