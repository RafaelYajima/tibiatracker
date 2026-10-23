"use client";

import { useRouter } from "next/navigation";
import { useState, type ElementType, type FormEvent } from "react";
import { CheckCircle2, Loader2, Lock, Mail, Save, UserRound } from "lucide-react";
import type { AuthUser } from "@/types";
import { GoldButton, SectionCard } from "./ui";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon: ElementType;
}) {
  const Icon = icon;
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-night-700 bg-night-950/80 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/45 transition-colors focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
        />
      </div>
    </div>
  );
}

export function ProfileView({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [useClanPrices, setUseClanPrices] = useState(user.useClanPrices ?? false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "saving") return;

    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, currentPassword, newPassword, useClanPrices }),
      });
      const data = (await res.json()) as { error?: string; user?: AuthUser };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível atualizar o perfil.");
        setStatus("idle");
        return;
      }

      setStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
      setTimeout(() => setStatus("idle"), 1800);
    } catch (err) {
      console.error("[ProfileView]", err);
      setError("Falha de conexão. Tente novamente.");
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="animate-fade-up mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">Sua conta</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Perfil{" "}
          <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">do usuário</span>
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Atualize seu nome, e-mail e senha. Para trocar e-mail ou senha, informe sua senha atual.
        </p>
      </header>

      <SectionCard title="Dados da conta" subtitle="Informações usadas para login e identificação" icon={UserRound}>
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <Field
            label="Nome"
            value={name}
            onChange={setName}
            placeholder="Seu nome"
            autoComplete="name"
            icon={UserRound}
          />
          <Field
            label="E-mail"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            icon={Mail}
          />
          <Field
            label="Senha atual"
            value={currentPassword}
            onChange={setCurrentPassword}
            type="password"
            placeholder="Obrigatória para trocar e-mail ou senha"
            autoComplete="current-password"
            icon={Lock}
          />
          <Field
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            placeholder="Deixe em branco para não alterar"
            autoComplete="new-password"
            icon={Lock}
          />

          <div className="md:col-span-2 mt-2">
            <label className="flex items-center gap-3 rounded-xl border border-night-700 bg-night-900/40 p-4 cursor-pointer hover:border-gold-500/30 transition-colors">
              <input
                type="checkbox"
                checked={useClanPrices}
                onChange={(e) => setUseClanPrices(e.target.checked)}
                className="h-5 w-5 rounded border-night-700 bg-night-950 text-gold-500 focus:ring-gold-500/50"
              />
              <div>
                <p className="text-sm font-bold text-ink">Usar preços do clã</p>
                <p className="text-xs text-ink-muted">Se ativado, os registros vão ignorar seus preços customizados e usar a tabela de preços do seu clã.</p>
              </div>
            </label>
          </div>

          <div className="md:col-span-2">
            {error && <p className="mb-3 text-sm font-semibold text-red-400">{error}</p>}
            {status === "saved" && (
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Perfil atualizado com sucesso.
              </p>
            )}

            <GoldButton type="submit" disabled={status === "saving"} className="w-full py-3 text-base sm:w-auto sm:px-6">
              {status === "saving" ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Save className="h-4.5 w-4.5" /> Salvar alterações
                </>
              )}
            </GoldButton>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
