"use client";

import { Calendar, Filter, Swords, Users } from "lucide-react";
import { ACTIVITY_OPTIONS, type ActivityFilterValue } from "@/lib/activity";
import { TIME_FILTERS, type TimeFilter } from "@/lib/time";
import { useCharacters } from "@/hooks/useCharacters";
import { getVocationMeta } from "@/lib/vocations";

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
        active
          ? "bg-gold-500/20 text-gold-300 shadow-[inset_0_0_12px_rgba(212,168,67,0.08)]"
          : "text-ink-muted hover:bg-night-750/60 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted/70">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="h-4 w-px bg-night-700/80" />
      <div className="flex flex-wrap items-center gap-1" role="tablist">
        {children}
      </div>
    </div>
  );
}

export function FilterBar({
  activity,
  onActivityChange,
  time,
  onTimeChange,
  character,
  onCharacterChange,
}: {
  activity: ActivityFilterValue;
  onActivityChange: (v: ActivityFilterValue) => void;
  time: TimeFilter;
  onTimeChange: (v: TimeFilter) => void;
  character: string;
  onCharacterChange: (v: string) => void;
}) {
  const { characters } = useCharacters();

  return (
    <div className="animate-fade-up rounded-xl border border-night-700 bg-night-850/70 px-4 py-3" style={{ animationDelay: "60ms" }}>
      <div className="flex flex-col gap-2.5">
        {/* Linha 1: Tipo + Período (lado a lado em telas maiores) */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-6">
          <FilterRow label="Tipo" icon={Swords}>
            <PillButton active={activity === "all"} onClick={() => onActivityChange("all")}>
              Todos
            </PillButton>
            {ACTIVITY_OPTIONS.map((opt) => (
              <PillButton key={opt.value} active={activity === opt.value} onClick={() => onActivityChange(opt.value)}>
                {opt.shortLabel}
              </PillButton>
            ))}
          </FilterRow>

          <div className="hidden h-5 w-px bg-night-700/60 sm:block" />

          <FilterRow label="Período" icon={Calendar}>
            {TIME_FILTERS.map((f) => (
              <PillButton key={f.value} active={time === f.value} onClick={() => onTimeChange(f.value)}>
                {f.label}
              </PillButton>
            ))}
          </FilterRow>
        </div>

        {/* Linha 2: Personagens (somente se houver pelo menos 1 cadastrado) */}
        {characters.length > 0 && (
          <div className="border-t border-night-700/50 pt-2.5">
            <FilterRow label="Char" icon={Users}>
              <PillButton active={character === "all"} onClick={() => onCharacterChange("all")}>
                Todos
              </PillButton>
              {characters.map((c) => {
                const meta = getVocationMeta(c.vocation);
                const active = character === c.id;
                return (
                  <PillButton key={c.id} active={active} onClick={() => onCharacterChange(c.id)}>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: meta.color,
                          boxShadow: active ? `0 0 6px ${meta.color}` : "none",
                        }}
                      />
                      {c.name}
                    </span>
                  </PillButton>
                );
              })}
            </FilterRow>
          </div>
        )}
      </div>
    </div>
  );
}
