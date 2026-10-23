import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { clans, clanMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/clans — lista os clãs do usuário autenticado. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const rows = await db
      .select({
        id: clans.id,
        name: clans.name,
        ownerId: clans.ownerId,
        createdAt: clans.createdAt,
        role: clanMembers.role,
      })
      .from(clanMembers)
      .innerJoin(clans, eq(clans.id, clanMembers.clanId))
      .where(eq(clanMembers.userId, user.id));

    return NextResponse.json({
      clans: rows.map((r) => ({
        id: r.id,
        name: r.name,
        ownerId: r.ownerId,
        createdAt: r.createdAt.toISOString(),
        role: r.role,
      })),
    });
  } catch (error) {
    console.error("[GET /api/clans]", error);
    return NextResponse.json({ error: "Falha ao carregar clãs." }, { status: 500 });
  }
}

/** POST /api/clans { name } — cria um novo clã. */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 40) {
      return NextResponse.json({ error: "Nome do clã deve ter entre 2 e 40 caracteres." }, { status: 400 });
    }

    const [clan] = await db
      .insert(clans)
      .values({ name, ownerId: user.id })
      .returning();

    await db.insert(clanMembers).values({
      clanId: clan.id,
      userId: user.id,
      role: "owner",
    });

    return NextResponse.json({
      clan: {
        id: clan.id,
        name: clan.name,
        ownerId: clan.ownerId,
        createdAt: clan.createdAt.toISOString(),
        role: "owner",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clans]", error);
    return NextResponse.json({ error: "Falha ao criar clã." }, { status: 500 });
  }
}
