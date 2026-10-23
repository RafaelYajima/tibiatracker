import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { clanMembers, huntItems, hunts, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/clans/:id/members/:userId/profile
 * Retorna o perfil público (stats + últimas hunts) de um membro do clã.
 * Qualquer membro do mesmo clã pode visualizar.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id: clanId, userId } = await ctx.params;

    // Verifica se quem pede é membro do clã
    const myMembership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, me.id)))
      .limit(1);

    if (myMembership.length === 0) {
      return NextResponse.json({ error: "Você não é membro deste clã." }, { status: 403 });
    }

    // Verifica se o alvo também é membro do clã
    const targetMembership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, userId)))
      .limit(1);

    if (targetMembership.length === 0) {
      return NextResponse.json({ error: "Usuário não é membro deste clã." }, { status: 404 });
    }

    // Dados do usuário
    const [targetUser] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Agregados de todas as hunts
    const [stats] = await db
      .select({
        totalProfit: sql<number>`coalesce(sum(${hunts.balance}), 0)::int`,
        totalLoot: sql<number>`coalesce(sum(${hunts.loot}), 0)::int`,
        totalSupplies: sql<number>`coalesce(sum(${hunts.supplies}), 0)::int`,
        totalXp: sql<number>`coalesce(sum(${hunts.xpGain}), 0)::int`,
        sessions: sql<number>`count(${hunts.id})::int`,
      })
      .from(hunts)
      .where(eq(hunts.userId, userId));

    // Últimas 8 hunts
    const recentHunts = await db
      .select({
        id: hunts.id,
        createdAt: hunts.createdAt,
        title: hunts.title,
        duration: hunts.duration,
        loot: hunts.loot,
        supplies: hunts.supplies,
        balance: hunts.balance,
        activityType: hunts.activityType,
      })
      .from(hunts)
      .where(eq(hunts.userId, userId))
      .orderBy(desc(hunts.createdAt))
      .limit(8);

    // Top 5 itens mais dropados
    const topItems = await db
      .select({
        name: huntItems.name,
        qty: sql<number>`sum(${huntItems.qty})::int`,
      })
      .from(huntItems)
      .innerJoin(hunts, eq(hunts.id, huntItems.huntId))
      .where(eq(hunts.userId, userId))
      .groupBy(huntItems.name)
      .orderBy(desc(sql`sum(${huntItems.qty})`))
      .limit(5);

    return NextResponse.json({
      member: {
        id: userId,
        name: targetUser?.name ?? "—",
        email: targetUser?.email ?? "—",
        role: targetMembership[0].role,
      },
      stats,
      recentHunts: recentHunts.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
      topItems,
    });
  } catch (error) {
    console.error("[GET /api/clans/:id/members/:userId/profile]", error);
    return NextResponse.json({ error: "Falha ao carregar perfil." }, { status: 500 });
  }
}
