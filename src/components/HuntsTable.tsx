"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  Loader2,
  Save,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getActivityShortLabel } from "@/lib/activity";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import type { HuntWithItems } from "@/types";
import { EmptyState, GoldButton, GoldLink, OutlineButton } from "./ui";
import { Modal } from "./Modal";
import { HuntItemsWithRarity } from "./HuntItemsWithRarity";

interface HuntsTableProps {
  hunts: HuntWithItems[];
  expandable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  onRefresh?: () => void;
}

function extractKilledCreaturesWithQty(rawText: string | null): { name: string; qty: number; imageUrl: string }[] {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const RE_ITEM_QTYX = /^([\d,]+)\s*x\s+(.+)$/i;
  let inMonsters = false;
  const result: { name: string; qty: number; imageUrl: string }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^killed\s+monsters\s*:/i.test(line)) {
      inMonsters = true;
      continue;
    }
    if (/^looted\s+items\s*:/i.test(line)) {
      inMonsters = false;
      continue;
    }
    if (!inMonsters) continue;

    const m = line.match(RE_ITEM_QTYX);
    if (m) {
      const qty = parseInt(m[1].replace(/,/g, ""), 10) || 0;
      const name = m[2]
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      result.push({
        name,
        qty,
        imageUrl: `https://tibia.fandom.com/wiki/Special:FilePath/${encodeURIComponent(name)}.gif`,
      });
    }
  }

  return result;
}

