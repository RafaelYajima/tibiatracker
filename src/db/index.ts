import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const configuredMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
const maxConnections = Number.isFinite(configuredMax) && configuredMax > 0
  ? configuredMax
  : process.env.NODE_ENV === "production"
    ? 1
    : 5;

const globalForDb = globalThis as typeof globalThis & {
  __tibiaTrackerPostgresqlPool?: Pool;
};

/**
 * Na Vercel, cada instância serverless mantém no máximo uma conexão com o
 * Transaction Pooler do Supabase (porta 6543). Isso evita esgotar o limite
 * do plano gratuito. Em desenvolvimento, o padrão é 5.
 */
export const pool =
  globalForDb.__tibiaTrackerPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: maxConnections,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__tibiaTrackerPostgresqlPool = pool;
}

export const db = drizzle(pool);
