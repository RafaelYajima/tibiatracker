import type { LucideIcon } from "lucide-react";

type Tone = "gold" | "green" | "red" | "blue";

const TONES: Record<Tone, { icon: string; glow: string; hover: string }> = {
  gold: {
    icon: "border-gold-500/25 bg-gold-500/10 text-gold-400",
    glow: "radial-gradient(9rem 9rem at 88% -10%, rgba(212,168,67,0.13), transparent 70%)",
    hover: "hover:border-gold-500/35",
  },
  green: {
    icon: "border-green-400/25 bg-green-400/10 text-green-400",
    glow: "radial-gradient(9rem 9rem at 88% -10%, rgba(74,222,128,0.11), transparent 70%)",
    hover: "hover:border-green-400/35",
  },
  red: {
    icon: "border-red-400/25 bg-red-400/10 text-red-400",
    glow: "radial-gradient(9rem 9rem at 88% -10%, rgba(248,113,113,0.11), transparent 70%)",
    hover: "hover:border-red-400/35",
  },
  blue: {
    icon: "border-blue-400/25 bg-blue-400/10 text-blue-400",
    glow: "radial-gradient(9rem 9rem at 88% -10%, rgba(96,165,250,0.11), transparent 70%)",
    hover: "hover:border-blue-400/35",
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  valueClassName,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone: Tone;
  valueClassName?: string;
  delay?: number;
}) {
  const t = TONES[tone];
  return (
    <article
      className={`animate-fade-up group relative overflow-hidden rounded-xl border border-night-700 bg-night-850 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-18px_rgba(0,0,0,0.8)] sm:p-5 ${t.hover}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={{ background: t.glow }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-[11px]">
            {label}
          </p>
          <p
            className={`mt-2 truncate text-xl font-extrabold tracking-tight sm:text-2xl ${
              valueClassName ?? "text-ink"
            }`}
          >
            {value}
          </p>
          {sub && <p className="mt-1 truncate text-[10px] text-ink-muted/80 sm:text-[11px]">{sub}</p>}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10 ${t.icon}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
        </span>
      </div>
    </article>
  );
}
