import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { itemPrices } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/item-prices?names=Silver Token,Gold Token
 *  Retorna preços customizados do usuário para os itens pedidos. */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const namesParam = req.nextUrl.searchParams.get("names") ?? "";
    const names = namesParam.split(",").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return NextResponse.json({ prices: {} });

    const rows = await db
      .select()
      .from(itemPrices)
      .where(and(eq(itemPrices.userId, user.id), inArray(itemPrices.itemName, names)));

    const prices: Record<string, number> = {};
    for (const row of rows) {
      prices[row.itemName] = row.customPrice;
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("[GET /api/item-prices]", error);
    return NextResponse.json({ error: "Falha ao carregar preços." }, { status: 500 });
  }
}

/** POST /api/item-prices { itemName, customPrice }
 *  Salva ou atualiza o preço customizado de um item para o usuário. */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const itemName = typeof body.itemName === "string" ? body.itemName.trim() : "";
    const customPrice = typeof body.customPrice === "number" ? Math.max(0, Math.trunc(body.customPrice)) : 0;

    if (!itemName) return NextResponse.json({ error: "Nome do item é obrigatório." }, { status: 400 });

    // Upsert: atualiza se existe, insere se não
    const existing = await db
      .select()
      .from(itemPrices)
      .where(and(eq(itemPrices.userId, user.id), eq(itemPrices.itemName, itemName)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(itemPrices)
        .set({ customPrice, updatedAt: new Date() })
        .where(and(eq(itemPrices.userId, user.id), eq(itemPrices.itemName, itemName)));
    } else {
      await db
        .insert(itemPrices)
        .values({ userId: user.id, itemName, customPrice });
    }

    return NextResponse.json({ ok: true, itemName, customPrice });
  } catch (error) {
    console.error("[POST /api/item-prices]", error);
    return NextResponse.json({ error: "Falha ao salvar preço." }, { status: 500 });
  }
}
