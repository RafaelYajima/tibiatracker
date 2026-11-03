import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface HuntingPlaceRaw {
  id: number;
  name: string;
  title: string;
  summary: string | null;
  city: string;
  location: string;
  vocation: string;
  wikiUrl: string;
}

let cachedData: HuntingPlaceRaw[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

/** GET /api/hunting-places?city=&vocation=&q= */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // Cache em memória
    if (!cachedData || Date.now() - cacheTime > CACHE_TTL) {
      const res = await fetch("https://tibiadata.bytewizards.de/api/v1/hunting-places/list", {
        signal: AbortSignal.timeout(12000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return NextResponse.json({ error: "API indisponível." }, { status: 502 });
      cachedData = await res.json();
      cacheTime = Date.now();
    }

    let results = cachedData ?? [];

    const q = req.nextUrl.searchParams.get("q")?.toLowerCase();
    const city = req.nextUrl.searchParams.get("city")?.toLowerCase();
    const vocation = req.nextUrl.searchParams.get("vocation")?.toLowerCase();

    if (q) results = results.filter((h) => h.name.toLowerCase().includes(q));
    if (city) results = results.filter((h) => h.city.toLowerCase().includes(city));
    if (vocation && vocation !== "all") {
      results = results.filter((h) => {
        const v = h.vocation.toLowerCase();
        return v.includes("all") || v.includes(vocation);
      });
    }

    // Extrair cidades únicas para os filtros
    const cities = [...new Set((cachedData ?? []).map((h) => h.city).filter(Boolean))].sort();

    return NextResponse.json({
      places: results.slice(0, 60).map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        vocation: h.vocation,
        wikiUrl: h.wikiUrl,
      })),
      total: results.length,
      cities,
    });
  } catch (error) {
    console.error("[GET /api/hunting-places]", error);
    return NextResponse.json({ error: "Falha ao carregar locais." }, { status: 500 });
  }
}
