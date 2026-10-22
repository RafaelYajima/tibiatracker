import { NextRequest, NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 
 * GET /api/friends
 * Lista amizades aceitas e pedidos pendentes (enviados e recebidos).
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // Busca todas as amizades onde o usuário está envolvido
    const rows = await db
      .select({
        id: friendships.id,
        status: friendships.status,
        createdAt: friendships.createdAt,
        userId: friendships.userId,
        friendId: friendships.friendId,
        friendInfo: users, // Pegaremos os dados do 'outro' usuário
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, sql`CASE WHEN ${friendships.userId} = ${user.id}::uuid THEN ${friendships.friendId} ELSE ${friendships.userId} END`))
      .where(or(eq(friendships.userId, user.id), eq(friendships.friendId, user.id)));

    const result = rows.map(r => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      friendId: r.friendId,
      friend: {
        id: r.friendInfo.id,
        name: r.friendInfo.name,
        email: r.friendInfo.email,
      }
    }));

    return NextResponse.json({ friendships: result });
  } catch (error) {
    console.error("[GET /api/friends]", error);
    return NextResponse.json({ error: "Falha ao carregar amigos." }, { status: 500 });
  }
}

/** 
 * POST /api/friends
 * Envia um pedido de amizade.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { friendId } = await req.json();
    if (!friendId || friendId === user.id) {
      return NextResponse.json({ error: "ID de amigo inválido." }, { status: 400 });
    }

    // Verifica se já existe amizade
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, user.id), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, user.id))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Já existe um pedido ou amizade." }, { status: 409 });
    }

    const [inserted] = await db
      .insert(friendships)
      .values({
        userId: user.id,
        friendId: friendId,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ friendship: inserted }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/friends]", error);
    return NextResponse.json({ error: "Falha ao enviar pedido." }, { status: 500 });
  }
}

