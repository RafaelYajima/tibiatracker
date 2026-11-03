import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bestiary, hunts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseKilledMonsters } from "@/lib/parser";

export const dynamic = "force-dynamic";

/**
 * POST /api/bestiary/recalculate
 * reconstrói o bestiário do usuário do zero a partir do histórico de hunts.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // 1. Busca todas as hunts do usuário que possuem texto original
    const userHunts = await db
      .select({ rawText: hunts.rawText })
      .from(hunts)
      .where(eq(hunts.userId, user.id));

    // 2. Soma todos os monstros de todas as hunts
    const globalMap = new Map<string, number>();
    for (const hunt of userHunts) {
      const huntMap = parseKilledMonsters(hunt.rawText);
      for (const [name, qty] of huntMap.entries()) {
        globalMap.set(name, (globalMap.get(name) ?? 0) + qty);
      }
    }

    // 3. Deleta o bestiário atual do usuário (para reconstruir limpo)
    await db.delete(bestiary).where(eq(bestiary.userId, user.id));

    // 4. Insere os novos totais em lote
    const entries = Array.from(globalMap.entries());
    if (entries.length > 0) {
      // Drizzle insert em lote para performance
      await db.insert(bestiary).values(
        entries.map(([name, qty]) => ({
          userId: user.id,
          creatureName: name,
          totalKills: qty,
          lastKillAt: new Date(),
        }))
      );
    }

    return NextResponse.json({ ok: true, count: entries.length });
  } catch (error) {
    console.error("[POST /api/bestiary/recalculate]", error);
    return NextResponse.json({ error: "Falha ao recalcular bestiário." }, { status: 500 });
  }
}
