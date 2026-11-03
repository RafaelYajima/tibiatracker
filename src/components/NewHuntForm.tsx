"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  ClipboardPaste,
  Clock,
  Eraser,
  Layers,
  Loader2,
  Package,
  Plus,
  Save,
  Sparkles,
  Swords,
  Trash2,
  TriangleAlert,
  UserRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTIVITY_OPTIONS, type ActivityType, getActivityShortLabel } from "@/lib/activity";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { parseHuntAnalyser, type ParsedHunt } from "@/lib/parser";
import { CharacterPicker } from "./CharacterPicker";
import { GoldButton, OutlineButton, SectionCard } from "./ui";

const PLACEHOLDER = `Cole aqui o texto do Hunt Analyser…

Exemplo (o que o client copia):
Session data: From 2026-10-19, 20:52:54 to ...
Session: 00:25h
XP Gain: 180,431
Loot: 757,866
Supplies: 255,875
Balance: 501,991
...
Killed Monsters:
  12x flimsy lost soul
Looted Items:
  2x a silver token`;

function InfoChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-night-700 bg-night-800/70 px-2.5 py-1.5 text-[11px]">
      <Icon className="h-3.5 w-3.5 text-gold-400" />
      <span className="text-ink-muted">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </span>
  );
}

function MiniStat({ label, value, valueClass, borderClass }: { label: string; value: string; valueClass: string; borderClass: string }) {
  return (
    <div className={`rounded-xl border bg-night-900/60 px-3 py-3 text-center ${borderClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className={`mt-1 truncate text-base font-extrabold sm:text-lg ${valueClass}`}>{value}</p>
    </div>
  );
}

function ParsedPreview({ parsed }: { parsed: ParsedHunt }) {
  const profitPositive = parsed.balance >= 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <InfoChip icon={Clock} label="Sessão" value={parsed.session} />
        <InfoChip icon={Zap} label="XP/h" value={formatFull(parsed.xpPerHour)} />
        <InfoChip icon={Sparkles} label="XP total" value={formatFull(parsed.xpGain)} />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat label="Loot" value={formatGP(parsed.loot)} valueClass="text-green-400" borderClass="border-green-400/20" />
        <MiniStat label="Supplies" value={formatGP(parsed.supplies)} valueClass="text-red-400" borderClass="border-red-400/20" />
        <MiniStat label="Profit" value={formatSignedGP(parsed.balance)} valueClass={profitPositive ? "text-green-400" : "text-red-400"} borderClass="border-gold-500/35" />
      </div>
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
          <Package className="h-3.5 w-3.5 text-gold-400" />
          {parsed.items.length === 0 ? "Nenhum item listado" : `${parsed.items.length} itens · ${parsed.killedCreatures.length} criaturas`}
        </p>
      </div>
    </div>
  );
}

/* ─── Tipo de um item na fila do Modo Rápido ─── */
interface QueueItem {
  id: number;
  text: string;
  parsed: ParsedHunt;
  title: string;
  description: string;
}

export function NewHuntForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<ActivityType>("boss_rotation");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  // Modo Rápido
  const [quickMode, setQuickMode] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchDone, setBatchDone] = useState(false);
  let nextId = queue.length > 0 ? Math.max(...queue.map((q) => q.id)) + 1 : 1;

  const trimmed = text.trim();
  const parsed = useMemo(() => (trimmed ? parseHuntAnalyser(trimmed) : null), [trimmed]);
  const invalid = trimmed.length > 0 && !parsed;

  async function saveOne(rawText: string, p: ParsedHunt, t: string, d: string) {
    const res = await fetch("/api/hunts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId,
        activityType,
        title: t.trim() || null,
        description: d.trim() || null,
        killedCreatures: p.killedCreatures,
        duration: p.session,
        loot: p.loot,
        supplies: p.supplies,
        balance: p.balance,
        xpGain: p.xpGain,
        xpPerHour: p.xpPerHour,
        rawText,
        items: p.items,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  /* ─── Modo Normal ─── */
  async function handleSave() {
    if (!parsed || status !== "idle") return;
    setStatus("saving");
    setError(null);
    try {
      await saveOne(text, parsed, title, description);
      setStatus("saved");
      setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
    } catch (err) {
      console.error("[NewHuntForm] save", err);
      setStatus("idle");
      setError("Não foi possível salvar o registro.");
    }
  }

  /* ─── Modo Rápido: adicionar à fila ─── */
  function addToQueue() {
    if (!parsed) return;
    setQueue((prev) => [...prev, { id: nextId, text, parsed, title, description }]);
    setText("");
    setTitle("");
    setDescription("");
  }

  function removeFromQueue(id: number) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  /* ─── Modo Rápido: salvar tudo ─── */
  async function handleBatchSave() {
    if (queue.length === 0 || !characterId || batchSaving) return;
    setBatchSaving(true);
    setError(null);
    try {
      for (const item of queue) {
        await saveOne(item.text, item.parsed, item.title, item.description);
      }
      setBatchDone(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
    } catch (err) {
      console.error("[NewHuntForm] batch save", err);
      setError("Falha ao salvar em lote. Alguns registros podem ter sido salvos.");
    } finally {
      setBatchSaving(false);
    }
  }

  return (
    <div>
      {/* Toggle de modo */}
      <div className="animate-fade-up mb-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => { setQuickMode(false); setQueue([]); }}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
            !quickMode ? "border-gold-500/40 bg-gold-500/10 text-gold-300" : "border-night-700 text-ink-muted hover:border-night-600"
          }`}
        >
          <Save className="h-4 w-4" /> Registro Único
        </button>
        <button
          type="button"
          onClick={() => setQuickMode(true)}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
            quickMode ? "border-gold-500/40 bg-gold-500/10 text-gold-300" : "border-night-700 text-ink-muted hover:border-night-600"
          }`}
        >
          <Layers className="h-4 w-4" /> Modo Rápido
        </button>
      </div>

      {/* Tipo de Registro */}
      <SectionCard title="Tipo de Registro" icon={Swords} contentClassName="p-4 sm:p-5" delay={40}>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACTIVITY_OPTIONS.map((option) => {
            const active = option.value === activityType;
            return (
              <button key={option.value} type="button" onClick={() => setActivityType(option.value)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${active ? "border-gold-500/45 bg-gold-500/10" : "border-night-700 bg-night-900/50 hover:border-night-600"}`}>
                <p className={`text-sm font-bold ${active ? "text-gold-300" : "text-ink"}`}>{option.label}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {option.value === "hunt" ? "Hunts normais e farm de lucro." : "GT, GD e rotações de bosses."}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Textarea + Preview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Hunt Analyser" subtitle="Ctrl+V direto do client" icon={ClipboardPaste} contentClassName="p-4 sm:p-5" delay={80}>
          <div className="relative">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={PLACEHOLDER} spellCheck={false} autoFocus
              className="h-[300px] w-full resize-none rounded-lg border border-night-700 bg-night-950/80 p-4 font-mono text-[12px] leading-relaxed text-ink placeholder:text-ink-muted/45 focus:border-gold-500/50 focus:outline-none" />
            <ClipboardList className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-ink-muted/40" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
            <span>{trimmed ? `${trimmed.split(/\r?\n/).length} linhas` : "Aguardando clipboard…"}</span>
            {text && (
              <button type="button" onClick={() => setText("")} className="inline-flex items-center gap-1.5 font-semibold hover:text-gold-300">
                <Eraser className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Preview" subtitle="Dados extraídos automaticamente" icon={Sparkles} contentClassName="p-4 sm:p-5" delay={140}>
          {!trimmed && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <ClipboardList className="h-10 w-10 text-night-700" strokeWidth={1.2} />
              <p className="text-sm font-bold text-ink">Preview instantâneo</p>
              <p className="max-w-xs text-xs text-ink-muted">Cole o Hunt Analyser ao lado.</p>
            </div>
          )}
          {invalid && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <TriangleAlert className="h-10 w-10 text-red-400/60" strokeWidth={1.2} />
              <p className="text-sm font-bold text-ink">Texto não reconhecido</p>
              <p className="max-w-xs text-xs text-ink-muted">Confira se copiou o texto completo.</p>
            </div>
          )}
          {parsed && <ParsedPreview parsed={parsed} />}
        </SectionCard>
      </div>

      {/* Título + Descrição */}
      <SectionCard className="mt-6" title="Informações" icon={ClipboardList} contentClassName="p-4 sm:p-5" delay={160}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Rotação GT de Terça"
              className="w-full rounded-lg border border-night-700 bg-night-950/80 px-4 py-2.5 text-sm text-ink focus:border-gold-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Descrição (opcional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Time completo"
              className="w-full rounded-lg border border-night-700 bg-night-950/80 px-4 py-2.5 text-sm text-ink focus:border-gold-500/50 focus:outline-none" />
          </div>
        </div>
      </SectionCard>

      {/* Personagem */}
      <SectionCard className="mt-6" title="Personagem" icon={UserRound} contentClassName="p-4 sm:p-5" delay={200}>
        <CharacterPicker value={characterId} onChange={setCharacterId} />
      </SectionCard>

      {/* ─── Modo Normal: Salvar ─── */}
      {!quickMode && (
        <div className="animate-fade-up mt-6" style={{ animationDelay: "240ms" }}>
          <GoldButton onClick={handleSave} disabled={!parsed || !characterId || status !== "idle"}
            className={`w-full py-3.5 text-base ${status === "saved" ? "!border-green-400/50 !from-green-400 !to-green-600" : ""}`}>
            {status === "saving" ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</> :
             status === "saved" ? <><Check className="h-5 w-5" /> Salvo! Redirecionando…</> :
             <><Save className="h-5 w-5" /> Salvar Registro</>}
          </GoldButton>
          {parsed && !characterId && status === "idle" && <p className="mt-3 text-center text-xs font-semibold text-gold-400/90">Selecione um personagem acima.</p>}
          {error && <p className="mt-3 text-center text-xs font-semibold text-red-400">{error}</p>}
        </div>
      )}

      {/* ─── Modo Rápido: Fila + Salvar Tudo ─── */}
      {quickMode && (
        <div className="animate-fade-up mt-6 space-y-4" style={{ animationDelay: "240ms" }}>
          {/* Botão de adicionar à fila */}
          <OutlineButton onClick={addToQueue} disabled={!parsed} className="w-full py-3 text-sm">
            <Plus className="h-4 w-4" /> Adicionar à fila ({queue.length} {queue.length === 1 ? "registro" : "registros"})
          </OutlineButton>

          {/* Lista da fila */}
          {queue.length > 0 && (
            <div className="rounded-2xl border border-night-700 bg-night-900/40 overflow-hidden">
              <div className="border-b border-night-700/60 px-5 py-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Fila de registros</p>
                <p className="text-xs font-bold text-gold-400">{queue.length} na fila</p>
              </div>
              <div className="divide-y divide-night-700/40 max-h-64 overflow-y-auto">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{item.title || item.parsed.session}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-[10px] text-ink-muted">
                        <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{item.parsed.session}</span>
                        <span className="text-green-400">{formatGP(item.parsed.loot)}</span>
                        <span className={item.parsed.balance >= 0 ? "text-green-400" : "text-red-400"}>{formatSignedGP(item.parsed.balance)}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromQueue(item.id)} className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de salvar tudo */}
          <GoldButton onClick={handleBatchSave} disabled={queue.length === 0 || !characterId || batchSaving || batchDone}
            className={`w-full py-4 text-base ${batchDone ? "!border-green-400/50 !from-green-400 !to-green-600" : ""}`}>
            {batchSaving ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando {queue.length} registros…</> :
             batchDone ? <><CheckCircle2 className="h-5 w-5" /> Tudo salvo! Redirecionando…</> :
             <><Save className="h-5 w-5" /> Salvar {queue.length} {queue.length === 1 ? "Registro" : "Registros"} de Uma Vez</>}
          </GoldButton>
          {queue.length > 0 && !characterId && <p className="text-center text-xs font-semibold text-gold-400/90">Selecione um personagem acima.</p>}
          {error && <p className="text-center text-xs font-semibold text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
