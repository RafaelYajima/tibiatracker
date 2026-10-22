import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { enrichItemsWithRarity } from "@/lib/itemrarity";

export const dynamic = "force-dynamic";

/**
 * POST /api/items/rarity
 * Body: { items: [{name, qty}], creatures: string[] }
 * Retorna os itens enriquecidos com raridade via ByteWizards API.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const items: { name: string; qty: number }[] = Array.isArray(body.items)
      ? body.items.slice(0, 100)
      : [];
    const creatures: string[] = Array.isArray(body.creatures)
      ? body.creatures.slice(0, 30)
      : [];

    if (items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const enriched = await enrichItemsWithRarity(items, creatures);
    return NextResponse.json({ items: enriched });
  } catch (error) {
    console.error("[POST /api/items/rarity]", error);
    return NextResponse.json({ error: "Falha ao buscar raridades." }, { status: 500 });
  }
}