function HuntDetailsModal({
  hunt,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: {
  hunt: HuntWithItems;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const d = new Date(hunt.createdAt);
  const pos = hunt.balance >= 0;
  const killed = extractKilledCreaturesWithQty(hunt.rawText);

  return (
    <Modal isOpen onClose={onClose} title="Detalhes do Registro">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-night-700/50 pb-4">
          <div>
            <h2 className="text-xl font-black text-ink">{hunt.title || "Registro sem título"}</h2>
            <p className="text-xs text-ink-muted">{Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="p-2 rounded-lg bg-night-800 border border-night-700 text-ink-muted hover:text-gold-400 hover:border-gold-500/30 transition-all"><Edit2 className="h-4 w-4" /></button>
            <button onClick={onDelete} disabled={deleting} className="p-2 rounded-lg bg-night-800 border border-night-700 text-red-400/60 hover:text-red-400 hover:border-red-500/30 transition-all">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-night-900/60 border border-night-700/50">
            <p className="text-[9px] font-bold text-ink-muted uppercase mb-1">Profit</p>
            <p className={`text-sm font-black ${pos ? "text-green-400" : "text-red-400"}`}>{formatSignedGP(hunt.balance)}</p>
          </div>
          <div className="p-3 rounded-xl bg-night-900/60 border border-night-700/50">
            <p className="text-[9px] font-bold text-ink-muted uppercase mb-1">Loot</p>
            <p className="text-sm font-black text-green-400">{formatGP(hunt.loot)}</p>
          </div>
          <div className="p-3 rounded-xl bg-night-900/60 border border-night-700/50">
            <p className="text-[9px] font-bold text-ink-muted uppercase mb-1">Duração</p>
            <p className="text-sm font-black text-ink">{hunt.duration}</p>
          </div>
        </div>

        {hunt.description && (
          <div className="rounded-xl border border-gold-500/10 bg-gold-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3 w-3 text-gold-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gold-500/80">Descrição</span>
            </div>
            <p className="text-sm text-ink/90 leading-relaxed italic">&quot;{hunt.description}&quot;</p>
          </div>
        )}

        {/* Criaturas mortas */}
        {killed.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-400/80" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">Criaturas Derrotadas</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {killed.map((mob) => (
                <div key={mob.name} className="rounded-xl border border-night-700 bg-night-900/50 p-3 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-night-950/70 border border-night-700 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mob.imageUrl}
                      alt={mob.name}
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackStep) {
                          img.dataset.fallbackStep = "1";
                          img.src = `https://tibia.fandom.com/wiki/Special:FilePath/${encodeURIComponent(mob.name)}.png`;
                        } else {
                          img.src = "https://tibia.fandom.com/wiki/Special:FilePath/Question_Mark.gif";
                        }
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-ink">{mob.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-red-400">{formatFull(mob.qty)} kills</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itens */}
        <div>
          <HuntItemsWithRarity 
            huntId={hunt.id}
            items={hunt.items.map(i => ({ name: i.name, qty: i.qty }))}
            creatures={hunt.killedCreatures ?? []}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-night-700/50 text-[11px] text-ink-muted/80">
          <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-gold-500/60" /> XP: {formatFull(hunt.xpGain)}</span>
          <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-gold-500/60" /> XP/h: {formatFull(hunt.xpPerHour)}</span>
        </div>
      </div>
    </Modal>
  );
}

function EditHuntModal({ hunt, isOpen, onClose, onSuccess }: { hunt: HuntWithItems; isOpen: boolean; onClose: () => void; onSuccess: () => void; }) {
  const [title, setTitle] = useState(hunt.title || "");
  const [description, setDescription] = useState(hunt.description || "");
  const [createdAt, setCreatedAt] = useState(new Date(hunt.createdAt).toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/hunts/${hunt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, createdAt }),
      });
      if (!res.ok) throw new Error();
      onSuccess();
      onClose();
    } catch {
      setError("Falha ao salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Registro">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-gold-500/50 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Data e Hora</label>
          <input type="datetime-local" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} className="w-full rounded-lg border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-gold-500/50 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-night-700 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-gold-500/50 focus:outline-none" />
        </div>
        {error && <p className="text-xs font-bold text-red-400">{error}</p>}
        <div className="flex gap-3 pt-2">
          <GoldButton onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar Alterações
          </GoldButton>
          <OutlineButton onClick={onClose} disabled={saving}>Cancelar</OutlineButton>
        </div>
      </div>
    </Modal>
  );
}

export function HuntsTable({ hunts, paginated = false, pageSize = 12, onRefresh }: HuntsTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedHunt, setSelectedHunt] = useState<HuntWithItems | null>(null);
  const [editingHunt, setEditingHunt] = useState<HuntWithItems | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(hunts.length / pageSize));

  useEffect(() => {
    setPage(1);
    setSelectedHunt(null);
  }, [hunts]);

  async function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este registro permanentemente?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/hunts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSelectedHunt(null);
      if (onRefresh) onRefresh();
      router.refresh();
    } catch {
      alert("Falha ao excluir registro.");
    } finally {
      setDeletingId(null);
    }
  }

  const visible = useMemo(() => {
    if (!paginated) return hunts;
    const start = (page - 1) * pageSize;
    return hunts.slice(start, start + pageSize);
  }, [hunts, paginated, page, pageSize]);

  if (hunts.length === 0) {
    return <EmptyState icon={Swords} title="Nenhum registro" message="Cadastre uma hunt ou rotação para começar." action={<GoldLink href="/new">Criar registro</GoldLink>} />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm border-separate border-spacing-y-2 px-1">
          <thead>
            <tr className="text-left">
              <th className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted opacity-50">Data / Atividade</th>
              <th className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted opacity-50">Duração</th>
              <th className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted opacity-50 text-right">Loot</th>
              <th className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted opacity-50 text-right">Gasto</th>
              <th className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted opacity-50 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((hunt) => {
              const d = new Date(hunt.createdAt);
              const pos = hunt.balance >= 0;
              return (
                <tr key={hunt.id} onClick={() => setSelectedHunt(hunt)} className="group cursor-pointer">
                  <td className="rounded-l-2xl border-y border-l border-night-700 bg-night-850 p-4 transition-all group-hover:border-gold-500/30 group-hover:bg-night-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-ink group-hover:text-gold-300 transition-colors">
                        {hunt.title || format(d, "dd/MM/yyyy HH:mm")}
                      </span>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="rounded-full border border-gold-500/20 bg-gold-500/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-gold-400/80">{getActivityShortLabel(hunt.activityType)}</span>
                        {hunt.character && <span className="rounded-full border border-night-700 bg-night-900 px-2 py-0.5 text-[9px] font-bold text-ink-muted">{hunt.character.name}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-night-700 bg-night-850 p-4 transition-all group-hover:border-gold-500/30 group-hover:bg-night-800"><span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted"><Clock className="h-3.5 w-3.5 text-gold-500/40" /> {hunt.duration}</span></td>
                  <td className="border-y border-night-700 bg-night-850 p-4 text-right transition-all group-hover:border-gold-500/30 group-hover:bg-night-800"><span className="text-sm font-black text-green-400">{formatGP(hunt.loot)}</span></td>
                  <td className="border-y border-night-700 bg-night-850 p-4 text-right transition-all group-hover:border-gold-500/30 group-hover:bg-night-800"><span className="text-sm font-black text-red-400">{formatGP(hunt.supplies)}</span></td>
                  <td className="rounded-r-2xl border-y border-r border-night-700 bg-night-850 p-4 text-right transition-all group-hover:border-gold-500/30 group-hover:bg-night-800">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm font-black ${pos ? "text-green-400" : "text-red-400"}`}>{formatSignedGP(hunt.balance)}</span>
                      <ChevronRight className="h-4 w-4 text-ink-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {paginated && pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-xl border border-night-700 bg-night-900 text-ink-muted disabled:opacity-30 hover:border-gold-500/40 transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-xs font-black text-ink uppercase tracking-widest">Página {page} de {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-xl border border-night-700 bg-night-900 text-ink-muted disabled:opacity-30 hover:border-gold-500/40 transition-colors"><ChevronRight className="h-5 w-5" /></button>
        </div>
      )}

      {selectedHunt && <HuntDetailsModal hunt={selectedHunt} onClose={() => setSelectedHunt(null)} onEdit={() => { setEditingHunt(selectedHunt); setSelectedHunt(null); }} onDelete={() => handleDelete(selectedHunt.id)} deleting={deletingId === selectedHunt.id} />}
      {editingHunt && <EditHuntModal hunt={editingHunt} isOpen={!!editingHunt} onClose={() => setEditingHunt(null)} onSuccess={() => { if (onRefresh) onRefresh(); router.refresh(); }} />}
    </div>
  );
}
