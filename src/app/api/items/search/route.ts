import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/items/search?q=silver+token
 * Proxy para a TibiaWiki Fandom API opensearch.
 * Retorna nomes de itens que batem com a busca.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ items: [] });

    const url = `https://tibia.fandom.com/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=12&namespace=0&format=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "TibiaTracker/1.0" },
    });

    if (!res.ok) return NextResponse.json({ items: [] });

    const data = await res.json();
    const names: string[] = Array.isArray(data[1]) ? data[1] : [];

    // Filtra entradas que parecem ser itens (exclui quests, NPCs, páginas de spoiler)
    const filtered = names.filter(
      (n) => !n.includes("/") && !n.includes("Quest") && !n.includes("Spoiler") && !n.includes("Transcript")
    );

    return NextResponse.json({ items: filtered.slice(0, 8) });
  } catch (error) {
    console.error("[GET /api/items/search]", error);
    return NextResponse.json({ items: [] });
  }
}
