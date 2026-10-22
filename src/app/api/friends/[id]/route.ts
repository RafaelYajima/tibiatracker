import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 
 * PATCH /api/friends/:id
 * Aceita um pedido de amizade (apenas o destinatário pode aceitar).
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;
    const { action } = await req.json(); // 'accept'

    if (action !== "accept") return NextResponse.json({ error: "Ação inválida." }, { status: 400 });

    const [updated] = await db
      .update(friendships)
      .set({ status: "accepted" })
      .where(and(eq(friendships.id, id), eq(friendships.friendId, user.id)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Pedido não encontrado ou você não pode aceitá-lo." }, { status: 404 });

    return NextResponse.json({ friendship: updated });
  } catch (error) {
    console.error("[PATCH /api/friends/:id]", error);
    return NextResponse.json({ error: "Falha ao aceitar amizade." }, { status: 500 });
  }
}

/** 
 * DELETE /api/friends/:id
 * Remove uma amizade ou recusa um pedido.
 */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;

    const deleted = await db
      .delete(friendships)
      .where(or(
        and(eq(friendships.id, id), eq(friendships.userId, user.id)),
        and(eq(friendships.id, id), eq(friendships.friendId, user.id))
      ))
      .returning();

    if (deleted.length === 0) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/friends/:id]", error);
    return NextResponse.json({ error: "Falha ao remover amizade." }, { status: 500 });
  }
}
