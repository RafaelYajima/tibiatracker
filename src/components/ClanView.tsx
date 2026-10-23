"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  Coins,
  Crown,
  Loader2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Swords,
  Trash2,
  Users,
} from "lucide-react";
import { formatGP } from "@/lib/format";
import { getValueTier, VALUE_TIER_META } from "@/lib/itemrarity";
import { EmptyState, GoldButton, OutlineButton, SectionCard } from "./ui";
import { Modal } from "./Modal";

interface Clan {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
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
  const [priceItemName, setPriceItemName] = useState("");
  const [priceValue, setPriceValue] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    fetchClans();
  }, []);

  async function fetchClans() {
    setLoading(true);
    try {
      const res = await fetch("/api/clans");
      const data = await res.json();
      setClans(data.clans ?? []);
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
      if (res.ok) {
        setClanName("");
        setShowCreate(false);
        fetchClans();
      }
    } finally {
      setCreating(false);
    }
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
    } finally {
      setLoadingClan(false);
    }
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
      if (!res.ok) {
        setInviteError(data.error ?? "Falha ao convidar.");
        return;
      }
      setInviteEmail("");
      loadClan(selectedClan.clan.id);
    } finally {
      setInviting(false);
    }
  }

  async function savePrice() {
    if (!selectedClan || !priceItemName.trim() || savingPrice) return;
    setSavingPrice(true);
    try {
      await fetch(`/api/clans/${selectedClan.clan.id}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: priceItemName.trim(), price: priceValue }),
      });
      setPrices((prev) => ({ ...prev, [priceItemName.trim()]: priceValue }));
      setShowPriceModal(false);
      setPriceItemName("");
      setPriceValue(0);
    } finally {
      setSavingPrice(false);
    }
  }

  const canManage = selectedClan && ["owner", "admin"].includes(selectedClan.myRole);

  return (
    <div>
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">Social</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Seu <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Clã</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Crie ou participe de um clã para compartilhar preços de itens com seu time.
          </p>
        </div>
        <GoldButton onClick={() => setShowCreate(true)} className="shrink-0">
          <Plus className="h-4 w-4" /> Criar Clã
        </GoldButton>
      </header>

      {/* Criar clã */}
      {showCreate && (
        <div className="animate-fade-up mt-6">
          <SectionCard title="Criar novo Clã" icon={Swords}>
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
                Criar
              </GoldButton>
            </form>
          </SectionCard>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Lista de clãs */}
        <div className="lg:col-span-1">
          <SectionCard title="Meus Clãs" icon={Swords} contentClassName="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                <div className="h-12 animate-pulse rounded-xl bg-night-750/50" />
                <div className="h-12 animate-pulse rounded-xl bg-night-750/50" />
              </div>
            ) : clans.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="Nenhum clã"
                message="Crie um clã para compartilhar preços de itens com seu time."
              />
            ) : (
              <div className="divide-y divide-night-700/40">
                {clans.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadClan(c.id)}
                    className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-night-800/30 ${
                      selectedClan?.clan.id === c.id ? "bg-gold-500/5" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                      <p className="text-[10px] text-ink-muted">
                        {c.role === "owner" ? "Dono" : c.role === "admin" ? "Admin" : "Membro"}
                      </p>
                    </div>
                    {c.role === "owner" && <Crown className="h-3.5 w-3.5 text-gold-400" />}
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Detalhes do clã selecionado */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedClan && !loadingClan ? (
            <SectionCard contentClassName="py-16 text-center">
              <Swords className="mx-auto h-10 w-10 text-night-700 mb-3" strokeWidth={1} />
              <p className="text-ink-muted text-sm">Selecione um clã para gerenciar</p>
            </SectionCard>
          ) : loadingClan ? (
            <SectionCard contentClassName="py-16 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-400" />
            </SectionCard>
          ) : selectedClan ? (
            <>
              {/* Membros */}
              <SectionCard
                title={`Membros (${selectedClan.members.length})`}
                subtitle={selectedClan.clan.name}
                icon={Users}
                contentClassName="p-0"
                actions={
                  canManage ? (
                    <form onSubmit={inviteMember} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                        placeholder="E-mail do jogador"
                        className="w-40 rounded-lg border border-night-700 bg-night-950/80 px-3 py-1.5 text-[11px] text-ink focus:border-gold-500/50 focus:outline-none sm:w-56"
                      />
                      <GoldButton type="submit" disabled={!inviteEmail.trim() || inviting} className="px-2 py-1.5 text-[10px]">
                        {inviting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
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
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-gold-400/60" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">{m.name}</p>
                          <p className="truncate text-[10px] text-ink-muted">{m.email}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-night-700 bg-night-800 px-2 py-0.5 text-[9px] font-bold uppercase text-ink-muted">
                        {m.role === "owner" ? "Dono" : m.role === "admin" ? "Admin" : "Membro"}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Preços do clã */}
              <SectionCard
                title="Preços do Clã"
                subtitle="Preços compartilhados entre todos os membros"
                icon={Coins}
                actions={
                  canManage ? (
                    <OutlineButton onClick={() => setShowPriceModal(true)} className="text-[10px]">
                      <Plus className="h-3 w-3" /> Adicionar preço
                    </OutlineButton>
                  ) : undefined
                }
              >
                {Object.keys(prices).length === 0 ? (
                  <p className="py-6 text-center text-xs text-ink-muted">
                    Nenhum preço definido.{canManage ? " Clique em 'Adicionar preço' para começar." : ""}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(prices)
                      .sort(([, a], [, b]) => b - a)
                      .map(([name, price]) => {
                        const tier = getValueTier(price);
                        const meta = VALUE_TIER_META[tier];
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              if (canManage) {
                                setPriceItemName(name);
                                setPriceValue(price);
                                setShowPriceModal(true);
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] transition-all hover:-translate-y-0.5"
                            style={{
                              background: meta.bg,
                              border: `1px solid ${meta.border}`,
                              boxShadow: meta.glow,
                            }}
                          >
                            <span className="font-medium text-ink">{name}</span>
                            <span className="font-extrabold" style={{ color: meta.color }}>
                              {formatGP(price)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </SectionCard>
            </>
          ) : null}
        </div>
      </div>

      {/* Modal de preço */}
      {showPriceModal && selectedClan && (
        <Modal isOpen onClose={() => { setShowPriceModal(false); setPriceItemName(""); setPriceValue(0); }} title="Definir Preço do Clã">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Nome do Item</label>
              <input
                type="text"
                value={priceItemName}
                onChange={(e) => setPriceItemName(e.target.value)}
                placeholder="Ex: Silver Token"
                className="w-full rounded-xl border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-gold-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Preço (gp)</label>
              <input
                type="number"
                value={priceValue || ""}
                onChange={(e) => setPriceValue(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ex: 55000"
                min={0}
                className="w-full rounded-xl border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-gold-500/50 focus:outline-none"
              />
              {priceValue > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: VALUE_TIER_META[getValueTier(priceValue)].color }} />
                  <span className="text-[10px] font-bold" style={{ color: VALUE_TIER_META[getValueTier(priceValue)].color }}>
                    {VALUE_TIER_META[getValueTier(priceValue)].label} — {formatGP(priceValue)}
                  </span>
                </div>
              )}
            </div>
            <GoldButton onClick={savePrice} disabled={!priceItemName.trim() || savingPrice} className="w-full">
              {savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar preço para o clã
            </GoldButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
