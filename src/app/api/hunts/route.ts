import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { characters, huntItems, hunts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isActivityType } from "@/lib/activity";
import { getFilterStartDate, isTimeFilter } from "@/lib/time";
import type { CreateHuntPayload, HuntCharacterRef, HuntItem, HuntWithItems } from "@/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/hunts — lista registros do usuário com filtros de período, personagem e tipo. */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const filterParam = req.nextUrl.searchParams.get("filter");
    const filter = isTimeFilter(filterParam) ? filterParam : "all";
    const start = getFilterStartDate(filter);

    const characterParam = req.nextUrl.searchParams.get("character");
    const activityParam = req.nextUrl.searchParams.get("activity");

    const conditions = [
      eq(hunts.userId, user.id),
      start ? gte(hunts.createdAt, start) : undefined,
      characterParam && characterParam !== "all" && UUID_RE.test(characterParam)
        ? eq(hunts.characterId, characterParam)
        : undefined,
      activityParam && activityParam !== "all" && isActivityType(activityParam)
        ? eq(hunts.activityType, activityParam)
        : undefined,
    ];

    const rows = await db
      .select()
      .from(hunts)
      .where(and(...conditions))
      .orderBy(desc(hunts.createdAt));

    const itemsByHunt = new Map<string, HuntItem[]>();
    if (rows.length > 0) {
      const itemRows = await db
        .select()
        .from(huntItems)
        .where(inArray(huntItems.huntId, rows.map((r) => r.id)));

      for (const item of itemRows) {
        const list = itemsByHunt.get(item.huntId) ?? [];
        list.push({ id: item.id, huntId: item.huntId, name: item.name, qty: item.qty });
        itemsByHunt.set(item.huntId, list);
      }
    }

    const characterIds = Array.from(
      new Set(rows.map((r) => r.characterId).filter((id): id is string => id !== null)),
    );
    const characterById = new Map<string, HuntCharacterRef>();
    if (characterIds.length > 0) {
      const charRows = await db
        .select()
        .from(characters)
        .where(and(inArray(characters.id, characterIds), eq(characters.userId, user.id)));
      for (const c of charRows) {
        characterById.set(c.id, { id: c.id, name: c.name, world: c.world, vocation: c.vocation });
      }
    }

    const result: HuntWithItems[] = rows.map((h) => ({
      id: h.id,
      createdAt: h.createdAt.toISOString(),
      characterId: h.characterId,
      activityType: h.activityType as HuntWithItems["activityType"],
      duration: h.duration,
      loot: h.loot,
      supplies: h.supplies,
      balance: h.balance,
      xpGain: h.xpGain,
      xpPerHour: h.xpPerHour,
      title: h.title,
      description: h.description,
      killedCreatures: h.killedCreatures ? h.killedCreatures.split(",").filter(Boolean) : [],
      rawText: h.rawText,
      items: itemsByHunt.get(h.id) ?? [],
      character: h.characterId ? (characterById.get(h.characterId) ?? null) : null,
    }));

    return NextResponse.json({ hunts: result });
  } catch (error) {
    console.error("[GET /api/hunts]", error);
    return NextResponse.json({ error: "Falha ao carregar registros." }, { status: 500 });
  }
}

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** POST /api/hunts — salva uma hunt/rotação do usuário autenticado. */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const body = (await req.json()) as Partial<CreateHuntPayload>;

    const duration = typeof body.duration === "string" ? body.duration.trim() : "";
    const activityType = typeof body.activityType === "string" && isActivityType(body.activityType)
      ? body.activityType
      : "boss_rotation";

    if (!duration) {
      return NextResponse.json({ error: "Campo 'duration' é obrigatório." }, { status: 400 });
    }

    let character: HuntCharacterRef | null = null;
    let characterId: string | null = null;
    if (typeof body.characterId === "string" && body.characterId) {
      if (!UUID_RE.test(body.characterId)) {
        return NextResponse.json({ error: "Personagem inválido." }, { status: 400 });
      }
      const found = await db
        .select()
        .from(characters)
        .where(and(eq(characters.id, body.characterId), eq(characters.userId, user.id)))
        .limit(1);
      if (found.length === 0) {
        return NextResponse.json({ error: "Personagem não cadastrado nesta conta." }, { status: 400 });
      }
      const c = found[0];
      character = { id: c.id, name: c.name, world: c.world, vocation: c.vocation };
      characterId = c.id;
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems
      .map((i) => ({ name: typeof i?.name === "string" ? i.name.trim() : "", qty: toInt(i?.qty) }))
      .filter((i) => i.name.length > 0 && i.qty > 0)
      .slice(0, 500);

    const [inserted] = await db
      .insert(hunts)
      .values({
        userId: user.id,
        activityType,
        characterId,
        title: typeof body.title === "string" ? body.title.trim() : null,
        description: typeof body.description === "string" ? body.description.trim() : null,
        killedCreatures: Array.isArray(body.killedCreatures) && body.killedCreatures.length > 0
          ? body.killedCreatures.slice(0, 50).join(",")
          : null,
        duration,
        loot: toInt(body.loot),
        supplies: toInt(body.supplies),
        balance: toInt(body.balance),
        xpGain: toInt(body.xpGain),
        xpPerHour: toInt(body.xpPerHour),
        rawText: typeof body.rawText === "string" ? body.rawText : null,
      })
      .returning();

    let savedItems: HuntItem[] = [];
    if (items.length > 0) {
      const insertedItems = await db
        .insert(huntItems)
        .values(items.map((i) => ({ huntId: inserted.id, name: i.name, qty: i.qty })))
        .returning();
      savedItems = insertedItems.map((i) => ({ id: i.id, huntId: i.huntId, name: i.name, qty: i.qty }));
    }

    const hunt: HuntWithItems = {
      id: inserted.id,
      createdAt: inserted.createdAt.toISOString(),
      characterId: inserted.characterId,
      activityType: inserted.activityType as HuntWithItems["activityType"],
      duration: inserted.duration,
      loot: inserted.loot,
      supplies: inserted.supplies,
      balance: inserted.balance,
      xpGain: inserted.xpGain,
      xpPerHour: inserted.xpPerHour,
      title: inserted.title,
      description: inserted.description,
      killedCreatures: inserted.killedCreatures ? inserted.killedCreatures.split(",").filter(Boolean) : [],
      rawText: inserted.rawText,
      items: savedItems,
      character,
    };

    return NextResponse.json({ hunt }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/hunts]", error);
    return NextResponse.json({ error: "Falha ao salvar registro." }, { status: 500 });
  }
}
