"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Medal, Trophy } from "lucide-react";
import { ACHIEVEMENTS, CATEGORY_LABEL, type AchievementDef } from "@/lib/achievements";

export function AchievementsView() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => setUnlocked(new Set(data.unlocked ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;
  const categories = [...new Set(ACHIEVEMENTS.map((a) => a.category))];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <header className="animate-fade-up text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_40px_-8px_rgba(212,168,67,0.5)]">
          <Medal className="h-8 w-8 text-night-950" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Suas <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Conquistas</span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted max-w-md mx-auto">
            Desbloqueie conquistas usando o app e acompanhe seu progresso.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : (
        <>
          {/* Progresso geral */}
          <div className="animate-fade-up rounded-2xl border border-night-700 bg-night-900/50 p-6 text-center">
            <p className="text-4xl font-black text-gold-400">{unlockedCount} <span className="text-lg text-ink-muted/60">/ {ACHIEVEMENTS.length}</span></p>
            <div className="mt-3 mx-auto max-w-sm h-3 overflow-hidden rounded-full bg-night-950 border border-night-700">
              <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-1000" style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-muted">{Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% concluído</p>
          </div>

          {/* Categorias */}
          {categories.map((cat) => {
            const items = ACHIEVEMENTS.filter((a) => a.category === cat);
            return (
              <div key={cat} className="animate-fade-up space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-ink-muted/60 px-1">
                  {CATEGORY_LABEL[cat] ?? cat}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((achievement) => {
                    const done = unlocked.has(achievement.id);
                    return (
                      <div
                        key={achievement.id}
                        className={`group rounded-2xl border p-5 transition-all ${
                          done
                            ? "border-gold-500/30 bg-gold-500/5 hover:border-gold-500/50"
                            : "border-night-700 bg-night-900/40 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`text-3xl ${done ? "" : "grayscale opacity-40"}`}>{achievement.icon}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`font-black ${done ? "text-ink" : "text-ink-muted/60"}`}>{achievement.name}</p>
                            <p className="mt-0.5 text-xs text-ink-muted/70">{achievement.description}</p>
                          </div>
                          {done ? (
                            <Trophy className="h-5 w-5 text-gold-400 shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 text-ink-muted/30 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
