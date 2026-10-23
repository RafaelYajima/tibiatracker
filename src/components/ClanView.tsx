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

          {/* Últimas hunts */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Últimas sessões</p>
            {profile.recentHunts.length === 0 ? (
              <p className="text-xs text-ink-muted">Nenhuma sessão registrada.</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
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
    <div>
      {/* Header */}
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">Social</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Seu <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Clã</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Sincronize preços de itens e acompanhe o desempenho do seu time.
          </p>
        </div>
        {clans.length === 0 && !loading && (
          <GoldButton onClick={() => setShowCreate((v) => !v)} className="shrink-0">
            {showCreate ? <><X className="h-4 w-4" /> Cancelar</> : <><Plus className="h-4 w-4" /> Criar Clã</>}
          </GoldButton>
        )}
      </header>

      {/* Criar clã */}
      {showCreate && clans.length === 0 && (
        <div className="animate-fade-up mt-6">
          <SectionCard title="Fundar Clã" subtitle="Você será o dono e poderá convidar os membros do time" icon={Swords}>
            <form onSubmit={createClan} className="flex gap-3">
              <input
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                placeholder="Nome do clã (ex: Team Rotation)"
                className="flex-1 rounded-xl border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-gold-500/50 focus:outline-none"
              />
              <GoldButton type="submit" disabled={clanName.trim().length < 2 || creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Fundar
              </GoldButton>
            </form>
          </SectionCard>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="mt-6">
        {loading || loadingClan ? (
          <SectionCard contentClassName="py-20 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-gold-400" />
            <p className="mt-3 text-xs text-ink-muted">Carregando clã…</p>
          </SectionCard>
        ) : clans.length === 0 ? (
          <SectionCard contentClassName="p-0">
            <EmptyState
              icon={Swords}
              title="Você não está em nenhum clã"
              message="Peça para o líder da sua rotação enviar um convite para o seu e-mail, ou funde um novo clã acima."
            />
          </SectionCard>
        ) : selectedClan ? (
          <div className="space-y-6">
            {/* Banner do Clã */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold-500/15 bg-gradient-to-br from-night-850 to-night-900 p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 border border-gold-500/20">
                  <Crown className="h-7 w-7 text-gold-400" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-ink">{selectedClan.clan.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${roleBadge(selectedClan.myRole)}`}>
                      {roleLabel[selectedClan.myRole] ?? selectedClan.myRole}
                    </span>
                    <span className="text-[11px] text-ink-muted">{selectedClan.members.length} membros</span>
                  </div>
                </div>
              </div>
              {!isOwner && (
                <OutlineButton onClick={() => handleLeaveOrKick(selectedClan.members.find((m) => m.userId === selectedClan.members.find((mm) => mm.role === selectedClan.myRole)?.userId)?.userId ?? "", true)} className="hover:!border-red-400/40 hover:!text-red-400">
                  Sair do clã
                </OutlineButton>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Tabela de Preços */}
              <SectionCard
                title="Tabela de Preços"
                subtitle={`${priceEntries.length} ${priceEntries.length === 1 ? "item cadastrado" : "itens cadastrados"}`}
                icon={Coins}
                actions={
                  canManage ? (
                    <GoldButton onClick={() => openPriceModal()} className="px-3 py-1.5 text-[10px]">
                      <Plus className="h-3 w-3" /> Adicionar
                    </GoldButton>
                  ) : undefined
                }
              >
                {priceEntries.length === 0 ? (
                  <div className="py-8 text-center">
                    <Coins className="mx-auto h-8 w-8 text-night-700 mb-2" strokeWidth={1} />
                    <p className="text-xs text-ink-muted">
                      {canManage ? 'Clique em "Adicionar" para cadastrar os preços dos itens da rotação.' : "Nenhum preço cadastrado ainda."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {priceEntries.map(([name, price]) => {
                      const tier = getValueTier(price);
                      const meta = VALUE_TIER_META[tier];
                      return (
                        <div
                          key={name}
                          className="group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] transition-all"
                          style={{ background: meta.bg, border: `1px solid ${meta.border}`, boxShadow: meta.glow }}
                        >
                          <button
                            type="button"
                            onClick={() => canManage && openPriceModal({ name, price })}
                            className={canManage ? "cursor-pointer" : "cursor-default"}
                          >
                            <span className="font-medium text-ink">{name}</span>
                            <span className="ml-1.5 font-extrabold" style={{ color: meta.color }}>
                              {formatGP(price)}
                            </span>
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => removePrice(name)}
                              disabled={removingItem === name}
                              className="opacity-0 group-hover:opacity-100 ml-0.5 -mr-1 rounded p-0.5 text-ink-muted hover:text-red-400 transition-all"
                              title="Remover item"
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

              {/* Membros */}
              <SectionCard
                title={`Membros (${selectedClan.members.length})`}
                subtitle="Clique no nome para ver o perfil e os registros"
                icon={Users}
                contentClassName="p-0"
                actions={
                  canManage ? (
                    <form onSubmit={inviteMember} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                        placeholder="E-mail do membro"
                        className="w-36 rounded-lg border border-night-700 bg-night-950/80 px-3 py-1.5 text-[11px] text-ink focus:border-gold-500/50 focus:outline-none sm:w-44"
                      />
                      <GoldButton type="submit" disabled={!inviteEmail.trim() || inviting} className="px-3 py-1.5 text-[10px]">
                        {inviting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Convidar"}
                      </GoldButton>
                    </form>
                  ) : undefined
                }
              >
                {inviteError && (
                  <p className="border-b border-night-700/40 px-5 py-2 text-xs font-bold text-red-400">{inviteError}</p>
                )}
                <div className="divide-y divide-night-700/40">
                  {selectedClan.members.map((m) => (
                    <div key={m.id} className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-night-800/30">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(m)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-night-700 bg-night-800 text-ink-muted">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink group-hover:text-gold-300 transition-colors">
                            {m.name}
                          </p>
                          <p className="truncate text-[10px] text-ink-muted">{m.email}</p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${roleBadge(m.role)}`}>
                          {roleLabel[m.role] ?? m.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedMember(m)}
                          className="opacity-0 group-hover:opacity-100 flex h-7 items-center gap-1 rounded-lg border border-night-700 bg-night-800 px-2 text-[9px] font-bold text-gold-400/80 transition-all hover:border-gold-500/30 hover:text-gold-300"
                        >
                          <Eye className="h-3 w-3" /> Ver
                        </button>
                        {canManage && m.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => handleLeaveOrKick(m.userId, false)}
                            className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all"
                            title="Expulsar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal: Definir Preço do Item */}
      {showPriceModal && selectedClan && (
        <Modal
          isOpen
          onClose={() => { setShowPriceModal(false); setPriceItemName(""); setPriceValue(0); setEditingItem(null); }}
          title={editingItem ? "Editar Preço do Item" : "Definir Preço do Item"}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Item</label>
              <ItemAutocomplete
                value={priceItemName}
                onChange={setPriceItemName}
                placeholder="Digite para buscar (ex: Silver Token)..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Preço no Market (gp)</label>
              <div className="relative">
                <input
                  type="number"
                  value={priceValue || ""}
                  onChange={(e) => setPriceValue(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ex: 55000"
                  min={0}
                  className="w-full rounded-xl border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-gold-500/50 focus:outline-none"
                />
              </div>
              {priceValue > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: priceTierMeta.color, boxShadow: priceTierMeta.glow }} />
                  <span className="text-[10px] font-bold" style={{ color: priceTierMeta.color }}>
                    {priceTierMeta.label} — {formatGP(priceValue)}
                  </span>
                </div>
              )}
            </div>
            <GoldButton onClick={savePrice} disabled={!priceItemName.trim() || priceValue <= 0 || savingPrice} className="w-full py-3">
              {savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingItem ? "Atualizar preço" : "Salvar preço do item"}
            </GoldButton>
          </div>
        </Modal>
      )}

      {/* Modal: Perfil do Membro */}
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
