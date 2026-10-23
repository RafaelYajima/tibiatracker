import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clans, clanMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/clans/:id — dados do clã + membros. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;

    // Verifica se o usuário é membro
    const membership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, id), eq(clanMembers.userId, user.id)))
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Você não é membro deste clã." }, { status: 403 });
    }

    const [clan] = await db.select().from(clans).where(eq(clans.id, id)).limit(1);
    if (!clan) return NextResponse.json({ error: "Clã não encontrado." }, { status: 404 });

    const members = await db
      .select({
        id: clanMembers.id,
        userId: clanMembers.userId,
        role: clanMembers.role,
        userName: users.name,
        userEmail: users.email,
      })
      .from(clanMembers)
      .innerJoin(users, eq(users.id, clanMembers.userId))
      .where(eq(clanMembers.clanId, id));

    return NextResponse.json({
      clan: {
        id: clan.id,
        name: clan.name,
        ownerId: clan.ownerId,
        createdAt: clan.createdAt.toISOString(),
      },
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        name: m.userName,
        email: m.userEmail,
      })),
      myRole: membership[0].role,
    });
  } catch (error) {
    console.error("[GET /api/clans/:id]", error);
    return NextResponse.json({ error: "Falha ao carregar clã." }, { status: 500 });
  }
}

/** DELETE /api/clans/:id — exclui o clã (apenas owner). */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id } = await ctx.params;
    const deleted = await db
      .delete(clans)
      .where(and(eq(clans.id, id), eq(clans.ownerId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Clã não encontrado ou você não é o dono." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/clans/:id]", error);
    return NextResponse.json({ error: "Falha ao excluir clã." }, { status: 500 });
  }
}
