import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { fetchTibiaCharacter } from "@/lib/tibiadata";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/characters/:id — re-busca os dados na TibiaData API e
 * atualiza o snapshot (level/vocation/world, úteis quando o char upa).
 */
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const [current] = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
    if (!current) {
      return NextResponse.json({ error: "Personagem não encontrado." }, { status: 404 });
    }

    let info;
    try {
      info = await fetchTibiaCharacter(current.name);
    } catch {
      return NextResponse.json(
        { error: "TibiaData API indisponível no momento." },
        { status: 502 },
      );
    }

    if (!info) {
      return NextResponse.json(
        { error: `"${current.name}" não foi encontrado no Tibia (deletado ou renomeado?).` },
        { status: 404 },
      );
    }

    const [updated] = await db
      .update(characters)
      .set({ name: info.name, world: info.world, vocation: info.vocation, level: info.level })
      .where(eq(characters.id, id))
      .returning();

    return NextResponse.json({
      character: {
        id: updated.id,
        createdAt: updated.createdAt.toISOString(),
        name: updated.name,
        world: updated.world,
        vocation: updated.vocation,
        level: updated.level,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/characters/:id]", error);
    return NextResponse.json({ error: "Falha ao atualizar personagem." }, { status: 500 });
  }
}

/**
 * DELETE /api/characters/:id — remove o personagem.
 * As hunts dele sobrevivem (character_id vira null via ON DELETE SET NULL).
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const deleted = await db.delete(characters).where(eq(characters.id, id)).returning({ id: characters.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Personagem não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/characters/:id]", error);
    return NextResponse.json({ error: "Falha ao remover personagem." }, { status: 500 });
  }
}
