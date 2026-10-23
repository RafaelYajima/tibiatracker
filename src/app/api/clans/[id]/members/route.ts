import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clanMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/clans/:id/members { email } — convida um usuário ao clã. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id: clanId } = await ctx.params;

    // Verifica se é owner ou admin
    const myMembership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, user.id)))
      .limit(1);

    if (myMembership.length === 0 || !["owner", "admin"].includes(myMembership[0].role)) {
      return NextResponse.json({ error: "Sem permissão para convidar." }, { status: 403 });
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });

    // Busca o usuário pelo email
    const [targetUser] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: `Usuário com e-mail "${email}" não encontrado.` }, { status: 404 });
    }

    // Já é membro?
    const existing = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, targetUser.id)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Usuário já é membro deste clã." }, { status: 409 });
    }

    const [member] = await db
      .insert(clanMembers)
      .values({ clanId, userId: targetUser.id, role: "member" })
      .returning();

    return NextResponse.json({
      member: {
        id: member.id,
        userId: targetUser.id,
        role: member.role,
        name: targetUser.name,
        email: targetUser.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clans/:id/members]", error);
    return NextResponse.json({ error: "Falha ao convidar membro." }, { status: 500 });
  }
}
