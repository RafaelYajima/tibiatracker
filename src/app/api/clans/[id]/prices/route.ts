import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { clanItemPrices, clanMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/clans/:id/prices?names=Silver Token,Gold Token
 *  Retorna preços definidos pelo clã. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id: clanId } = await ctx.params;

    // Verifica se é membro
    const membership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, user.id)))
      .limit(1);
    if (membership.length === 0) {
      return NextResponse.json({ error: "Sem acesso." }, { status: 403 });
    }

    const namesParam = req.nextUrl.searchParams.get("names") ?? "";
    const names = namesParam.split(",").map((n) => n.trim()).filter(Boolean);

    const rows = names.length > 0
      ? await db.select().from(clanItemPrices).where(and(eq(clanItemPrices.clanId, clanId), inArray(clanItemPrices.itemName, names)))
      : await db.select().from(clanItemPrices).where(eq(clanItemPrices.clanId, clanId));

    const prices: Record<string, number> = {};
    for (const row of rows) {
      prices[row.itemName] = row.price;
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("[GET /api/clans/:id/prices]", error);
    return NextResponse.json({ error: "Falha ao carregar preços." }, { status: 500 });
  }
}

/** POST /api/clans/:id/prices { itemName, price }
 *  Define/atualiza o preço de um item no clã (owner ou admin). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { id: clanId } = await ctx.params;

    const membership = await db
      .select()
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, user.id)))
      .limit(1);

    if (membership.length === 0 || !["owner", "admin"].includes(membership[0].role)) {
      return NextResponse.json({ error: "Apenas owner ou admin podem definir preços." }, { status: 403 });
    }

    const body = await req.json();
    const itemName = typeof body.itemName === "string" ? body.itemName.trim() : "";
    const price = typeof body.price === "number" ? Math.max(0, Math.trunc(body.price)) : 0;

    if (!itemName) return NextResponse.json({ error: "Nome do item é obrigatório." }, { status: 400 });

    const existing = await db
      .select()
      .from(clanItemPrices)
      .where(and(eq(clanItemPrices.clanId, clanId), eq(clanItemPrices.itemName, itemName)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(clanItemPrices)
        .set({ price, updatedAt: new Date() })
        .where(and(eq(clanItemPrices.clanId, clanId), eq(clanItemPrices.itemName, itemName)));
    } else {
      await db.insert(clanItemPrices).values({ clanId, itemName, price });
    }

    return NextResponse.json({ ok: true, itemName, price });
  } catch (error) {
    console.error("[POST /api/clans/:id/prices]", error);
    return NextResponse.json({ error: "Falha ao salvar preço." }, { status: 500 });
  }
}
