export interface HuntItem {
  id: string;
  huntId: string;
  name: string;
  qty: number;
}

/** Personagem salvo localmente (dados vindos da TibiaData API). */
export interface Character {
  id: string;
  createdAt: string;
  name: string;
  world: string | null;
  vocation: string | null;
  level: number;
}

/** Personagem + agregados de hunts (usado na página Personagens). */
export interface CharacterWithStats extends Character {
  sessions: number;
  totalProfit: number;
  totalLoot: number;
  totalXp: number;
}

/** Referência enxuta embutida em cada hunt. */
export interface HuntCharacterRef {
  id: string;
  name: string;
  world: string | null;
  vocation: string | null;
}

export interface Hunt {
  id: string;
  createdAt: string;
  characterId: string | null;
  duration: string;
  loot: number;
  supplies: number;
  balance: number;
  xpGain: number;
  xpPerHour: number;
  rawText: string | null;
}

export interface HuntWithItems extends Hunt {
  items: HuntItem[];
  character: HuntCharacterRef | null;
}

export interface CreateHuntItemPayload {
  name: string;
  qty: number;
}

export interface CreateHuntPayload {
  characterId?: string | null;
  duration: string;
  loot: number;
  supplies: number;
  balance: number;
  xpGain: number;
  xpPerHour: number;
  rawText?: string;
  items: CreateHuntItemPayload[];
}

/** Dados de um personagem vindos da TibiaData API (antes de salvar). */
export interface TibiaCharacterInfo {
  name: string;
  sex: string | null;
  vocation: string | null;
  level: number;
  world: string | null;
  residence: string | null;
  guild: string | null;
  lastLogin: string | null;
  accountStatus: string | null;
}
