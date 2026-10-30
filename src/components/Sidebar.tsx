"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardPaste,
  Compass,
  History,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Swords,
  Trophy,
  UserRound,
  Users,
  Users2,
  X,
} from "lucide-react";
import type { AuthUser } from "@/types";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new", label: "Novo Registro", icon: ClipboardPaste },
  { href: "/history", label: "Histórico", icon: History },
  { href: "/bestiary", label: "Bestiário", icon: Trophy },
  { href: "/hunts", label: "Guia de Hunts", icon: Compass },
  { href: "/characters", label: "Personagens", icon: Users },
  { href: "/friends", label: "Amigos", icon: Users2 },
  { href: "/clan", label: "Clã", icon: Swords },
  { href: "/profile", label: "Perfil", icon: Settings },
] as const;

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_28px_-6px_rgba(212,168,67,0.55)]">
        <Swords className="h-5 w-5 text-night-950" strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight text-ink">
          Tibia<span className="text-gold-400">Tracker</span>
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-muted">
          Hunts & Bosses
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5 px-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "border-gold-500/25 bg-gold-500/10 text-gold-300 shadow-[inset_0_0_24px_rgba(212,168,67,0.07)]"
                : "border-transparent text-ink-muted hover:border-night-700 hover:bg-night-800 hover:text-ink"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400 shadow-[0_0_10px_rgba(212,168,67,0.8)]" />
            )}
            <Icon
              className={`h-[18px] w-[18px] transition-colors duration-200 ${
                active ? "text-gold-400" : "text-ink-muted group-hover:text-gold-500/80"
              }`}
              strokeWidth={2.2}
            />
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" />}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountCard({ user }: { user: AuthUser }) {
  return (
    <div className="rounded-xl border border-night-700 bg-night-850/80 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10">
          <ShieldCheck className="h-4.5 w-4.5 text-gold-400" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{user.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-night-700/80 pt-3">
        <Link
          href="/profile"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-gold-500/30 hover:text-gold-300"
        >
          <UserRound className="h-3.5 w-3.5" /> Perfil
        </Link>
        <LogoutButton />
      </div>
      <p className="mt-3 text-[10px] text-ink-muted/70">Conta protegida · seus dados são separados por usuário</p>
    </div>
  );
}

export function Sidebar({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-night-700 bg-night-900/70 backdrop-blur-xl lg:flex">
        <div className="px-6 pb-8 pt-7">
          <Logo />
        </div>
        <NavLinks />
        <div className="mt-auto px-4 pb-6 pt-8">
          <AccountCard user={user} />
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-night-700 bg-night-950/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-night-700 bg-night-850 text-ink-muted transition-colors hover:border-gold-500/30 hover:text-gold-400"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[84vw] flex-col border-r border-night-700 bg-night-900 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 pb-8 pt-5">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-night-700 text-ink-muted transition-colors hover:border-gold-500/30 hover:text-gold-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-auto px-4 pb-6 pt-8">
            <AccountCard user={user} />
          </div>
        </aside>
      </div>
    </>
  );
}
