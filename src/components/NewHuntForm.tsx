"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardList,
  ClipboardPaste,
  Clock,
  Eraser,
  Loader2,
  Package,
  Save,
  Sparkles,
  Swords,
  TriangleAlert,
  UserRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTIVITY_OPTIONS, type ActivityType } from "@/lib/activity";
import { formatFull, formatGP, formatSignedGP } from "@/lib/format";
import { parseHuntAnalyser, type ParsedHunt } from "@/lib/parser";
import { CharacterPicker } from "./CharacterPicker";
import { GoldButton, SectionCard } from "./ui";

const PLACEHOLDER = `Cole aqui o texto do Hunt Analyser…

Exemplo (o que o client copia):
Session data: From 2026-10-19, 20:52:54 to ...
Session: 00:25h
XP Gain: 180,431
XP/h: 417,179
Loot: 757,866
Supplies: 255,875
Balance: 501,991
...
Killed Monsters:
  12x flimsy lost soul
Looted Items:
  2x a silver token
  3x a gold token
  96x a royal star`;

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
          {parsed.items.length === 0 ? "Nenhum item listado no texto" : `${parsed.items.length} ${parsed.items.length === 1 ? "item detectado" : "itens detectados"}`}
        </p>
        {parsed.items.length > 0 && (
          <div className="mt-2.5 grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {parsed.items.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2 rounded-md border border-night-700 bg-night-800/70 px-2.5 py-1.5">
                <span className="truncate text-[11px] text-ink" title={item.name}>{item.name}</span>
                <span className="shrink-0 text-[11px] font-extrabold text-gold-400">{formatFull(item.qty)}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

  const trimmed = text.trim();
  const parsed = useMemo(() => (trimmed ? parseHuntAnalyser(trimmed) : null), [trimmed]);
  const invalid = trimmed.length > 0 && !parsed;

  async function handleSave() {
    if (!parsed || status !== "idle") return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/hunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          activityType,
          title: title.trim() || null,
          description: description.trim() || null,
          killedCreatures: parsed.killedCreatures,
          duration: parsed.session,
          loot: parsed.loot,
          supplies: parsed.supplies,
          balance: parsed.balance,
          xpGain: parsed.xpGain,
          xpPerHour: parsed.xpPerHour,
          rawText: text,
          items: parsed.items,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("saved");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("[NewHuntForm] save", err);
      setStatus("idle");
      setError("Não foi possível salvar o registro. Verifique a conexão e tente novamente.");
    }
  }

  return (
    <div>
      <SectionCard
        title="Tipo de Registro"
        subtitle="Separe lucros de hunts tradicionais das rotações de bosses"
        icon={Swords}
        contentClassName="p-4 sm:p-5"
        delay={40}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {ACTIVITY_OPTIONS.map((option) => {
            const active = option.value === activityType;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setActivityType(option.value)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  active ? "border-gold-500/45 bg-gold-500/10 shadow-[0_0_18px_-6px_rgba(212,168,67,0.5)]" : "border-night-700 bg-night-900/50 hover:border-night-600 hover:bg-night-800/70"
                }`}
              >
                <p className={`text-sm font-bold ${active ? "text-gold-300" : "text-ink"}`}>{option.label}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {option.value === "hunt" ? "Use para hunts normais e farm de lucro." : "Use para GT, GD e outras rotações de bosses."}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Hunt Analyser" subtitle="Ctrl+V direto do client do Tibia" icon={ClipboardPaste} contentClassName="p-4 sm:p-5" delay={80}>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              autoFocus
              className="h-[340px] w-full resize-none rounded-lg border border-night-700 bg-night-950/80 p-4 font-mono text-[12px] leading-relaxed text-ink placeholder:text-ink-muted/45 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            />
            <ClipboardList className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-ink-muted/40" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
            <span>{trimmed ? `${trimmed.split(/\r?\n/).length} linhas coladas` : "Aguardando o texto do clipboard…"}</span>
            {text && (
              <button type="button" onClick={() => setText("")} className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-gold-300">
                <Eraser className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Preview" subtitle="Dados extraídos automaticamente do texto" icon={Sparkles} contentClassName="p-4 sm:p-5" delay={140}>
          {!trimmed && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-night-700 bg-night-800 text-gold-400/70">
                <ClipboardList className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-bold text-ink">Preview instantâneo</p>
              <p className="max-w-xs text-xs leading-relaxed text-ink-muted">Cole o texto do Hunt Analyser ao lado e os dados de loot, supplies e profit aparecem aqui automaticamente.</p>
            </div>
          )}

          {invalid && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/25 bg-red-400/10 text-red-400">
                <TriangleAlert className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-bold text-ink">Texto não reconhecido</p>
              <p className="max-w-xs text-xs leading-relaxed text-ink-muted">Não encontrei os campos <span className="font-mono text-ink">Session:</span> e <span className="font-mono text-ink">Balance:</span>. Confira se você copiou o texto completo do Hunt Analyser.</p>
            </div>
          )}

          {parsed && <ParsedPreview parsed={parsed} />}
        </SectionCard>
      </div>

      <SectionCard className="mt-6" title="Informações do Registro" subtitle="Adicione um título e descrição para identificar esta sessão" icon={ClipboardList} contentClassName="p-4 sm:p-5" delay={160}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Rotação GT de Terça"
              className="w-full rounded-lg border border-night-700 bg-night-950/80 px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/45 focus:border-gold-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Time completo, loot bom"
              className="w-full rounded-lg border border-night-700 bg-night-950/80 px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/45 focus:border-gold-500/50 focus:outline-none"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard className="mt-6" title="Personagem" subtitle="A qual boneco pertencem esses ganhos? O profit fica organizado por char." icon={UserRound} contentClassName="p-4 sm:p-5" delay={200}>
        <CharacterPicker value={characterId} onChange={setCharacterId} />
      </SectionCard>

      <div className="animate-fade-up mt-6" style={{ animationDelay: "240ms" }}>
        <GoldButton onClick={handleSave} disabled={!parsed || !characterId || status !== "idle"} className={`w-full py-3.5 text-base ${status === "saved" ? "!border-green-400/50 !from-green-400 !to-green-600" : ""}`}>
          {status === "saving" ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Salvando…</>
          ) : status === "saved" ? (
            <><Check className="h-5 w-5" strokeWidth={2.6} /> Salvo! Redirecionando…</>
          ) : (
            <><Save className="h-5 w-5" strokeWidth={2.2} /> Salvar Registro</>
          )}
        </GoldButton>
        {parsed && !characterId && status === "idle" && <p className="mt-3 text-center text-xs font-semibold text-gold-400/90">Selecione um personagem acima para habilitar o salvamento.</p>}
        {error && <p className="mt-3 text-center text-xs font-semibold text-red-400">{error}</p>}
      </div>
    </div>
  );
}
