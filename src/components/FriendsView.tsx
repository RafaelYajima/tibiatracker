"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  Gem,
  Loader2,
  Package,
  Search,
  SendHorizonal,
  ShieldCheck,
  Swords,
  Trash2,
  UserPlus,
  Users2,
  X,
} from "lucide-react";
import type { Friendship, UserSummary } from "@/types";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { GoldButton, OutlineButton, SectionCard, EmptyState } from "./ui";

interface FriendStats {
  summary: { totalProfit: number; totalLoot: number; totalXp: number; sessions: number };
  recentHunts: { id: string; createdAt: string; title: string | null; loot: number; supplies: number; balance: number; duration: string; activityType: string }[];
  topItems: { name: string; qty: number }[];
}

/* ================================================================ */
/*  Stat mini-card reutilizável                                      */
/* ================================================================ */
function MiniStat({
  label,
  value,
  valueClass = "text-ink",
  icon: Icon,
  iconClass = "text-gold-400",
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ElementType;
  iconClass?: string;
}) {
  return (
    <div className="rounded-xl border border-night-700 bg-night-900/60 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-night-700 bg-night-800">
          <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      </div>
      <p className={`mt-2 text-xl font-extrabold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

/* ================================================================ */
/*  Perfil do amigo (coluna direita)                                 */
/* ================================================================ */
function FriendProfile({
  friend,
  stats,
  loading,
  onClose,
}: {
  friend: UserSummary;
  stats: FriendStats | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (loading) {
    return (
      <SectionCard contentClassName="p-0">
        <div className="space-y-4 p-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-night-750" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-night-750/50" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl bg-night-750/40" />
        </div>
      </SectionCard>
    );
  }

  if (!stats) return null;

  const profitPositive = stats.summary.totalProfit >= 0;

  return (
    <div className="animate-fade-up space-y-5">
      {/* Header do perfil */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-night-700 bg-night-850 p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300/20 to-gold-600/20 border border-gold-500/25">
            <ShieldCheck className="h-7 w-7 text-gold-400" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500/80">Perfil do Amigo</p>
            <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{friend.name}</h2>
            <p className="mt-0.5 text-xs text-ink-muted">{friend.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-night-700 text-ink-muted transition-colors hover:border-gold-500/30 hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat
          label="Profit"
          value={formatSignedGP(stats.summary.totalProfit)}
          valueClass={profitPositive ? "text-green-400" : "text-red-400"}
          icon={Coins}
          iconClass={profitPositive ? "text-green-400" : "text-red-400"}
        />
        <MiniStat label="Loot Total" value={formatGP(stats.summary.totalLoot)} valueClass="text-green-400" icon={Gem} iconClass="text-green-400" />
        <MiniStat label="XP Ganho" value={formatGP(stats.summary.totalXp)} icon={Swords} />
        <MiniStat label="Sessões" value={String(stats.summary.sessions)} valueClass="text-blue-400" icon={Clock} iconClass="text-blue-400" />
      </div>

      {/* Últimas hunts */}
      <SectionCard title="Últimas Sessões" subtitle="As 5 hunts mais recentes" icon={Swords} contentClassName="p-0">
        {stats.recentHunts.length === 0 ? (
          <EmptyState icon={Swords} title="Nenhuma sessão registrada" message="Seu amigo ainda não registrou nenhuma hunt." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-xs">
              <thead>
                <tr className="border-b border-night-700 bg-night-900/40">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Data</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Duração</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Loot</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Gasto</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentHunts.map((h) => {
                  const d = new Date(h.createdAt);
                  return (
                    <tr key={h.id} className="border-b border-night-700/40 transition-colors hover:bg-night-800/30">
                      <td className="px-4 py-3">
                        <span className="text-ink-muted/70">{Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM HH:mm")}</span>
                        {h.title && <span className="mt-0.5 block text-[11px] font-bold text-ink">{h.title}</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-gold-500/60" />{h.duration}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-400">{formatGP(h.loot)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-400">{formatGP(h.supplies)}</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: h.balance >= 0 ? "#4ade80" : "#f87171" }}>
                        {formatSignedGP(h.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Top drops */}
      <SectionCard title="Top Drops" subtitle="Itens mais dropados de todas as sessões" icon={Package} contentClassName="p-4">
        {stats.topItems.length === 0 ? (
          <p className="text-center text-xs text-ink-muted py-6">Nenhum item registrado nas sessões.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.topItems.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded-lg border border-night-700 bg-night-800/70 px-3 py-2 transition-colors hover:border-gold-500/20"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold-500/10 text-[9px] font-black text-gold-400">
                  {i + 1}
                </span>
                <span className="text-xs text-ink">{item.name}</span>
                <span className="text-xs font-extrabold text-gold-400">{formatFull(item.qty)}×</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ================================================================ */
/*  Componente principal                                             */
/* ================================================================ */
export function FriendsView() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<UserSummary | null>(null);
  const [friendStats, setFriendStats] = useState<FriendStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFriendships();
  }, []);

  async function fetchFriendships() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriendships(data.friendships || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.length < 3 || searching) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(friendId: string) {
    setSendingTo(friendId);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        setSearchResults((prev) => prev.filter((u) => u.id !== friendId));
        fetchFriendships();
      }
    } finally {
      setSendingTo(null);
    }
  }

  async function respondRequest(id: string, action: "accept" | "delete") {
    setRespondingId(id);
    try {
      if (action === "accept") {
        await fetch(`/api/friends/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        });
      } else {
        await fetch(`/api/friends/${id}`, { method: "DELETE" });
      }
      fetchFriendships();
    } finally {
      setRespondingId(null);
    }
  }

  async function removeFriend(id: string) {
    if (!window.confirm("Remover amizade? O outro usuário também perderá acesso aos seus dados.")) return;
    setRemovingId(id);
    try {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (selectedFriend) {
        const rel = friendships.find((f) => f.id === id);
        if (rel && (rel.friend?.id === selectedFriend.id)) {
          setSelectedFriend(null);
          setFriendStats(null);
        }
      }
      fetchFriendships();
    } finally {
      setRemovingId(null);
    }
  }

  async function viewFriendStats(friend: UserSummary) {
    setSelectedFriend(friend);
    setLoadingStats(true);
    setFriendStats(null);
    try {
      const res = await fetch(`/api/friends/${friend.id}/stats`);
      if (res.ok) setFriendStats(await res.json());
    } finally {
      setLoadingStats(false);
    }
  }

  const accepted = friendships.filter((f) => f.status === "accepted");
  const pending = friendships.filter((f) => f.status === "pending");

  /* Se um amigo está selecionado, mostramos o perfil dele fullscreen no mobile */
  if (selectedFriend) {
    return (
      <FriendProfile
        friend={selectedFriend}
        stats={friendStats}
        loading={loadingStats}
        onClose={() => {
          setSelectedFriend(null);
          setFriendStats(null);
        }}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Coluna Esquerda: Busca */}
      <div className="lg:col-span-2 space-y-6">
        <SectionCard
          title="Buscar Usuários"
          subtitle="Digite pelo menos 3 caracteres do nome ou e-mail"
          icon={Search}
          contentClassName="p-4 sm:p-5"
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome ou e-mail…"
                className="w-full rounded-xl border border-night-700 bg-night-950/80 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/40 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
              />
            </div>
            <GoldButton type="submit" disabled={query.trim().length < 3 || searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </GoldButton>
          </form>

          {/* Resultados */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-night-700/50 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                {searchResults.length} {searchResults.length === 1 ? "resultado" : "resultados"}
              </p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-night-700/50 bg-night-900/40 p-3 transition-colors hover:bg-night-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-night-800 border border-night-700 text-ink-muted">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                      <p className="truncate text-[10px] text-ink-muted">{user.email}</p>
                    </div>
                  </div>
                  <GoldButton
                    onClick={() => sendRequest(user.id)}
                    disabled={sendingTo === user.id}
                    className="shrink-0 px-3 py-2"
                  >
                    {sendingTo === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Adicionar</span>
                      </>
                    )}
                  </GoldButton>
                </div>
              ))}
            </div>
          )}

          {searching === false && query.length >= 3 && searchResults.length === 0 && (
            <p className="mt-4 text-center text-xs text-ink-muted/70">
              Nenhum usuário encontrado para &quot;{query}&quot;.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Coluna Direita: Amigos + Pendentes */}
      <div className="lg:col-span-3 space-y-6">
        {/* Amigos aceitos */}
        <SectionCard
          title="Meus Amigos"
          subtitle={loading ? "Carregando…" : `${accepted.length} ${accepted.length === 1 ? "amigo" : "amigos"}`}
          icon={Users2}
          contentClassName="p-0"
        >
          {loading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-night-750/50" />
              ))}
            </div>
          ) : accepted.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="Nenhum amigo ainda"
              message="Use a busca ao lado para encontrar seus amigos pelo nome ou e-mail e envie um convite."
            />
          ) : (
            <div className="divide-y divide-night-700/40">
              {accepted.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-night-800/30"
                >
                  <button
                    onClick={() => viewFriendStats(f.friend!)}
                    className="flex items-center gap-3 min-w-0 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/15 bg-gold-500/5">
                      <ShieldCheck className="h-5 w-5 text-gold-400/80" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink group-hover:text-gold-300 transition-colors">
                        {f.friend?.name}
                      </p>
                      <p className="truncate text-[10px] text-ink-muted">{f.friend?.email}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => viewFriendStats(f.friend!)}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-night-700 bg-night-800 px-2.5 text-[10px] font-bold text-gold-400/80 transition-colors hover:border-gold-500/30 hover:text-gold-300"
                    >
                      <Eye className="h-3 w-3" /> Ver dados
                    </button>
                    <button
                      onClick={() => removeFriend(f.id)}
                      disabled={removingId === f.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-night-700 bg-night-800 text-ink-muted/50 transition-colors hover:border-red-400/30 hover:text-red-400 disabled:opacity-40"
                    >
                      {removingId === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Pendentes */}
        {pending.length > 0 && (
          <SectionCard
            title="Convites Pendentes"
            subtitle={`${pending.length} ${pending.length === 1 ? "convite" : "convites"}`}
            icon={Clock}
            contentClassName="p-0"
          >
            <div className="divide-y divide-night-700/40">
              {pending.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/10 bg-gold-500/5">
                      <SendHorizonal className="h-4 w-4 text-gold-400/60" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{f.friend?.name}</p>
                      <p className="text-[10px] text-ink-muted">Aguardando aceitação</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => respondRequest(f.id, "accept")}
                      disabled={respondingId === f.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-green-400/20 bg-green-400/5 px-2.5 text-[10px] font-bold text-green-400 transition-colors hover:bg-green-400/15 disabled:opacity-40"
                    >
                      {respondingId === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Aceitar
                    </button>
                    <button
                      onClick={() => respondRequest(f.id, "delete")}
                      disabled={respondingId === f.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-night-700 text-ink-muted/50 transition-colors hover:border-red-400/30 hover:text-red-400 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
