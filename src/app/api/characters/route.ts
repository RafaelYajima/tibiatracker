import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { characters, hunts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fetchTibiaCharacter } from "@/lib/tibiadata";
import type { CharacterWithStats } from "@/types";

export const dynamic = "force-dynamic";

/** GET /api/characters — lista somente personagens do usuário autenticado. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const rows = await db
      .select({
        id: characters.id,
        createdAt: characters.createdAt,
        name: characters.name,
        world: characters.world,
        vocation: characters.vocation,
        level: characters.level,
        sessions: sql<number>`count(${hunts.id})::int`,
        totalProfit: sql<number>`coalesce(sum(${hunts.balance}), 0)::int`,
        totalLoot: sql<number>`coalesce(sum(${hunts.loot}), 0)::int`,
        totalXp: sql<number>`coalesce(sum(${hunts.xpGain}), 0)::int`,
      })
      .from(characters)
      .leftJoin(hunts, eq(hunts.characterId, characters.id))
      .where(eq(characters.userId, user.id))
      .groupBy(characters.id)
      .orderBy(asc(characters.name));

    const result: CharacterWithStats[] = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      name: r.name,
      world: r.world,
      vocation: r.vocation,
      level: r.level,
      sessions: Number(r.sessions),
      totalProfit: Number(r.totalProfit),
      totalLoot: Number(r.totalLoot),
      totalXp: Number(r.totalXp),
    }));

    return NextResponse.json({ characters: result });
  } catch (error) {
    console.error("[GET /api/characters]", error);
    return NextResponse.json({ error: "Falha ao carregar personagens." }, { status: 500 });
  }
}

/** POST /api/characters — busca na TibiaData e salva na conta do usuário atual. */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = (await req.json()) as { name?: string };
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2 || name.length > 40) {
      return NextResponse.json({ error: "Nome do personagem inválido." }, { status: 400 });
    }

    let info;
    try {
      info = await fetchTibiaCharacter(name);
    } catch {
      return NextResponse.json(
        { error: "TibiaData API indisponível no momento. Tente novamente em instantes." },
        { status: 502 },
      );
    }

    if (!info) {
      return NextResponse.json(
        { error: `Personagem "${name}" não encontrado no Tibia. Confira a grafia.` },
        { status: 404 },
      );
    }

    const existing = await db
      .select({ id: characters.id })
      .from(characters)
      .where(and(eq(characters.userId, user.id), sql`lower(${characters.name}) = lower(${info.name})`))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: `"${info.name}" já está cadastrado nesta conta.` }, { status: 409 });
    }

    const [inserted] = await db
      .insert(characters)
      .values({ userId: user.id, name: info.name, world: info.world, vocation: info.vocation, level: info.level })
      .returning();

    return NextResponse.json(
      {
        character: {
          id: inserted.id,
          createdAt: inserted.createdAt.toISOString(),
          name: inserted.name,
          world: inserted.world,
          vocation: inserted.vocation,
          level: inserted.level,
          sessions: 0,
          totalProfit: 0,
          totalLoot: 0,
          totalXp: 0,
        } satisfies CharacterWithStats,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/characters]", error);
    return NextResponse.json({ error: "Falha ao cadastrar personagem." }, { status: 500 });
  }
}
