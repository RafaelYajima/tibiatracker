import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clans, clanMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** DELETE /api/clans/:id/members/:userId — remove um membro ou permite sair do clã. */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id: clanId, userId: targetUserId } = await ctx.params;

    // Busca a permissão de quem está chamando a API
    const myMembership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, user.id)))
      .limit(1);

    if (myMembership.length === 0) {
      return NextResponse.json({ error: "Você não pertence a este clã." }, { status: 403 });
    }

    const isSelf = user.id === targetUserId;
    const isOwner = myMembership[0].role === "owner";
    const isAdmin = myMembership[0].role === "admin";

    // Regras:
    // 1. Você pode sair do clã (isSelf).
    // 2. Owner pode expulsar qualquer um.
    // 3. Admin pode expulsar membros (mas não owner ou outros admins).
    if (!isSelf && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    // Busca a role do alvo para proteger o owner
    const targetMembership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, targetUserId)))
      .limit(1);

    if (targetMembership.length === 0) {
      return NextResponse.json({ error: "Usuário não está no clã." }, { status: 404 });
    }

    if (!isSelf && isAdmin && targetMembership[0].role !== "member") {
      return NextResponse.json({ error: "Admin só pode remover membros normais." }, { status: 403 });
    }

    if (isSelf && targetMembership[0].role === "owner") {
      // Owner só pode sair deletando o clã, ou passando a liderança (não implementado passar).
      return NextResponse.json({ error: "Dono do clã não pode sair; você deve excluir o clã inteiro." }, { status: 403 });
    }

    await db
      .delete(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, targetUserId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/clans/:id/members/:userId]", error);
    return NextResponse.json({ error: "Falha ao remover membro." }, { status: 500 });
  }
}
