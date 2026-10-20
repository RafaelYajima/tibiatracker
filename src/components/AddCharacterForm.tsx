"use client";

import { useState, type FormEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CircleAlert, Loader2, Search, ShieldCheck, UserRoundPlus } from "lucide-react";
import type { CharacterWithStats, TibiaCharacterInfo } from "@/types";
import { getVocationMeta } from "@/lib/vocations";
import { GoldButton, OutlineButton } from "./ui";

interface ApiErrorBody {
  error?: string;
}

/** Card de preview com os dados vindos da TibiaData API. */
function TibiaPreview({ info }: { info: TibiaCharacterInfo }) {
  const meta = getVocationMeta(info.vocation);
  const Icon = meta.icon;
  const lastLogin = info.lastLogin ? new Date(info.lastLogin) : null;

  return (
    <div className="animate-fade-up rounded-xl border border-gold-500/25 bg-night-900/70 p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          style={{ backgroundColor: `${meta.color}1f`, borderColor: `${meta.color}55`, color: meta.color }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{info.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">
            <span className="font-bold text-gold-400">Lvl {info.level}</span>
            {info.vocation ? ` · ${info.vocation}` : ""}
            {info.world ? ` · ${info.world}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-muted/90">
            {info.residence && (
              <span>
                Residência: <span className="font-semibold text-ink">{info.residence}</span>
              </span>
            )}
            {info.guild && (
              <span>
                Guild: <span className="font-semibold text-ink">{info.guild}</span>
              </span>
            )}
            {info.accountStatus && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-gold-500/80" /> {info.accountStatus}
              </span>
            )}
          </div>
          {lastLogin && !Number.isNaN(lastLogin.getTime()) && (
            <p className="mt-1.5 text-[10px] text-ink-muted/70">
              Último login {formatDistanceToNow(lastLogin, { addSuffix: true, locale: ptBR })}
            </p>
          )}
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-400/15 text-green-400">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}

/**
 * Formulário "Buscar na TibiaData API → preview → Adicionar".
 * Reutilizado na página Personagens e dentro do seletor da Nova Hunt.
 */
export function AddCharacterForm({
  onAdded,
  compact = false,
}: {
  onAdded?: (character: CharacterWithStats) => void;
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<TibiaCharacterInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e?: FormEvent) {
    e?.preventDefault();
    const query = name.trim();
    if (query.length < 2 || searching) return;

    setSearching(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/characters/lookup?name=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as ApiErrorBody & { character?: TibiaCharacterInfo };
      if (!res.ok || !data.character) {
        setError(data.error ?? "Não foi possível buscar o personagem.");
        return;
      }
      setInfo(data.character);
    } catch (err) {
      console.error("[AddCharacterForm] lookup", err);
      setError("Falha de conexão ao buscar o personagem.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd() {
    if (!info || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: info.name }),
      });
      const data = (await res.json()) as ApiErrorBody & { character?: CharacterWithStats };
      if (!res.ok || !data.character) {
        setError(data.error ?? "Não foi possível cadastrar o personagem.");
        return;
      }
      onAdded?.(data.character);
      setName("");
      setInfo(null);
    } catch (err) {
      console.error("[AddCharacterForm] add", err);
      setError("Falha de conexão ao cadastrar o personagem.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setInfo(null);
              setError(null);
            }}
            placeholder="Nome exato do boneco (ex: Sir Rolie)"
            maxLength={40}
            className={`w-full rounded-lg border border-night-700 bg-night-950/80 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/45 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 ${compact ? "py-2.5" : "py-3"}`}
          />
        </div>
        <GoldButton type="submit" disabled={name.trim().length < 2 || searching} className={compact ? "" : "px-5"}>
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" strokeWidth={2.4} /> Buscar
            </>
          )}
        </GoldButton>
      </form>

      {error && (
        <p className="animate-fade-up mt-3 flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3.5 py-2.5 text-xs font-semibold text-red-400">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}

      {info && (
        <div className="mt-3">
          <TibiaPreview info={info} />
          <div className="mt-3 flex items-center gap-2">
            <GoldButton onClick={handleAdd} disabled={saving} className="flex-1 sm:flex-none">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cadastrando…
                </>
              ) : (
                <>
                  <UserRoundPlus className="h-4 w-4" strokeWidth={2.4} /> Adicionar personagem
                </>
              )}
            </GoldButton>
            <OutlineButton
              onClick={() => {
                setInfo(null);
                setName("");
              }}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      )}
    </div>
  );
}
