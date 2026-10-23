"use client";

import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Clock,
  Coins,
  Crown,
  Eye,
  Gem,
  Loader2,
  Mail,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { getValueTier, VALUE_TIER_META } from "@/lib/itemrarity";
import { EmptyState, GoldButton, OutlineButton, SectionCard } from "./ui";
import { Modal } from "./Modal";
import { ItemAutocomplete } from "./ItemAutocomplete";

/* ─────────────────────────── Types ─────────────────────────── */
interface Clan {
  id: string;
  name: string;
  ownerId: string;
  role: string;
}

interface ClanMember {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
}

interface ClanDetail {
  clan: { id: string; name: string; ownerId: string };
  members: ClanMember[];
  myRole: string;
}

interface MemberProfile {
  member: { id: string; name: string; email: string; role: string };
  stats: { totalProfit: number; totalLoot: number; totalSupplies: number; totalXp: number; sessions: number };
  recentHunts: { id: string; createdAt: string; title: string | null; duration: string; loot: number; supplies: number; balance: number; activityType: string }[];
  topItems: { name: string; qty: number }[];
}

/* ─────────────────────────── Perfil do Membro ─────────────────────────── */
function MemberProfileModal({
  clanId,
  member,
  onClose,
}: {
  clanId: string;
  member: ClanMember;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clans/${clanId}/members/${member.userId}/profile`)
      .then((r) => r.json())
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clanId, member.userId]);

  const roleLabel: Record<string, string> = { owner: "Dono", admin: "Admin", member: "Membro" };

  return (
    <Modal isOpen onClose={onClose} title="Perfil do Membro">
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
        </div>
      ) : !profile ? (
        <p className="py-6 text-center text-sm text-ink-muted">Falha ao carregar perfil.</p>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4 rounded-xl border border-night-700 bg-night-900/60 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10">
              <ShieldCheck className="h-5 w-5 text-gold-400" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-ink">{profile.member.name}</p>
              <p className="truncate text-[11px] text-ink-muted">{profile.member.email}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full border border-night-700 bg-night-800 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-ink-muted">
              {roleLabel[profile.member.role] ?? profile.member.role}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Profit", value: formatSignedGP(profile.stats.totalProfit), color: profile.stats.totalProfit >= 0 ? "#4ade80" : "#f87171", icon: Coins },
              { label: "Loot", value: formatGP(profile.stats.totalLoot), color: "#4ade80", icon: Gem },
              { label: "XP Ganho", value: formatGP(profile.stats.totalXp), color: "#d4a843", icon: Sparkles },
              { label: "Sessões", value: String(profile.stats.sessions), color: "#60a5fa", icon: Swords },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-night-700 bg-night-900/60 p-3">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3" style={{ color }} />
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
                </div>
                <p className="mt-1.5 text-sm font-extrabold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Últimas sessões */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Últimas sessões</p>
            {profile.recentHunts.length === 0 ? (
              <p className="text-xs text-ink-muted">Nenhuma sessão registrada.</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {profile.recentHunts.map((h) => {
                  const d = new Date(h.createdAt);
                  const pos = h.balance >= 0;
                  return (
                    <div key={h.id} className="flex items-center gap-3 rounded-lg border border-night-700/50 bg-night-900/40 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-ink">
                          {h.title || (Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy HH:mm"))}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-muted">
                          <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{h.duration}</span>
                          <span className="text-green-400">{formatGP(h.loot)}</span>
                          <span className="text-red-400">{formatGP(h.supplies)}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-extrabold inline-flex items-center gap-1 ${pos ? "text-green-400" : "text-red-400"}`}>
                        {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatSignedGP(h.balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top itens */}
          {profile.topItems.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted flex items-center gap-1.5">
                <Package className="h-3 w-3 text-gold-500/70" /> Top Drops
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.topItems.map((item) => (
                  <span key={item.name} className="inline-flex items-center gap-1.5 rounded-md border border-night-700 bg-night-800 px-2 py-1 text-[10px]">
                    <span className="text-ink">{item.name}</span>
                    <span className="font-extrabold text-gold-400">{formatFull(item.qty)}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ─────────────────────────── ClanView ─────────────────────────── */
export function ClanView() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClan, setSelectedClan] = useState<ClanDetail | null>(null);
  const [loadingClan, setLoadingClan] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [clanName, setClanName] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ name: string; price: number } | null>(null);
  const [priceItemName, setPriceItemName] = useState("");
  const [priceValue, setPriceValue] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { fetchClans(); }, []);

  async function fetchClans() {
    setLoading(true);
    try {
      const res = await fetch("/api/clans");
      const data = await res.json();
      const myClans = data.clans ?? [];
      setClans(myClans);
      if (myClans.length > 0) loadClan(myClans[0].id);
      else setSelectedClan(null);
    } finally {
      setLoading(false);
    }
  }

  async function createClan(e: FormEvent) {
    e.preventDefault();
    if (!clanName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clanName.trim() }),
      });
      if (res.ok) { setClanName(""); setShowCreate(false); fetchClans(); }
      else { const d = await res.json(); alert(d.error ?? "Erro ao criar clã."); }
    } finally { setCreating(false); }
  }

  async function loadClan(id: string) {
    setLoadingClan(true);
    try {
      const [clanRes, pricesRes] = await Promise.all([
        fetch(`/api/clans/${id}`).then((r) => r.json()),
        fetch(`/api/clans/${id}/prices`).then((r) => r.json()),
      ]);
      setSelectedClan(clanRes);
      setPrices(pricesRes.prices ?? {});
    } finally { setLoadingClan(false); }
  }

  async function inviteMember(e: FormEvent) {
    e.preventDefault();
    if (!selectedClan || !inviteEmail.trim() || inviting) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/clans/${selectedClan.clan.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error ?? "Falha ao convidar."); return; }
      setInviteEmail("");
      loadClan(selectedClan.clan.id);
    } finally { setInviting(false); }
  }

  function openPriceModal(item?: { name: string; price: number }) {
    if (item) {
      setEditingItem(item);
      setPriceItemName(item.name);
      setPriceValue(item.price);
    } else {
      setEditingItem(null);
      setPriceItemName("");
      setPriceValue(0);
    }
    setShowPriceModal(true);
  }

  async function savePrice() {
    if (!selectedClan || !priceItemName.trim() || savingPrice) return;
    setSavingPrice(true);
    try {
      const res = await fetch(`/api/clans/${selectedClan.clan.id}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: priceItemName.trim(), price: priceValue }),
      });
      if (res.ok) {
        if (editingItem && editingItem.name !== priceItemName.trim()) {
          setPrices((prev) => {
            const next = { ...prev };
            delete next[editingItem.name];
            next[priceItemName.trim()] = priceValue;
            return next;
          });
        } else {
          setPrices((prev) => ({ ...prev, [priceItemName.trim()]: priceValue }));
        }
        setShowPriceModal(false);
        setPriceItemName(""); setPriceValue(0); setEditingItem(null);
      }
    } finally { setSavingPrice(false); }
  }

  async function removePrice(itemName: string) {
    if (!selectedClan || removingItem) return;
    setRemovingItem(itemName);
    try {
      const res = await fetch(`/api/clans/${selectedClan.clan.id}/prices`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName }),
      });
      if (res.ok) {
        setPrices((prev) => {
          const next = { ...prev };
          delete next[itemName];
          return next;
        });
      }
    } finally { setRemovingItem(null); }
  }

  async function handleLeaveOrKick(targetUserId: string, isSelf: boolean) {
    if (!selectedClan || leaving) return;
    if (!window.confirm(isSelf ? "Tem certeza que deseja SAIR deste clã?" : "Tem certeza que deseja EXPULSAR este membro?")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/clans/${selectedClan.clan.id}/members/${targetUserId}`, { method: "DELETE" });
      if (res.ok) {
        if (isSelf) { setClans([]); setSelectedClan(null); }
        else loadClan(selectedClan.clan.id);
      } else { const d = await res.json(); alert(d.error ?? "Falha ao remover."); }
    } finally { setLeaving(false); }
  }

  const canManage = selectedClan && ["owner", "admin"].includes(selectedClan.myRole);
  const isOwner = selectedClan?.myRole === "owner";

  const priceEntries = Object.entries(prices).sort(([, a], [, b]) => b - a);
  const priceTier = getValueTier(priceValue);
  const priceTierMeta = VALUE_TIER_META[priceTier];

  const roleLabel: Record<string, string> = { owner: "Dono", admin: "Admin", member: "Membro" };
  const roleBadge = (role: string) => {
    const colors: Record<string, string> = { owner: "text-gold-300 border-gold-500/30 bg-gold-500/10", admin: "text-blue-300 border-blue-500/30 bg-blue-500/10", member: "text-ink-muted border-night-700 bg-night-800" };
    return colors[role] ?? colors.member;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Centralizado */}
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_40px_-8px_rgba(212,168,67,0.5)]">
          <Swords className="h-8 w-8 text-night-950" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Seu <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Clã</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-lg mx-auto">
            Sincronize a tabela de preços de itens entre todos os membros da sua rotação para manter o profit organizado.
          </p>
        </div>
        {clans.length === 0 && !loading && (
          <GoldButton onClick={() => setShowCreate(!showCreate)} className="mx-auto">
            {showCreate ? "Cancelar" : <><Plus className="h-4 w-4" /> Criar Clã</>}
          </GoldButton>
        )}
      </header>

      {/* Criar clã - Seção única */}
      {showCreate && clans.length === 0 && (
        <div className="animate-fade-up max-w-xl mx-auto">
          <SectionCard title="Fundar Clã" icon={Swords}>
            <form onSubmit={createClan} className="flex gap-3">
              <input
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                placeholder="Nome do clã (ex: Team Rotation)"
                className="flex-1 rounded-xl border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-gold-500/50 focus:outline-none"
              />
              <GoldButton type="submit" disabled={clanName.trim().length < 2 || creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Fundar
              </GoldButton>
            </form>
          </SectionCard>
        </div>
      )}

      {/* Conteúdo principal - Fluxo Vertical */}
      <div className="space-y-8 pb-10">
        {loading || loadingClan ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-400" />
            <p className="mt-3 text-sm text-ink-muted">Acessando covil do clã…</p>
          </div>
        ) : clans.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Você não está em nenhum clã"
            message="Peça para o líder da sua rotação convidar você, ou crie seu próprio clã para começar a compartilhar preços."
          />
        ) : selectedClan ? (
          <>
            {/* Banner do Clã - Destaque no topo */}
            <div className="animate-fade-up flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gold-500/15 bg-gradient-to-br from-night-850 to-night-900 p-6 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 border border-gold-500/20 shadow-[0_0_30px_-5px_rgba(212,168,67,0.3)]">
                  <Crown className="h-7 w-7 text-gold-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{selectedClan.clan.name}</h2>
                  <div className="mt-1 flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${roleBadge(selectedClan.myRole)}`}>
                      {roleLabel[selectedClan.myRole] ?? selectedClan.myRole}
                    </span>
                    <span className="text-xs font-bold text-ink-muted">{selectedClan.members.length} membros ativos</span>
                  </div>
                </div>
              </div>
              {!isOwner && (
                <OutlineButton onClick={() => handleLeaveOrKick(selectedClan.members.find(m => m.role === selectedClan.myRole)!.userId, true)} className="hover:!border-red-400/40 hover:!text-red-400">
                  Sair do clã
                </OutlineButton>
              )}
            </div>

            {/* Tabela de Preços - Seção Larga */}
            <SectionCard
              title="Tabela de Preços Compartilhada"
              subtitle="Estes valores são usados por todos os membros para calcular o profit"
              icon={Coins}
              actions={
                canManage ? (
                  <GoldButton onClick={() => openPriceModal()} className="px-4 py-2 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Adicionar Preço
                  </GoldButton>
                ) : undefined
              }
            >
              {priceEntries.length === 0 ? (
                <div className="py-12 text-center opacity-60">
                  <Coins className="mx-auto h-10 w-10 text-night-700 mb-3" strokeWidth={1} />
                  <p className="text-sm text-ink-muted">Ainda não há preços cadastrados.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {priceEntries.map(([name, price]) => {
                    const tier = getValueTier(price);
                    const meta = VALUE_TIER_META[tier];
                    return (
                      <div
                        key={name}
                        className="group relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs transition-all hover:brightness-110"
                        style={{ background: meta.bg, border: `1px solid ${meta.border}`, boxShadow: meta.glow }}
                      >
                        <button
                          type="button"
                          onClick={() => canManage && openPriceModal({ name, price })}
                          className={canManage ? "cursor-pointer" : "cursor-default"}
                        >
                          <span className="font-bold text-ink">{name}</span>
                          <span className="ml-2 font-black" style={{ color: meta.color }}>
                            {formatGP(price)}
                          </span>
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => removePrice(name)}
                            disabled={removingItem === name}
                            className="opacity-0 group-hover:opacity-100 ml-1 rounded-md p-1 text-ink-muted hover:bg-red-400/10 hover:text-red-400 transition-all"
                          >
                            {removingItem === name ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Membros - Seção Larga */}
            <SectionCard
              title="Equipe de Rotação"
              subtitle="Gerencie quem participa do seu time"
              icon={Users}
              contentClassName="p-0"
              actions={
                canManage ? (
                  <form onSubmit={inviteMember} className="flex items-center gap-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                        placeholder="E-mail do jogador"
                        className="w-48 rounded-lg border border-night-700 bg-night-950/80 px-3 pl-9 py-2 text-xs text-ink focus:border-gold-500/50 focus:outline-none"
                      />
                    </div>
                    <GoldButton type="submit" disabled={!inviteEmail.trim() || inviting} className="px-4 py-2 text-xs">
                      Convidar
                    </GoldButton>
                  </form>
                ) : undefined
              }
            >
              {inviteError && (
                <div className="bg-red-400/5 px-6 py-2 border-b border-red-400/10">
                   <p className="text-[11px] font-bold text-red-400">{inviteError}</p>
                </div>
              )}
              <div className="divide-y divide-night-700/40">
                {selectedClan.members.map((m) => (
                  <div key={m.id} className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-night-800/20">
                    <button
                      type="button"
                      onClick={() => setSelectedMember(m)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-800 border border-night-700 text-ink-muted group-hover:border-gold-500/30 group-hover:text-gold-400 transition-colors">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-ink group-hover:text-gold-300 transition-colors">
                          {m.name}
                        </p>
                        <p className="truncate text-[11px] text-ink-muted">{m.email}</p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${roleBadge(m.role)}`}>
                        {roleLabel[m.role] ?? m.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMember(m)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-night-700 bg-night-900 px-3 text-[10px] font-black text-gold-400/80 transition-all hover:border-gold-500/40 hover:text-gold-300"
                      >
                        PERFIL
                      </button>
                      {canManage && m.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => handleLeaveOrKick(m.userId, false)}
                          className="text-red-400/40 hover:text-red-400 transition-colors p-1"
                          title="Expulsar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        ) : null}
      </div>

      {/* Modais */}
      {showPriceModal && selectedClan && (
        <Modal
          isOpen
          onClose={() => { setShowPriceModal(false); setPriceItemName(""); setPriceValue(0); setEditingItem(null); }}
          title={editingItem ? "Editar Preço" : "Definir Preço"}
        >
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Item</label>
              <ItemAutocomplete
                value={priceItemName}
                onChange={setPriceItemName}
                placeholder="Busque o item..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Valor no Market (gp)</label>
              <input
                type="number"
                value={priceValue || ""}
                onChange={(e) => setPriceValue(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ex: 55000"
                className="w-full rounded-xl border border-night-700 bg-night-950/80 px-4 py-3.5 text-sm text-ink focus:border-gold-500/50 focus:outline-none"
              />
              {priceValue > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold-500/10 bg-gold-500/5 p-3">
                  <div className="h-2 w-2 rounded-full" style={{ background: priceTierMeta.color, boxShadow: priceTierMeta.glow }} />
                  <p className="text-xs font-bold" style={{ color: priceTierMeta.color }}>
                    {priceTierMeta.label} — {formatGP(priceValue)}
                  </p>
                </div>
              )}
            </div>
            <GoldButton onClick={savePrice} disabled={!priceItemName.trim() || priceValue <= 0 || savingPrice} className="w-full py-4 text-base">
              {savingPrice ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingItem ? "Atualizar Tabela" : "Salvar na Tabela"}
            </GoldButton>
          </div>
        </Modal>
      )}

      {selectedMember && selectedClan && (
        <MemberProfileModal
          clanId={selectedClan.clan.id}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
