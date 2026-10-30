/**
 * Sistema de Achievements baseado em COMPORTAMENTO no app,
 * não em dados do jogo (para evitar falsificação).
 */

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "onboarding" | "consistency" | "exploration" | "social";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Onboarding
  { id: "first_hunt",     name: "Primeira Hunt",       description: "Salvou seu primeiro registro.",       icon: "⚔️", category: "onboarding" },
  { id: "equipped",       name: "Equipado",            description: "Cadastrou um personagem.",            icon: "🛡️", category: "onboarding" },
  { id: "team_player",    name: "Parte do Time",       description: "Entrou ou criou um clã.",             icon: "👥", category: "onboarding" },
  { id: "social",         name: "Rede Social",         description: "Adicionou um amigo.",                 icon: "🤝", category: "onboarding" },
  { id: "identity",       name: "Identidade",          description: "Editou o perfil pela primeira vez.",  icon: "✏️", category: "onboarding" },

  // Consistência
  { id: "10_hunts",       name: "Caçador Dedicado",    description: "Salvou 10 registros.",                icon: "🎯", category: "consistency" },
  { id: "50_hunts",       name: "Maratonista",         description: "Salvou 50 registros.",                icon: "🏃", category: "consistency" },
  { id: "100_hunts",      name: "Lendário",            description: "Salvou 100 registros.",               icon: "👑", category: "consistency" },
  { id: "week_streak",    name: "Semana Produtiva",    description: "Registros em 5 dias de uma semana.",  icon: "📅", category: "consistency" },
  { id: "veteran_30d",    name: "Veterano",            description: "Conta criada há mais de 30 dias.",    icon: "🏅", category: "consistency" },

  // Exploração
  { id: "10_creatures",   name: "Explorador",          description: "Caçou 10 criaturas diferentes.",      icon: "🔍", category: "exploration" },
  { id: "25_creatures",   name: "Colecionador",        description: "Caçou 25 criaturas diferentes.",      icon: "📚", category: "exploration" },
  { id: "5_stages",       name: "Bestiário Iniciante", description: "Completou Stage 1 de 5 criaturas.",   icon: "📖", category: "exploration" },
  { id: "5_titles",       name: "Planejador",          description: "Deu título a 5 registros.",           icon: "🏷️", category: "exploration" },

  // Social
  { id: "leader",         name: "Líder",               description: "Criou um clã.",                       icon: "👑", category: "social" },
  { id: "recruiter",      name: "Recrutador",          description: "Convidou 3 membros ao clã.",          icon: "📣", category: "social" },
  { id: "connected",      name: "Bem Conectado",       description: "Tem 5 amigos no app.",                icon: "🌐", category: "social" },
  { id: "price_setter",   name: "Precificador",        description: "Definiu preços de 5 itens no clã.",   icon: "💰", category: "social" },
];

export const CATEGORY_LABEL: Record<string, string> = {
  onboarding: "Primeiros Passos",
  consistency: "Consistência",
  exploration: "Exploração",
  social: "Social",
};
