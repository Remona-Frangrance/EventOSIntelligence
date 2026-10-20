import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitors, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  try {
    if (code) {
      const rows = await db.select().from(visitors).where(eq(visitors.code, code.toUpperCase()));
      if (rows[0]) return NextResponse.json(rows[0]);
      const memV = memoryStore.getVisitorByCode(code);
      if (memV) return NextResponse.json(memV);
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }
    const rows = eventId
      ? await db.select().from(visitors).where(eq(visitors.eventId, eventId)).orderBy(desc(visitors.createdAt))
      : await db.select().from(visitors).orderBy(desc(visitors.createdAt));
    if (rows && rows.length > 0) return NextResponse.json(rows);
    return NextResponse.json(memoryStore.getVisitors(eventId || undefined));
  } catch {
    if (code) {
      const memV = memoryStore.getVisitorByCode(code);
      if (memV) return NextResponse.json(memV);
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }
    return NextResponse.json(memoryStore.getVisitors(eventId || undefined));
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  let targetEventId = body.eventId;
  try {
    const evList = await db.select().from(events);
    const validEvent =
      evList.find((e) => e.id === body.eventId || e.slug === body.eventId) ||
      evList.find((e) => e.status === "live") ||
      evList[0];
    if (validEvent) targetEventId = validEvent.id;
  } catch {
    const memEv = memoryStore.getEvents();
    const fallback =
      memEv.find((e) => e.id === body.eventId || e.slug === body.eventId) ||
      memEv.find((e) => e.status === "live") ||
      memEv[0];
    targetEventId = fallback?.id || "ev-nexathon-26";
  }

  const isCheckedIn = body.checkedIn !== undefined ? Boolean(body.checkedIn) : true;
  const visitorData = {
    eventId: targetEventId,
    name: body.name || "Attendee",
    email: body.email || "",
    phone: body.phone || "",
    type: body.type || "visitor",
    interests: Array.isArray(body.interests) ? body.interests : [],
    code: makeCode("VIS", 5),
    checkedIn: isCheckedIn,
    checkinAt: isCheckedIn ? new Date() : null,
  };

  try {
    const [row] = await db.insert(visitors).values(visitorData).returning();
    memoryStore.addVisitor({
      ...visitorData,
      id: row.id,
      checkinAt: row.checkinAt ? row.checkinAt.toISOString() : null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    const memRow = {
      id: "vis-" + Math.random().toString(36).substring(2, 8),
      ...visitorData,
      checkinAt: isCheckedIn ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    memoryStore.addVisitor(memRow);
    return NextResponse.json(memRow, { status: 201 });
  }
}
