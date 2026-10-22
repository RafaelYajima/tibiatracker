import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { characters, friendships, huntItems, hunts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 
 * GET /api/friends/:userId/stats
 * Retorna um resumo dos dados do amigo (somente se amizade estiver 'accepted').
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { userId } = await ctx.params;

    // 1. Verifica se são amigos aceitos
    const friendship = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            and(eq(friendships.userId, me.id), eq(friendships.friendId, userId)),
            and(eq(friendships.userId, userId), eq(friendships.friendId, me.id))
          )
        )
      )
      .limit(1);

    if (friendship.length === 0) {
      return NextResponse.json({ error: "Você não tem permissão para ver os dados deste usuário." }, { status: 403 });
    }

    // 2. Busca resumo (Profit, Loot, XP)
    const stats = await db
      .select({
        totalProfit: sql<number>`coalesce(sum(${hunts.balance}), 0)::int`,
        totalLoot: sql<number>`coalesce(sum(${hunts.loot}), 0)::int`,
        totalXp: sql<number>`coalesce(sum(${hunts.xpGain}), 0)::int`,
        sessions: sql<number>`count(${hunts.id})::int`,
      })
      .from(hunts)
      .where(eq(hunts.userId, userId));

    // 3. Busca últimas 5 hunts
    const recentHunts = await db
      .select()
      .from(hunts)
      .where(eq(hunts.userId, userId))
      .orderBy(desc(hunts.createdAt))
      .limit(5);

    // 4. Busca top itens (simplificado aqui por performance)
    const topItemsRows = await db
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
      summary: stats[0],
      recentHunts,
      topItems: topItemsRows,
    });
  } catch (error) {
    console.error("[GET /api/friends/stats]", error);
    return NextResponse.json({ error: "Falha ao carregar dados do amigo." }, { status: 500 });
  }
}
import { sql } from "drizzle-orm";
