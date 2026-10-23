import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation"
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import type { AuthUser } from "@/types";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

function normalizeUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name,
    email: row.email,
    useClanPrices: row.useClanPrices,
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Hash de senha com scrypt (sem depender de libs externas). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

/** Verifica senha em tempo constante. */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(derived, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Cria a sessão no banco e grava o cookie seguro no navegador.
 * Chamar apenas dentro de Route Handlers / Server Actions.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ userId, tokenHash, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Destroi a sessão atual (se existir) e limpa o cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

/** Busca o usuário autenticado pela sessão atual. `null` = não autenticado. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;
  return normalizeUser(rows[0].user);
}

/** Igual ao getCurrentUser, mas redireciona para /login quando não autenticado. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Busca usuário por e-mail (case-insensitive). */
export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);
  return rows[0] ?? null;
}
