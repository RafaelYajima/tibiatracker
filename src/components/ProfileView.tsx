"use client";

import { useRouter } from "next/navigation";
import { useState, type ElementType, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Coins,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import type { AuthUser } from "@/types";
import { GoldButton, SectionCard } from "./ui";
import { Modal } from "./Modal";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon: ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-ink-muted/80 ml-1">{label}</label>
      <div className="relative group">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/50 group-focus-within:text-gold-400 transition-colors" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-night-700 bg-night-900/60 py-4 pl-12 pr-4 text-sm text-ink placeholder:text-ink-muted/30 transition-all duration-300 focus:border-gold-500/50 focus:bg-night-850 focus:outline-none focus:ring-4 focus:ring-gold-500/5"
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        setDeleteError(d.error ?? "Falha ao excluir.");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setDeleteError("Erro de conexão.");
    } finally {
      setDeleting(false);
    }
  }

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
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header Centralizado */}
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_40px_-8px_rgba(212,168,67,0.5)]">
           <ShieldCheck className="h-8 w-8 text-night-950" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl uppercase">
            Configurações
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Gerencie sua identidade e preferências de preço no TibiaTracker.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="animate-fade-up space-y-8" style={{ animationDelay: "100ms" }}>
        {/* Seção: Dados Pessoais */}
        <div className="space-y-5">
           <div className="flex items-center gap-2 px-2">
              <UserRound className="h-4 w-4 text-gold-500/80" />
              <h2 className="text-xs font-black uppercase tracking-widest text-ink">Informações Pessoais</h2>
           </div>
           <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome de Exibição" value={name} onChange={setName} placeholder="Seu nome" icon={UserRound} />
              <Field label="E-mail da Conta" value={email} onChange={setEmail} type="email" placeholder="voce@exemplo.com" icon={Mail} />
           </div>
        </div>

        {/* Seção: Preferências */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
              <Coins className="h-4 w-4 text-gold-500/80" />
              <h2 className="text-xs font-black uppercase tracking-widest text-ink">Market e Preços</h2>
          </div>
          <label className="flex items-center gap-5 rounded-2xl border border-night-700 bg-night-900/60 p-6 cursor-pointer hover:border-gold-500/30 transition-all group">
            <div className="relative flex h-6 w-11 shrink-0 items-center rounded-full bg-night-800 transition-colors group-hover:bg-night-750">
               <input
                type="checkbox"
                checked={useClanPrices}
                onChange={(e) => setUseClanPrices(e.target.checked)}
                className="peer absolute h-full w-full cursor-pointer opacity-0"
              />
              <div className={`h-4 w-4 translate-x-1 rounded-full bg-ink-muted transition-all peer-checked:translate-x-6 peer-checked:bg-gold-500 peer-checked:shadow-[0_0_10px_rgba(212,168,67,0.8)]`} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Priorizar preços do Clã</p>
              <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">Se ativado, os registros usarão a tabela do seu clã em vez dos seus preços pessoais.</p>
            </div>
          </label>
        </div>

        {/* Seção: Segurança */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-2">
              <Lock className="h-4 w-4 text-gold-500/80" />
              <h2 className="text-xs font-black uppercase tracking-widest text-ink">Segurança</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
             <Field label="Senha Atual" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="••••••••" icon={Lock} />
             <Field label="Nova Senha" value={newPassword} onChange={setNewPassword} type="password" placeholder="Mínimo 8 dígitos" icon={Lock} />
          </div>
          <p className="text-[10px] text-ink-muted px-2 italic">A senha atual é necessária apenas se você estiver alterando o e-mail ou definindo uma nova senha.</p>
        </div>

        {/* Footer de Ações */}
        <div className="pt-4 flex flex-col items-center gap-4">
          {error && <p className="text-sm font-bold text-red-400 bg-red-400/5 px-4 py-2 rounded-lg border border-red-400/10 w-full text-center">{error}</p>}
          {status === "saved" && (
            <p className="flex items-center gap-2 text-sm font-black text-green-400 bg-green-400/5 px-4 py-2 rounded-lg border border-green-400/10 w-full justify-center">
              <CheckCircle2 className="h-4 w-4" /> PERFIL ATUALIZADO
            </p>
          )}

          <GoldButton type="submit" disabled={status === "saving"} className="w-full py-5 text-base uppercase tracking-widest">
            {status === "saving" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <Save className="h-5 w-5" /> Salvar Alterações
              </>
            )}
          </GoldButton>
        </div>
      </form>

      {/* Exportar dados */}
      <div className="mt-12 animate-fade-up space-y-4" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-2 px-2">
          <Save className="h-4 w-4 text-gold-500/80" />
          <h2 className="text-xs font-black uppercase tracking-widest text-ink">Exportar Dados</h2>
        </div>
        <div className="rounded-2xl border border-night-700 bg-night-900/40 p-6 flex flex-wrap gap-3">
          <a href="/api/export?type=hunts&format=csv" download className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-800 px-4 py-2.5 text-xs font-bold text-ink hover:border-gold-500/30 hover:text-gold-300 transition-all">
            Hunts (CSV)
          </a>
          <a href="/api/export?type=hunts&format=json" download className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-800 px-4 py-2.5 text-xs font-bold text-ink hover:border-gold-500/30 hover:text-gold-300 transition-all">
            Hunts (JSON)
          </a>
          <a href="/api/export?type=bestiary&format=csv" download className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-800 px-4 py-2.5 text-xs font-bold text-ink hover:border-gold-500/30 hover:text-gold-300 transition-all">
            Bestiário (CSV)
          </a>
          <a href="/api/export?type=bestiary&format=json" download className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-800 px-4 py-2.5 text-xs font-bold text-ink hover:border-gold-500/30 hover:text-gold-300 transition-all">
            Bestiário (JSON)
          </a>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="mt-12 animate-fade-up space-y-4" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2 px-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-red-400">Zona de Perigo</h2>
        </div>
        <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-6">
          <p className="text-sm text-ink-muted mb-4">
            A exclusão da conta é <strong className="text-red-400">permanente e irreversível</strong>.
            Todos os seus registros, personagens, bestiário, amizades e configurações serão apagados.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-400/20"
          >
            <Trash2 className="h-4 w-4" /> Excluir minha conta
          </button>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <Modal isOpen onClose={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(null); }} title="Excluir Conta Permanentemente">
          <div className="space-y-5">
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-ink-muted leading-relaxed">
                <p className="font-bold text-red-400 mb-1">Atenção: ação irreversível!</p>
                <p>Todos os seus dados serão excluídos permanentemente: hunts, personagens, bestiário, amigos, clã e configurações.</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Digite sua senha para confirmar</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Sua senha atual"
                className="w-full rounded-xl border border-red-400/20 bg-night-950/80 px-4 py-3 text-sm text-ink focus:border-red-400/50 focus:outline-none"
              />
            </div>
            {deleteError && <p className="text-sm font-bold text-red-400">{deleteError}</p>}
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!deletePassword || deleting}
              className="w-full rounded-xl border border-red-400/40 bg-red-500 py-4 text-base font-black uppercase tracking-widest text-white transition-all hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "CONFIRMAR EXCLUSÃO DEFINITIVA"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
