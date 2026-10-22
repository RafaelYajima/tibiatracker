import { NextRequest, NextResponse } from "next/server";
import { and, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 
 * GET /api/users/search?q=...
 * Busca usuários pelo nome ou e-mail, excluindo o próprio usuário logado.
 */
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const query = req.nextUrl.searchParams.get("q")?.trim();
    if (!query || query.length < 3) {
      return NextResponse.json({ users: [] });
    }

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          ne(users.id, currentUser.id),
          or(
            ilike(users.name, `%${query}%`),
            ilike(users.email, `%${query}%`)
          )
        )
      )
      .limit(10);

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json({ error: "Falha ao buscar usuários." }, { status: 500 });
  }
}
