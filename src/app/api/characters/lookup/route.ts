import { NextRequest, NextResponse } from "next/server";
import { fetchTibiaCharacter } from "@/lib/tibiadata";

export const dynamic = "force-dynamic";

/**
 * GET /api/characters/lookup?name=X
 * Proxy server-side para a TibiaData API — devolve os dados públicos
 * do personagem sem salvar nada (usado no preview antes de cadastrar).
 */
export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").trim();

  if (name.length < 2 || name.length > 40) {
    return NextResponse.json({ error: "Informe um nome de personagem válido." }, { status: 400 });
  }

  try {
    const info = await fetchTibiaCharacter(name);
    if (!info) {
      return NextResponse.json(
        { error: `Personagem "${name}" não encontrado no Tibia. Confira a grafia.` },
        { status: 404 },
      );
    }
    return NextResponse.json({ character: info });
  } catch (error) {
    console.error("[GET /api/characters/lookup]", error);
    return NextResponse.json(
      { error: "TibiaData API indisponível no momento. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}
