import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const goldBtnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/40 bg-gradient-to-b from-gold-400 to-gold-600 font-bold text-night-950 shadow-[0_6px_28px_-8px_rgba(212,168,67,0.55)] transition-all duration-200 hover:shadow-[0_8px_36px_-6px_rgba(212,168,67,0.75)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50 disabled:hover:brightness-100";

export function GoldButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`${goldBtnBase} px-4 py-2.5 text-sm ${className}`} />;
}

export function GoldLink({
  className = "",
  href,
  children,
}: {
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${goldBtnBase} px-4 py-2.5 text-sm ${className}`}>
      {children}
    </Link>
  );
}

export function OutlineButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-night-600 bg-night-800/60 px-3.5 py-2 text-xs font-semibold text-ink-muted transition-all duration-200 hover:border-gold-500/40 hover:text-gold-300 disabled:pointer-events-none disabled:opacity-40 ${className}`}
    />
  );
}

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = "",
  contentClassName = "p-4 sm:p-5",
  delay = 0,
}: {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
}) {
  return (
    <section
      className={`animate-fade-up overflow-hidden rounded-xl border border-night-700 bg-night-850 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.7)] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-night-700/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/10">
                <Icon className="h-3.5 w-3.5 text-gold-400" strokeWidth={2.2} />
              </span>
            )}
            <div>
              <h2 className="text-sm font-bold text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/20 bg-gold-500/5 text-gold-400/90 shadow-[0_0_36px_-10px_rgba(212,168,67,0.4)]">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <p className="text-sm font-bold text-ink">{title}</p>
      {message && <p className="max-w-sm text-xs leading-relaxed text-ink-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-night-700 bg-night-850 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <div className="h-2.5 w-20 rounded bg-night-750" />
          <div className="h-7 w-28 rounded bg-night-750" />
          <div className="h-2 w-24 rounded bg-night-750/70" />
        </div>
        <div className="h-10 w-10 rounded-lg bg-night-750" />
      </div>
    </div>
  );
}

export function PanelSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-night-700 bg-night-850 p-5 ${className}`}>
      <div className="mb-4 space-y-2">
        <div className="h-3 w-32 rounded bg-night-750" />
        <div className="h-2 w-48 rounded bg-night-750/70" />
      </div>
      <div className="h-56 rounded-lg bg-night-750/50" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-night-700 bg-night-850">
      <div className="border-b border-night-700 px-5 py-4">
        <div className="h-3 w-36 rounded bg-night-750" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-3 w-24 rounded bg-night-750" />
            <div className="h-3 w-16 rounded bg-night-750/80" />
            <div className="ml-auto h-3 w-16 rounded bg-night-750/60" />
            <div className="h-3 w-16 rounded bg-night-750/60" />
            <div className="h-3 w-16 rounded bg-night-750" />
          </div>
        ))}
      </div>
    </div>
  );
}
