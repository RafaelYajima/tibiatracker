"use client";

import { TIME_FILTERS, type TimeFilter } from "@/lib/time";

export function TimeFilterPills({
  value,
  onChange,
}: {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtro de período">
      {TIME_FILTERS.map((filter) => {
        const active = filter.value === value;
        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              active
                ? "border-gold-500/45 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_-4px_rgba(212,168,67,0.45)]"
                : "border-night-700 bg-night-850 text-ink-muted hover:border-night-600 hover:bg-night-800 hover:text-ink"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
