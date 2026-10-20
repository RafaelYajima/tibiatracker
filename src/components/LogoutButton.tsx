"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

/** Encerra a sessão atual e redireciona para /login. */
export function LogoutButton({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-night-700 bg-night-850 px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-gold-500/30 hover:text-gold-300 ${
        mobile ? "w-full" : ""
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      Sair
    </button>
  );
}
