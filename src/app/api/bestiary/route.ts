import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bestiary } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/bestiary
 * Retorna a lista acumulada de criaturas mortas pelo usuário.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const rows = await db
      .select()
      .from(bestiary)
      .where(eq(bestiary.userId, user.id))
      .orderBy(desc(bestiary.totalKills));

    const result = rows.map((r) => ({
      id: r.id,
      creatureName: r.creatureName,
      totalKills: r.totalKills,
      lastKillAt: r.lastKillAt.toISOString(),
      // URL de imagem do TibiaWiki Fandom
      imageUrl: `https://tibia.fandom.com/wiki/Special:FilePath/${r.creatureName.replace(/\s+/g, "_")}.gif`,
    }));

    return NextResponse.json({ bestiary: result });
  } catch (error) {
    console.error("[GET /api/bestiary]", error);
    return NextResponse.json({ error: "Falha ao carregar bestiário." }, { status: 500 });
  }
}
