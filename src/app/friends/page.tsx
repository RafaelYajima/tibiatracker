import type { Metadata } from "next";
import { FriendsView } from "@/components/FriendsView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Amigos",
};

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500/80">Social</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Seus <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Amigos</span>
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Busque usuários pelo nome, troque convites e compartilhe seu progresso nas rotações.
        </p>
      </header>
      <FriendsView />
    </div>
  );
}
