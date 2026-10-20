import type { Metadata } from "next";
import { NewHuntForm } from "@/components/NewHuntForm";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Novo Registro",
};

export const dynamic = "force-dynamic";

export default async function NewHuntPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="animate-fade-up mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">Registrar sessão</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Novo <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Registro</span>
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Salve tanto <span className="font-semibold text-ink">lucros de hunts</span> quanto <span className="font-semibold text-ink">rotações de bosses</span>. Escolha o tipo do registro, cole o Hunt Analyser, confira o preview e vincule ao personagem correto.
        </p>
      </header>
      <NewHuntForm />
    </div>
  );
}
