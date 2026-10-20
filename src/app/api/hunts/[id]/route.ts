import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { hunts } from "@/db/schema";
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

    // Permite editar apenas título, descrição e data de criação
    const updateData: any = {};
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

/** DELETE /api/hunts/:id — remove o registro e seus itens (cascade). */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;
    const deleted = await db
      .delete(hunts)
      .where(and(eq(hunts.id, id), eq(hunts.userId, user.id)))
      .returning({ id: hunts.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/hunts/:id]", error);
    return NextResponse.json({ error: "Falha ao remover registro." }, { status: 500 });
  }
}
