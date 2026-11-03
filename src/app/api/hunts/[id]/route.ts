import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bestiary, hunts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 
 * PATCH /api/hunts/:id — edita Título, Descrição ou Data.
 * O clipboard e os itens originais são preservados por integridade.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();

    const [current] = await db
      .select()
      .from(hunts)
      .where(and(eq(hunts.id, id), eq(hunts.userId, user.id)))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.title !== "undefined") updateData.title = body.title?.trim() || null;
    if (typeof body.description !== "undefined") updateData.description = body.description?.trim() || null;
    if (body.createdAt) {
      const newDate = new Date(body.createdAt);
      if (!isNaN(newDate.getTime())) {
        updateData.createdAt = newDate;
      }
    }

    const [updated] = await db
      .update(hunts)
      .set(updateData)
      .where(and(eq(hunts.id, id), eq(hunts.userId, user.id)))
      .returning();

    return NextResponse.json({ hunt: updated });
  } catch (error) {
    console.error("[PATCH /api/hunts/:id]", error);
    return NextResponse.json({ error: "Falha ao atualizar registro." }, { status: 500 });
  }
}

/**
 * DELETE /api/hunts/:id — remove o registro, seus itens (cascade) e
 * SUBTRAI as kills do Bestiário para manter a contagem sincronizada.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;

    // Busca a hunt antes de deletar para extrair as criaturas mortas
    const [hunt] = await db
      .select()
      .from(hunts)
      .where(and(eq(hunts.id, id), eq(hunts.userId, user.id)))
      .limit(1);

    if (!hunt) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    // Subtrai as kills do Bestiário baseado no rawText da hunt
    if (hunt.rawText) {
      const lines = hunt.rawText.split(/\r?\n/);
      const RE = /^([\d,]+)\s*x\s+(.+)$/i;
      let inMonsters = false;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (/^killed\s+monsters\s*:/i.test(line)) { inMonsters = true; continue; }
        if (/^looted\s+items\s*:/i.test(line)) { inMonsters = false; continue; }
        if (!inMonsters) continue;

        const match = line.match(RE);
        if (match) {
          const qty = parseInt(match[1].replace(/,/g, ""), 10) || 0;
          const name = match[2]
            .trim()
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");

          if (qty > 0) {
            // Subtrai as kills. Se ficar <= 0, deleta a entrada.
            await db.execute(sql`
              UPDATE bestiary 
              SET total_kills = GREATEST(total_kills - ${qty}, 0)
              WHERE user_id = ${user.id} AND creature_name = ${name}
            `);

            // Remove entradas zeradas
            await db.execute(sql`
              DELETE FROM bestiary 
              WHERE user_id = ${user.id} AND creature_name = ${name} AND total_kills <= 0
            `);
          }
        }
      }
    }

    // Agora deleta a hunt (os items vão junto via cascade)
    await db.delete(hunts).where(and(eq(hunts.id, id), eq(hunts.userId, user.id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/hunts/:id]", error);
    return NextResponse.json({ error: "Falha ao remover registro." }, { status: 500 });
  }
}
