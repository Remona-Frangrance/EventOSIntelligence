import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { verifyApiKey } from "@/lib/apiKey";
import { memoryStore } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const list = await db.select().from(events);
    if (list && list.length > 0) {
      return NextResponse.json({
        object: "list",
        data: list.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          type: e.type,
          status: e.status,
          venue: e.venue,
          city: e.city,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          categories: e.categories,
          scoringCriteria: e.scoringCriteria,
        })),
      });
    }
  } catch {}

  const mem = memoryStore.getEvents();
  return NextResponse.json({
    object: "list",
    data: mem.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      type: e.type,
      status: e.status,
      venue: e.venue,
      city: e.city,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      categories: e.categories,
      scoringCriteria: e.scoringCriteria,
    })),
  });
}
