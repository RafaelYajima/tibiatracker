import type { TibiaCharacterInfo } from "@/types";

/**
 * Cliente da TibiaData API (v4) — API mantida pela comunidade que faz
 * proxy dos dados do site oficial do Tibia.
 *
 * Docs: https://tibiadata.com/docs/
 *
 * Estratégia: tenta o ambiente de produção primeiro; em caso de erro
 * de rede/5xx (o upstream tibia.com às vezes derruba a prod), faz
 * fallback para o ambiente de desenvolvimento (espelho cacheado).
 */

const HOSTS = ["https://api.tibiadata.com", "https://dev.tibiadata.com"];
const TIMEOUT_MS = 9_000;

interface TibiaDataCharacterResponse {
  character?: {
    character?: {
      name?: string;
      sex?: string;
      vocation?: string;
      level?: number;
      world?: string;
      residence?: string;
      last_login?: string;
      account_status?: string;
      guild?: { name?: string };
    };
  };
  information?: {
    status?: {
      http_code?: number;
      error?: number;
      message?: string;
    };
    message?: string;
  };
}

function normalize(data: TibiaDataCharacterResponse): TibiaCharacterInfo | null {
  const c = data?.character?.character;
  if (!c || typeof c.name !== "string" || !c.name) return null;
  return {
    name: c.name,
    sex: c.sex ?? null,
    vocation: c.vocation ?? null,
    level: typeof c.level === "number" && Number.isFinite(c.level) ? c.level : 0,
    world: c.world ?? null,
    residence: c.residence ?? null,
    guild: c.guild?.name ?? null,
    lastLogin: c.last_login ?? null,
    accountStatus: c.account_status ?? null,
  };
}

async function fetchFromHost(host: string, name: string): Promise<TibiaCharacterInfo | null> {
  const url = `${host}/v4/character/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "TibiaTracker/1.0 (github; boss-rotation-tracker)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // 404/422 => personagem não encontrado (ou nome inválido)
  if (res.status === 404 || res.status === 422) return null;
  // 5xx => instabilidade da API/upstream -> cai para o próximo host
  if (res.status >= 500) throw new Error(`TibiaData ${host} respondeu ${res.status}`);
  if (!res.ok) return null;

  const data = (await res.json()) as TibiaDataCharacterResponse;
  return normalize(data);
}

/**
 * Busca um personagem na TibiaData API.
 * Retorna `null` quando não encontrado; lança erro se a API estiver fora.
 */
export async function fetchTibiaCharacter(name: string): Promise<TibiaCharacterInfo | null> {
  let lastError: unknown = null;

  for (const host of HOSTS) {
    try {
      return await fetchFromHost(host, name);
    } catch (err) {
      lastError = err;
      console.warn(`[tibiadata] falha em ${host}:`, err);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("TibiaData API indisponível no momento.");
}
