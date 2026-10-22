"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Coins,
  Gem,
  Loader2,
  Package,
  Search,
  Swords,
  UserPlus,
  Users,
  X,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { Friendship, UserSummary } from "@/types";
import { GoldButton, OutlineButton, SectionCard, EmptyState, PanelSkeleton } from "./ui";
import { formatGP, formatSignedGP } from "@/lib/format";

interface FriendStats {
  summary: { totalProfit: number; totalLoot: number; totalXp: number; sessions: number };
  recentHunts: any[];
  topItems: { name: string; qty: number }[];
}

export function FriendsView() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<UserSummary | null>(null);
  const [friendStats, setFriendStats] = useState<FriendStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 3) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(friendId: string) {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        setSearchResults(prev => prev.filter(u => u.id !== friendId));
        fetchFriendships();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function respondRequest(id: string, action: "accept" | "delete") {
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
    } catch (err) {
      console.error(err);
    }
  }

  async function viewFriendStats(friend: UserSummary) {
    setSelectedFriend(friend);
    setLoadingStats(true);
    setFriendStats(null);
    try {
      const res = await fetch(`/api/friends/${friend.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setFriendStats(data);
      }
    } finally {
      setLoadingStats(false);
    }
  }

  const accepted = friendships.filter(f => f.status === "accepted");
  const pendingReceived = friendships.filter(f => f.status === "pending" && f.friendId !== f.friend?.id); // Na vdd a query da API já traz o 'outro', precisamos checar userId
  // Melhor filtrar por userId da friendship
  // Para simplificar a lógica de UI, vamos assumir que se o status é pending e o amiguinho não é você, vc que enviou ou recebeu.
  // Vou ajustar o pending:
  const requests = friendships.filter(f => f.status === "pending");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Coluna Esquerda: Busca e Amigos */}
      <div className="lg:col-span-1 space-y-6">
        <SectionCard title="Buscar Amigos" icon={Search} contentClassName="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nome ou e-mail..."
              className="w-full rounded-lg border border-night-700 bg-night-950/80 px-3 py-2 text-sm text-ink focus:border-gold-500/50 outline-none"
            />
            <GoldButton type="submit" disabled={query.length < 3 || searching} className="px-3">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </GoldButton>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-night-700/50 pt-4">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-night-900/50 border border-night-700/30">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                    <p className="text-[10px] text-ink-muted truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => sendRequest(user.id)}
                    className="p-1.5 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Meus Amigos" icon={Users} contentClassName="p-2">
          {loading ? (
            <div className="p-4 space-y-2">
              <div className="h-10 bg-night-800 rounded animate-pulse" />
              <div className="h-10 bg-night-800 rounded animate-pulse" />
            </div>
          ) : accepted.length === 0 ? (
            <div className="p-4 text-center text-xs text-ink-muted">Nenhum amigo aceito.</div>
          ) : (
            <div className="flex flex-col">
              {accepted.map(f => (
                <button
                  key={f.id}
                  onClick={() => viewFriendStats(f.friend!)}
                  className={`flex items-center justify-between p-3 transition-colors hover:bg-night-800 border-b border-night-700/30 last:border-0 ${selectedFriend?.id === f.friend?.id ? 'bg-gold-500/5' : ''}`}
                >
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{f.friend?.name}</p>
                    <p className="text-[10px] text-ink-muted truncate">{f.friend?.email}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-gold-500/40" />
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {requests.length > 0 && (
          <SectionCard title="Pendentes" icon={Clock} contentClassName="p-2">
             <div className="flex flex-col">
              {requests.map(f => {
                // Lógica de quem recebeu: se o friend info id é igual ao seu ID no sistema, vc recebeu. 
                // Mas a API traz o 'outro'. Vamos simplificar: se vc pode aceitar, mostramos o check.
                // Na API eu pus o Join no 'outro'. 
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 border-b border-night-700/30 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">{f.friend?.name}</p>
                      <p className="text-[10px] text-ink-muted">{f.status === 'pending' ? 'Pedido pendente' : ''}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => respondRequest(f.id, 'accept')} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg"><Check className="h-4 w-4" /></button>
                      <button onClick={() => respondRequest(f.id, 'delete')} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Coluna Direita: Dashboard do Amigo */}
      <div className="lg:col-span-2">
        {!selectedFriend ? (
          <SectionCard contentClassName="py-20 flex flex-col items-center justify-center text-center opacity-50">
            <Users className="h-12 w-12 text-night-700 mb-4" strokeWidth={1} />
            <p className="text-ink-muted">Selecione um amigo para visualizar os dados</p>
          </SectionCard>
        ) : loadingStats ? (
          <PanelSkeleton className="h-[500px]" />
        ) : friendStats ? (
          <div className="animate-fade-up space-y-6">
             <header className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500/80">Visualizando Perfil</p>
                  <h2 className="text-2xl font-extrabold text-ink">{selectedFriend.name}</h2>
                </div>
                <OutlineButton onClick={() => setSelectedFriend(null)} className="h-8 w-8 !p-0"><X className="h-4 w-4" /></OutlineButton>
             </header>

             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-night-850 border border-night-700 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-ink-muted uppercase">Profit Total</p>
                  <p className={`text-lg font-black mt-1 ${friendStats.summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatSignedGP(friendStats.summary.totalProfit)}
                  </p>
                </div>
                <div className="bg-night-850 border border-night-700 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-ink-muted uppercase">Loot Acumulado</p>
                  <p className="text-lg font-black text-ink mt-1">{formatGP(friendStats.summary.totalLoot)}</p>
                </div>
                <div className="bg-night-850 border border-night-700 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-ink-muted uppercase">Sessões</p>
                  <p className="text-lg font-black text-blue-400 mt-1">{friendStats.summary.sessions}</p>
                </div>
             </div>

             <SectionCard title="Últimas Hunts" icon={Swords} contentClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-night-900/50 border-b border-night-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-ink-muted uppercase">Data</th>
                        <th className="px-4 py-3 text-right font-bold text-ink-muted uppercase">Loot</th>
                        <th className="px-4 py-3 text-right font-bold text-ink-muted uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {friendStats.recentHunts.map(h => (
                        <tr key={h.id} className="border-b border-night-800 last:border-0 hover:bg-night-800/30 transition-colors">
                          <td className="px-4 py-3 text-ink">{new Date(h.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right text-green-400 font-bold">{formatGP(h.loot)}</td>
                          <td className="px-4 py-3 text-right font-bold" style={{ color: h.balance >= 0 ? '#4ade80' : '#f87171' }}>
                            {formatSignedGP(h.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </SectionCard>

             <SectionCard title="Top Drops" icon={Package} contentClassName="p-4">
                <div className="flex flex-wrap gap-2">
                  {friendStats.topItems.map(item => (
                    <div key={item.name} className="flex items-center gap-2 bg-night-900 border border-night-700 px-3 py-2 rounded-lg">
                      <span className="text-ink text-xs">{item.name}</span>
                      <span className="text-gold-400 font-black text-xs">{item.qty}×</span>
                    </div>
                  ))}
                  {friendStats.topItems.length === 0 && <p className="text-xs text-ink-muted">Nenhum item registrado.</p>}
                </div>
             </SectionCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
