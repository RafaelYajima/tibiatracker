import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { bestiary, characters, clanItemPrices, clanMembers, clans, friendships, hunts, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/achievements";

export const dynamic = "force-dynamic";

/** GET /api/achievements — calcula quais achievements o usuário desbloqueou. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const uid = user.id;

    // Queries paralelas para performance
    const [
      huntCountResult,
      charCountResult,
      clanMemberResult,
      friendCountResult,
      bestiaryCountResult,
      bestiaryStage1Result,
      titledHuntsResult,
      clanPricesResult,
      clanOwnedResult,
      clanMembersCountResult,
      weekDaysResult,
      userRow,
    ] = await Promise.all([
      db.select({ c: count() }).from(hunts).where(eq(hunts.userId, uid)),
      db.select({ c: count() }).from(characters).where(eq(characters.userId, uid)),
      db.select({ c: count() }).from(clanMembers).where(eq(clanMembers.userId, uid)),
      db.select({ c: count() }).from(friendships).where(and(eq(friendships.status, "accepted"), sql`(${friendships.userId} = ${uid} OR ${friendships.friendId} = ${uid})`)),
      db.select({ c: count() }).from(bestiary).where(eq(bestiary.userId, uid)),
      db.select({ c: count() }).from(bestiary).where(and(eq(bestiary.userId, uid), gte(bestiary.totalKills, 25))),
      db.select({ c: count() }).from(hunts).where(and(eq(hunts.userId, uid), sql`${hunts.title} IS NOT NULL AND ${hunts.title} != ''`)),
      db.select({ c: count() }).from(clanItemPrices).innerJoin(clanMembers, and(eq(clanMembers.clanId, clanItemPrices.clanId), eq(clanMembers.userId, uid))),
      db.select({ c: count() }).from(clans).where(eq(clans.ownerId, uid)),
      db.select({ c: count() }).from(clanMembers).innerJoin(clans, and(eq(clans.id, clanMembers.clanId), eq(clans.ownerId, uid))),
      db.execute(sql`SELECT COUNT(DISTINCT DATE(created_at AT TIME ZONE 'UTC')) as days FROM hunts WHERE user_id = ${uid} AND created_at > NOW() - INTERVAL '7 days'`),
      db.select().from(users).where(eq(users.id, uid)).limit(1),
    ]);

    const huntCount = Number(huntCountResult[0]?.c ?? 0);
    const charCount = Number(charCountResult[0]?.c ?? 0);
    const inClan = Number(clanMemberResult[0]?.c ?? 0) > 0;
    const friendCount = Number(friendCountResult[0]?.c ?? 0);
    const bestiaryCount = Number(bestiaryCountResult[0]?.c ?? 0);
    const bestiaryStage1 = Number(bestiaryStage1Result[0]?.c ?? 0);
    const titledHunts = Number(titledHuntsResult[0]?.c ?? 0);
    const clanPrices = Number(clanPricesResult[0]?.c ?? 0);
    const ownsClan = Number(clanOwnedResult[0]?.c ?? 0) > 0;
    const clanMembersCount = Number(clanMembersCountResult[0]?.c ?? 0);
    const weekDays = Number((weekDaysResult.rows?.[0] as any)?.days ?? 0);
    const accountAge = userRow[0] ? (Date.now() - new Date(userRow[0].createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;

    const unlocked = new Set<string>();

    if (huntCount >= 1)   unlocked.add("first_hunt");
    if (charCount >= 1)   unlocked.add("equipped");
    if (inClan)           unlocked.add("team_player");
    if (friendCount >= 1) unlocked.add("social");
    if (huntCount >= 10)  unlocked.add("10_hunts");
    if (huntCount >= 50)  unlocked.add("50_hunts");
    if (huntCount >= 100) unlocked.add("100_hunts");
    if (weekDays >= 5)    unlocked.add("week_streak");
    if (accountAge >= 30) unlocked.add("veteran_30d");
    if (bestiaryCount >= 10) unlocked.add("10_creatures");
    if (bestiaryCount >= 25) unlocked.add("25_creatures");
    if (bestiaryStage1 >= 5) unlocked.add("5_stages");
    if (titledHunts >= 5)    unlocked.add("5_titles");
    if (ownsClan)            unlocked.add("leader");
    if (clanMembersCount >= 4) unlocked.add("recruiter"); // 3 convidados + o dono = 4
    if (friendCount >= 5)    unlocked.add("connected");
    if (clanPrices >= 5)     unlocked.add("price_setter");

    // "identity" — difícil de checar sem flag, vamos considerar se o nome não é o default
    // Simplificação: se o usuário já usou o app há mais de 1 dia, assume que editou algo
    if (accountAge >= 1 && huntCount >= 1) unlocked.add("identity");

    return NextResponse.json({
      unlocked: Array.from(unlocked),
      total: ACHIEVEMENTS.length,
    });
  } catch (error) {
    console.error("[GET /api/achievements]", error);
    return NextResponse.json({ error: "Falha ao carregar conquistas." }, { status: 500 });
  }
}
