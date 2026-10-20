"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Swords,
  UserRound,
} from "lucide-react";

function InputField({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  icon: React.ElementType;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          className="w-full rounded-xl border border-night-700 bg-night-900 py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted/40 transition-all duration-200 focus:border-gold-500/60 focus:bg-night-850 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        />
      </div>
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setError(null);

    try {
      const body = isRegister ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password };

      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string; user?: { name: string } };

      if (!res.ok) {
        setError(data.error ?? "Falha na autenticação. Tente novamente.");
        setStatus("idle");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px]">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_40px_-8px_rgba(212,168,67,0.7)]">
          <Swords className="h-8 w-8 text-night-950" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {isRegister ? "Criar conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {isRegister
              ? "Registre-se para acompanhar suas hunts e profit"
              : "Entre para ver suas hunts e estatísticas"}
          </p>
        </div>
      </div>

      {/* Card do formulário */}
      <div className="rounded-2xl border border-night-700 bg-night-850/80 p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {isRegister && (
            <InputField
              icon={UserRound}
              label="Seu nome"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Ex: Rafael"
              autoComplete="name"
            />
          )}

          <InputField
            icon={Mail}
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />

          <InputField
            icon={Lock}
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={isRegister ? "Mínimo 8 caracteres" : "Sua senha"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={8}
          />

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm font-medium text-red-400">{error}</p>
            </div>
          )}

          {/* Sucesso */}
          {status === "success" && (
            <div className="flex items-center gap-2.5 rounded-xl border border-green-400/25 bg-green-400/10 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
              <p className="text-sm font-medium text-green-400">
                {isRegister ? "Conta criada! Entrando…" : "Login realizado! Redirecionando…"}
              </p>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={status !== "idle"}
            className="relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-gold-500/40 bg-gradient-to-b from-gold-400 to-gold-600 py-3.5 text-base font-bold text-night-950 shadow-[0_8px_32px_-8px_rgba(212,168,67,0.6)] transition-all duration-200 hover:shadow-[0_12px_40px_-6px_rgba(212,168,67,0.8)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isRegister ? "Criando conta…" : "Entrando…"}
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {isRegister ? "Conta criada!" : "Login feito!"}
              </>
            ) : (
              <>{isRegister ? "Criar conta" : "Entrar"}</>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-night-700/80 pt-5 text-center text-sm text-ink-muted">
          {isRegister ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-bold text-gold-400 transition-colors hover:text-gold-300"
          >
            {isRegister ? "Entrar" : "Criar conta grátis"}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted/60">
        TibiaTracker · Boss Rotation Profit Tracker
      </p>
    </div>
  );
}
