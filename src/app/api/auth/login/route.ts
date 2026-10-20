import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByEmail, verifyPassword } from "@/lib/auth";
import type { LoginPayload } from "@/types";

export const dynamic = "force-dynamic";

/** Login por e-mail/senha. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<LoginPayload>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

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
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Falha ao fazer login." }, { status: 500 });
  }
}
