import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bestiary } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fetchBestiaryMeta } from "@/lib/bestiary";

export const dynamic = "force-dynamic";

/** GET /api/bestiary — bestiary do usuário com imagem, ocorrência e thresholds. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const rows = await db
      .select()
      .from(bestiary)
      .where(eq(bestiary.userId, user.id))
      .orderBy(desc(bestiary.totalKills));

    const result = await Promise.all(
      rows.map(async (r) => {
        const meta = await fetchBestiaryMeta(r.creatureName);
        return {
          id: r.id,
          creatureName: r.creatureName,
          totalKills: r.totalKills,
          lastKillAt: r.lastKillAt.toISOString(),
          imageUrl: meta.imageUrl,
          occurrence: meta.occurrence,
          difficulty: meta.difficulty,
          thresholds: meta.thresholds,
        };
      })
    );

    return NextResponse.json({ bestiary: result });
  } catch (error) {
    console.error("[GET /api/bestiary]", error);
    return NextResponse.json({ error: "Falha ao carregar bestiário." }, { status: 500 });
  }
}
