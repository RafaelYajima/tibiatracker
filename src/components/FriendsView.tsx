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
  Sparkles,
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

function StatBox({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-night-700 bg-night-900/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">{label}</p>
      </div>
      <p className="text-xl font-black tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}

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

  useEffect(() => { fetchFriendships(); }, []);

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
    if (!window.confirm("Remover amizade?")) return;
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Centralizado */}
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_40px_-8px_rgba(96,165,250,0.5)] text-white">
          <Users2 className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Seus <span className="text-blue-400">Amigos</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-lg mx-auto">
            Conecte-se com outros jogadores para comparar loots e acompanhar a evolução do time.
          </p>
        </div>
      </header>

      {/* Visualização de Perfil de Amigo (Fluxo Vertical) */}
      {selectedFriend && (
        <div className="animate-fade-up space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-500/20 bg-night-850 p-6 shadow-2xl">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <ShieldCheck className="h-7 w-7 text-blue-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/80">Perfil de Amigo</p>
                <h2 className="text-2xl font-black text-ink">{selectedFriend.name}</h2>
                <p className="text-xs text-ink-muted">{selectedFriend.email}</p>
              </div>
            </div>
            <OutlineButton onClick={() => setSelectedFriend(null)} className="h-10 px-4">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </OutlineButton>
          </div>

          {loadingStats ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : friendStats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Profit Total" value={formatSignedGP(friendStats.summary.totalProfit)} icon={Coins} color={friendStats.summary.totalProfit >= 0 ? "#4ade80" : "#f87171"} />
                <StatBox label="Loot" value={formatGP(friendStats.summary.totalLoot)} icon={Gem} color="#4ade80" />
                <StatBox label="XP" value={formatGP(friendStats.summary.totalXp)} icon={Sparkles} color="#d4a843" />
                <StatBox label="Sessões" value={String(friendStats.summary.sessions)} icon={Clock} color="#60a5fa" />
              </div>

              <SectionCard title="Hunts Recentes" icon={Swords} contentClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-night-900/50 border-b border-night-700/50">
                        <th className="px-5 py-4 text-left font-black uppercase text-ink-muted">Data/Título</th>
                        <th className="px-5 py-4 text-right font-black uppercase text-ink-muted">Loot</th>
                        <th className="px-5 py-4 text-right font-black uppercase text-ink-muted">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-night-800/50">
                      {friendStats.recentHunts.map(h => (
                        <tr key={h.id} className="hover:bg-night-800/20 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-ink">{h.title || "Sem título"}</p>
                            <p className="text-[10px] text-ink-muted">{format(new Date(h.createdAt), "dd/MM/yyyy")}</p>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-green-400">{formatGP(h.loot)}</td>
                          <td className="px-5 py-4 text-right font-bold" style={{ color: h.balance >= 0 ? '#4ade80' : '#f87171' }}>
                            {formatSignedGP(h.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>
      )}

      {/* Busca e Listagem - Fluxo Vertical */}
      {!selectedFriend && (
        <div className="space-y-8">
          {/* Busca */}
          <SectionCard title="Encontrar Jogadores" subtitle="Procure amigos pelo nome ou e-mail exato" icon={Search}>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ex: Rafael..."
                className="flex-1 rounded-xl border border-night-700 bg-night-950/80 px-4 py-3.5 text-sm text-ink focus:border-blue-500/50 focus:outline-none transition-all"
              />
              <GoldButton type="submit" disabled={query.length < 3 || searching} className="!from-blue-500 !to-blue-700 !border-blue-400/40 shadow-blue-500/20">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </GoldButton>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-night-700/50 pt-6">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-night-900/40 border border-night-700/50 hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-night-800 flex items-center justify-center text-ink-muted border border-night-700">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-ink">{user.name}</p>
                        <p className="text-[10px] text-ink-muted uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendRequest(user.id)}
                      disabled={sendingTo === user.id}
                      className="h-10 px-4 rounded-xl bg-blue-500/10 text-blue-400 font-bold text-xs hover:bg-blue-500/20 transition-all flex items-center gap-2 border border-blue-500/20"
                    >
                      {sendingTo === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      CONVIDAR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Pedidos Pendentes */}
          {pending.length > 0 && (
            <SectionCard title="Convites Pendentes" icon={Clock} contentClassName="p-0">
               <div className="divide-y divide-night-700/40">
                {pending.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gold-500/5 border border-gold-500/10 flex items-center justify-center text-gold-500/60">
                         <SendHorizonal className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">{f.friend?.name}</p>
                        <p className="text-[10px] text-ink-muted">Aguardando resposta</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => respondRequest(f.id, 'accept')} className="h-9 px-4 text-xs font-black bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20">ACEITAR</button>
                      <button onClick={() => respondRequest(f.id, 'delete')} className="h-9 w-9 flex items-center justify-center bg-night-800 text-ink-muted border border-night-700 rounded-lg hover:text-red-400"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Amigos */}
          <SectionCard title="Seus Amigos" icon={Users2} contentClassName="p-0">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400" /></div>
            ) : accepted.length === 0 ? (
              <div className="p-12 text-center opacity-50">
                <Users2 className="h-10 w-10 mx-auto text-night-700 mb-3" strokeWidth={1} />
                <p className="text-sm text-ink-muted">Sua lista de amigos está vazia.</p>
              </div>
            ) : (
              <div className="divide-y divide-night-700/40">
                {accepted.map(f => (
                  <div key={f.id} className="group flex items-center justify-between px-6 py-4 hover:bg-night-800/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400/70 group-hover:scale-105 transition-transform">
                         <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-ink group-hover:text-blue-400 transition-colors">{f.friend?.name}</p>
                        <p className="text-[10px] text-ink-muted tracking-widest">{f.friend?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => viewFriendStats(f.friend!)}
                        className="h-9 px-4 text-[10px] font-black tracking-widest bg-night-800 text-ink border border-night-700 rounded-lg hover:border-blue-500/40 hover:text-blue-400 transition-all"
                      >
                        VER DADOS
                      </button>
                      <button
                        onClick={() => removeFriend(f.id)}
                        disabled={removingId === f.id}
                        className="p-2 text-night-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
