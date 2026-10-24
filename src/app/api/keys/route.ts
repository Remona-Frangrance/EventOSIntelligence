import { NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { requireAuth } from "@/lib/authGuard";
import { generateRawApiKey } from "@/lib/apiKey";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    return NextResponse.json(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        permissions: k.permissions,
        status: k.status,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { name, permissions, eventId } = body;

    if (!name) {
      return NextResponse.json({ error: "API key name is required." }, { status: 400 });
    }

    const { rawKey, keyPrefix, keyHash } = generateRawApiKey();

    const [created] = await db
      .insert(apiKeys)
      .values({
        name: name.trim(),
        keyPrefix,
        keyHash,
        permissions: permissions || ["read"],
        eventId: eventId || null,
        status: "active",
      })
      .returning();

    // Return the raw key ONCE upon creation
    return NextResponse.json({
      status: "created",
      apiKey: rawKey,
      record: {
        id: created.id,
        name: created.name,
        keyPrefix: created.keyPrefix,
        permissions: created.permissions,
        status: created.status,
        createdAt: created.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate API key." }, { status: 500 });
  }
}
