import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bestiary, hunts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/export?type=hunts|bestiary&format=json|csv */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const type = req.nextUrl.searchParams.get("type") ?? "hunts";
    const fmt = req.nextUrl.searchParams.get("format") ?? "json";

    if (type === "bestiary") {
      const rows = await db.select().from(bestiary).where(eq(bestiary.userId, user.id)).orderBy(desc(bestiary.totalKills));
      const data = rows.map((r) => ({
        creature: r.creatureName,
        kills: r.totalKills,
        lastKill: r.lastKillAt.toISOString(),
      }));

      if (fmt === "csv") {
        const csv = "Criatura,Kills,Último Abate\n" + data.map((d) => `"${d.creature}",${d.kills},${d.lastKill}`).join("\n");
        return new Response(csv, {
          headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=bestiary.csv" },
        });
      }
      return NextResponse.json({ data });
    }

    // Hunts
    const rows = await db.select().from(hunts).where(eq(hunts.userId, user.id)).orderBy(desc(hunts.createdAt));
    const data = rows.map((h) => ({
      date: h.createdAt.toISOString(),
      title: h.title,
      type: h.activityType,
      duration: h.duration,
      loot: h.loot,
      supplies: h.supplies,
      balance: h.balance,
      xpGain: h.xpGain,
      xpPerHour: h.xpPerHour,
    }));

    if (fmt === "csv") {
      const csv = "Data,Título,Tipo,Duração,Loot,Supplies,Balance,XP,XP/h\n" +
        data.map((d) => `${d.date},"${d.title ?? ""}",${d.type},${d.duration},${d.loot},${d.supplies},${d.balance},${d.xpGain},${d.xpPerHour}`).join("\n");
      return new Response(csv, {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=hunts.csv" },
      });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/export]", error);
    return NextResponse.json({ error: "Falha ao exportar." }, { status: 500 });
  }
}
