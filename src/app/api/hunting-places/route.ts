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

/** GET /api/hunting-places?city=&vocation=&q= */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // Delegação do cache para o motor nativo do Next.js (seguro na Vercel)
    const res = await fetch("https://tibiadata.bytewizards.de/api/v1/hunting-places/list", {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache nativo por 1 hora
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "TibiaData API indisponível no momento." }, { status: 502 });
    }
    
    const data: HuntingPlaceRaw[] = await res.json();
    let results = Array.isArray(data) ? data : [];

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
    const cities = [...new Set(data.map((h) => h.city).filter(Boolean))].sort();

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
