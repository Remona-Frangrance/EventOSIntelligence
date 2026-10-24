import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyApiKey } from "@/lib/apiKey";
import { memoryStore } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
  const category = searchParams.get("category");

  try {
    let query = db.select().from(projects);
    if (eventId) {
      query = db.select().from(projects).where(eq(projects.eventId, eventId)) as any;
    }

    const data = await query.limit(limit).offset(offset).orderBy(desc(projects.votes));
    if (data && data.length > 0) {
      let filtered = data;
      if (category) {
        filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }
      return NextResponse.json({
        object: "list",
        limit,
        offset,
        total: filtered.length,
        data: filtered,
      });
    }
  } catch {}

  let mem = memoryStore.getProjects(eventId || undefined);
  if (category) {
    mem = mem.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  const paginated = mem.slice(offset, offset + limit);

  return NextResponse.json({
    object: "list",
    limit,
    offset,
    total: mem.length,
    data: paginated,
  });
}
