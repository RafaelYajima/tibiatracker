import type { ActivityType } from "@/lib/activity";

export interface AuthUser {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  useClanPrices: boolean;
}

export interface HuntItem {
  id: string;
  huntId: string;
  name: string;
  qty: number;
}

export interface Character {
  id: string;
  createdAt: string;
  name: string;
  world: string | null;
  vocation: string | null;
  level: number;
}

export interface CharacterWithStats extends Character {
  sessions: number;
  totalProfit: number;
  totalLoot: number;
  totalXp: number;
}

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
  activityType: ActivityType;
  title: string | null;
  description: string | null;
  killedCreatures: string[];
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
  activityType: ActivityType;
  title?: string;
  description?: string;
  killedCreatures?: string[];
  duration: string;
  loot: number;
  supplies: number;
  balance: number;
  xpGain: number;
  xpPerHour: number;
  rawText?: string;
  items: CreateHuntItemPayload[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export interface UpdateAccountPayload {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  useClanPrices?: boolean;
}

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

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface Friendship {
  id: string;
  createdAt: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted";
  friend?: UserSummary;
}
