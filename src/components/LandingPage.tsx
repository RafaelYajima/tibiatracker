"use client";

import Link from "next/link";
import { Activity, BarChart3, Clock, Coins, Flame, Gem, ShieldCheck, Swords, Users2 } from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="group animate-fade-up relative overflow-hidden rounded-3xl border border-night-700 bg-night-900/60 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-night-600 hover:bg-night-850 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: color }}
      />
      <div
        className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundColor: `${color}1A`, borderColor: `${color}33`, color }}
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h3 className="mb-3 text-xl font-extrabold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decorations */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(#d4a843 1px, transparent 1px), linear-gradient(90deg, #d4a843 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-8 relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-[0_0_30px_-5px_rgba(212,168,67,0.5)]">
              <Swords className="h-5 w-5 text-night-950" strokeWidth={2.4} />
            </span>
            <span className="hidden text-xl font-extrabold tracking-tight text-ink sm:block">
              Tibia<span className="text-gold-400">Tracker</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gold-500/40 bg-gradient-to-b from-gold-400 to-gold-600 px-5 text-sm font-bold text-night-950 shadow-[0_4px_20px_-6px_rgba(212,168,67,0.5)] transition-all hover:scale-105 hover:shadow-[0_8px_30px_-6px_rgba(212,168,67,0.7)]"
            >
              Começar grátis
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 pt-20 pb-32 text-center lg:pt-32 lg:pb-40">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-400 mb-8">
            <Flame className="h-3.5 w-3.5" /> Aposente o bloco de notas
          </div>
          
          <h1 className="animate-fade-up mx-auto max-w-4xl text-5xl font-black tracking-tight text-ink sm:text-7xl" style={{ animationDelay: "100ms" }}>
            A forma definitiva de{" "}
            <span className="relative whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-700">
              rastrear seu profit
            </span>
          </h1>
          
          <p className="animate-fade-up mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl" style={{ animationDelay: "200ms" }}>
            Cole o texto do Hunt Analyser direto do client e deixe o resto com a gente. 
            Valores de mercado integrados com o TibiaWiki, preços customizados por clã e históricos perfeitos de todas as suas sessões e bosses.
          </p>

          <div className="animate-fade-up mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row" style={{ animationDelay: "300ms" }}>
            <Link
              href="/register"
              className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-gold-500/40 bg-gradient-to-b from-gold-400 to-gold-600 px-8 text-base font-bold text-night-950 shadow-[0_8px_32px_-8px_rgba(212,168,67,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-6px_rgba(212,168,67,0.8)]"
            >
              Criar Conta Gratuita <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <div className="relative z-10 border-t border-night-700/50 bg-night-950/50 py-24 backdrop-blur-sm lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-ink sm:text-4xl">Tudo que seu time precisa</h2>
            <p className="mt-4 text-ink-muted">Ferramentas projetadas para facilitar a vida nas rotações e farm.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Activity}
              title="Parsing Inteligente"
              description="Esqueça a calculadora. Cole o Hunt Analyser e o sistema extrai loot, gasto, XP e a lista completa de itens instantaneamente."
              color="#4ade80"
              delay={100}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Sistema de Clã"
              description="Crie seu grupo, convide os membros da sua rotação e sincronize uma tabela única de preços de mercado para todo o time."
              color="#d4a843"
              delay={200}
            />
            <FeatureCard
              icon={Gem}
              title="Valores e Raridades"
              description="Integração ao vivo com a TibiaWiki. Os itens são avaliados, coloridos por tier (comum a muito raro) e somados automaticamente."
              color="#c084fc"
              delay={300}
            />
            <FeatureCard
              icon={Users2}
              title="Conexão de Amigos"
              description="Adicione outros jogadores, acompanhe o histórico deles e comparem seus loots e profits lado a lado."
              color="#60a5fa"
              delay={400}
            />
            <FeatureCard
              icon={BarChart3}
              title="Dashboards Visuais"
              description="Gráficos interativos para ver o crescimento do seu profit por dia, semana ou mês. Saiba quais itens você mais dropa."
              color="#f87171"
              delay={500}
            />
            <FeatureCard
              icon={Clock}
              title="Zero Configuração"
              description="Funciona direto no navegador ou no celular. Interface totalmente escura, otimizada e sem distrações."
              color="#8888a0"
              delay={600}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-night-700/50 bg-night-950 py-12 text-center text-sm text-ink-muted">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale">
           <Swords className="h-4 w-4" />
        </div>
        <p>TibiaTracker © {new Date().getFullYear()} — Boss Rotation Profit Tracker</p>
        <p className="mt-2 text-[11px] opacity-60">Não possuímos afiliação com a CipSoft GmbH. Tibia é uma marca registrada.</p>
      </footer>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
