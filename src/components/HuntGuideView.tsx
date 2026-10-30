"use client";

import { useState } from "react";
import { 
  BadgeCheck, 
  ChevronRight, 
  Compass, 
  Filter, 
  Map as MapIcon, 
  ShieldCheck, 
  Sparkles, 
  Swords, 
  Zap 
} from "lucide-react";
import { SectionCard } from "./ui";

const HUNT_GUIDES: any[] = [
  {
    name: "Gazer Spectres",
    level: "250+",
    vocation: ["Druid", "Knight", "Paladin"],
    description: "Excelente profit e XP médio. Requer resistência a fogo.",
    difficulty: "Hard",
    exp: "Medium",
    profit: "High",
    location: "Port Hope (Haunted Temple)",
  },
  {
    name: "Pirats (Wreckoning)",
    level: "150+",
    vocation: ["Knight", "Paladin", "Druid", "Sorcerer"],
    description: "Loot absurdo em itens de criatura. Ótimo para solos ou duplas.",
    difficulty: "Medium",
    exp: "Medium",
    profit: "High",
    location: "Bounac",
  },
  {
    name: "Werelions",
    level: "300+",
    vocation: ["Knight", "Paladin"],
    description: "Melhor spot de profit/XP equilibrado para level médio.",
    difficulty: "Hard",
    exp: "High",
    profit: "High",
    location: "Darashia",
  },
  {
    name: "Carnivoras' Rocks",
    level: "200+",
    vocation: ["Druid", "Sorcerer"],
    description: "Paraíso dos mages. Profit puro em gold direto.",
    difficulty: "Medium",
    exp: "Medium",
    profit: "High",
    location: "Port Hope",
  },
  {
    name: "Mirror (Asura Palace)",
    level: "400+",
    vocation: ["Knight", "Paladin", "Druid"],
    description: "XP altíssima. Risco alto de morte sem time.",
    difficulty: "Hardcore",
    exp: "High",
    profit: "Medium",
    location: "Tiquanda",
  },
  {
    name: "Ancient Scarabs",
    level: "50+",
    vocation: ["Druid", "Sorcerer"],
    description: "Melhor XP para mages low level. Use magias de gelo.",
    difficulty: "Medium",
    exp: "High",
    profit: "Low",
    location: "Mother of Scarabs Lair",
  }
];

function DifficultyBadge({ level }: { level: string }) {
  const colors: any = { Easy: "text-green-400 bg-green-400/10", Medium: "text-blue-400 bg-blue-400/10", Hard: "text-purple-400 bg-purple-400/10", Hardcore: "text-red-400 bg-red-400/10" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/5 ${colors[level]}`}>
      {level}
    </span>
  );
}

export function HuntGuideView() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      <header className="animate-fade-up text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-teal-600 shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)] text-white">
          <Compass className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Guia de <span className="text-green-400">Hunts</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-lg mx-auto">
            Sugestões de locais para caçar baseado em performance e feedback da comunidade.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {HUNT_GUIDES.map((hunt, i) => (
          <div 
            key={hunt.name}
            className="animate-fade-up group flex flex-col rounded-3xl border border-night-700 bg-night-850 overflow-hidden hover:border-green-500/30 transition-all shadow-xl"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <DifficultyBadge level={hunt.difficulty} />
                  <h3 className="text-xl font-black text-ink group-hover:text-green-400 transition-colors">{hunt.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-muted uppercase">
                    <MapIcon className="h-3 w-3" /> {hunt.location}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="text-[10px] font-black text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-lg border border-gold-500/20">{hunt.level}</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted line-clamp-2">{hunt.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {hunt.vocation.map((v: string) => (
                  <span key={v} className="px-2 py-0.5 rounded-md bg-night-900 border border-night-700 text-[9px] font-bold text-ink-muted/80">{v}</span>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 divide-x divide-night-700 border-t border-night-700">
               <div className="p-3 text-center">
                  <p className="text-[8px] font-black uppercase text-ink-muted/60 mb-1">Experiência</p>
                  <p className={`text-xs font-black ${hunt.exp === 'High' ? 'text-blue-400' : 'text-ink'}`}>{hunt.exp}</p>
               </div>
               <div className="p-3 text-center">
                  <p className="text-[8px] font-black uppercase text-ink-muted/60 mb-1">Lucro/Profit</p>
                  <p className={`text-xs font-black ${hunt.profit === 'High' ? 'text-green-400' : 'text-ink'}`}>{hunt.profit}</p>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
