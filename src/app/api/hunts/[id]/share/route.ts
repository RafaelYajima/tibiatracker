import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { huntItems, hunts } from "@/db/schema";

export const dynamic = "force-dynamic";

/** GET /api/hunts/:id/share — retorna dados públicos de uma hunt (sem autenticação). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const [hunt] = await db.select().from(hunts).where(eq(hunts.id, id)).limit(1);
    if (!hunt) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });

    const items = await db.select().from(huntItems).where(eq(huntItems.huntId, id));

    return NextResponse.json({
      hunt: {
        title: hunt.title,
        description: hunt.description,
        duration: hunt.duration,
        loot: hunt.loot,
        supplies: hunt.supplies,
        balance: hunt.balance,
        xpGain: hunt.xpGain,
        xpPerHour: hunt.xpPerHour,
        activityType: hunt.activityType,
        createdAt: hunt.createdAt.toISOString(),
        items: items.map((i) => ({ name: i.name, qty: i.qty })),
      },
    });
  } catch (error) {
    console.error("[GET /api/hunts/:id/share]", error);
    return NextResponse.json({ error: "Falha ao carregar registro." }, { status: 500 });
  }
}
