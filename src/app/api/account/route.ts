import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByEmail, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import type { UpdateAccountPayload } from "@/types";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/account]", error);
    return NextResponse.json({ error: "Falha ao carregar perfil." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = (await req.json()) as Partial<UpdateAccountPayload>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const useClanPrices = typeof body.useClanPrices === "boolean" ? body.useClanPrices : false;

    if (name.length < 2 || name.length > 40) {
      return NextResponse.json({ error: "Nome deve ter entre 2 e 40 caracteres." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (newPassword && newPassword.length < 8) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const [currentUserRow] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!currentUserRow) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const emailChanged = currentUserRow.email.toLowerCase() !== email;
    const passwordChanged = Boolean(newPassword);

    if ((emailChanged || passwordChanged) && !verifyPassword(currentPassword, currentUserRow.passwordHash)) {
      return NextResponse.json(
        { error: "Informe sua senha atual corretamente para alterar e-mail ou senha." },
        { status: 401 },
      );
    }

    if (emailChanged) {
      const existing = await findUserByEmail(email);
      if (existing && existing.id !== currentUserRow.id) {
        return NextResponse.json({ error: "Já existe uma conta com esse e-mail." }, { status: 409 });
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        name,
        email,
        passwordHash: passwordChanged ? hashPassword(newPassword) : currentUserRow.passwordHash,
        useClanPrices,
      })
      .where(eq(users.id, currentUserRow.id))
      .returning();

    return NextResponse.json({
      user: {
        id: updated.id,
        createdAt: updated.createdAt.toISOString(),
        name: updated.name,
        email: updated.email,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/account]", error);
    return NextResponse.json({ error: "Falha ao atualizar perfil." }, { status: 500 });
  }
}
