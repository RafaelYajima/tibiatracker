"use client";

import { ACTIVITY_OPTIONS, type ActivityFilterValue } from "@/lib/activity";

export function ActivityFilter({
  value,
  onChange,
}: {
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtro de atividade">
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
          value === "all"
            ? "border-gold-500/45 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_-4px_rgba(212,168,67,0.45)]"
            : "border-night-700 bg-night-850 text-ink-muted hover:border-night-600 hover:bg-night-800 hover:text-ink"
        }`}
      >
        Todos
      </button>
      {ACTIVITY_OPTIONS.map((activity) => {
        const active = value === activity.value;
        return (
          <button
            key={activity.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(activity.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              active
                ? "border-gold-500/45 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_-4px_rgba(212,168,67,0.45)]"
                : "border-night-700 bg-night-850 text-ink-muted hover:border-night-600 hover:bg-night-800 hover:text-ink"
            }`}
          >
            {activity.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
