import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, findUserByEmail, hashPassword } from "@/lib/auth";
import type { RegisterPayload } from "@/types";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Registro simples por e-mail/senha. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RegisterPayload>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 40) {
      return NextResponse.json({ error: "Nome deve ter entre 2 e 40 caracteres." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Já existe uma conta com esse e-mail." }, { status: 409 });
    }

    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password) })
      .returning();

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        createdAt: user.createdAt.toISOString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Falha ao criar a conta." }, { status: 500 });
  }
}
