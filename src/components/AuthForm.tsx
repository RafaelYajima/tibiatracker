"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { GoldButton } from "./ui";

/** Card reutilizado para login e cadastro. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Falha na autenticação.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("[AuthForm]", err);
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-up rounded-2xl border border-night-700 bg-night-850/95 p-6 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.85)] sm:p-7">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_28px_-6px_rgba(212,168,67,0.55)]">
          <ShieldCheck className="h-7 w-7 text-night-950" strokeWidth={2.2} />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">
          TibiaTracker
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
          {isRegister ? "Criar conta" : "Entrar"}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {isRegister
            ? "Crie sua conta para organizar hunts, personagens e profit por usuário."
            : "Entre para ver apenas suas hunts, personagens e estatísticas."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Nome</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-night-700 bg-night-950/80 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/45 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-muted">E-mail</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-night-700 bg-night-950/80 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/45 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Senha</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "Mínimo 8 caracteres" : "Sua senha"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={8}
              className="w-full rounded-lg border border-night-700 bg-night-950/80 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/45 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            />
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

        <GoldButton type="submit" disabled={loading} className="w-full py-3 text-base">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Processando…
            </>
          ) : (
            <>{isRegister ? "Criar conta" : "Entrar"}</>
          )}
        </GoldButton>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        {isRegister ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-bold text-gold-400 transition-colors hover:text-gold-300"
        >
          {isRegister ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </div>
  );
}
