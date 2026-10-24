import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitors, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";
import { requireAuth, getAuthUser } from "@/lib/authGuard";
import { createSessionToken, getSessionCookieOptions } from "@/lib/session";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  // Public gate pass query by code
  if (code) {
    try {
      const rows = await db.select().from(visitors).where(eq(visitors.code, code.toUpperCase()));
      if (rows[0]) return NextResponse.json(rows[0]);
    } catch {}

    if (!isProduction) {
      const memV = memoryStore.getVisitorByCode(code);
      if (memV) return NextResponse.json(memV);
    }
    return NextResponse.json({ error: "Visitor pass not found" }, { status: 404 });
  }

  // Listing all visitors requires Admin role
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const rows = eventId
      ? await db.select().from(visitors).where(eq(visitors.eventId, eventId)).orderBy(desc(visitors.createdAt))
      : await db.select().from(visitors).orderBy(desc(visitors.createdAt));
    return NextResponse.json(rows);
  } catch {
    if (isProduction) return NextResponse.json([]);
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
    targetEventId = "9e33a337-5ba7-4c39-9265-426931e481af";
  }

  // Self gate check-in or pre-registration
  const isCheckedIn = body.checkedIn !== undefined ? Boolean(body.checkedIn) : true;
  const visitorData = {
    eventId: targetEventId,
    name: body.name || "Attendee",
    email: body.email ? body.email.trim().toLowerCase() : "",
    phone: body.phone || "",
    type: body.type || "visitor",
    interests: Array.isArray(body.interests) ? body.interests : [],
    code: makeCode("VIS", 5),
    checkedIn: isCheckedIn,
    checkinAt: isCheckedIn ? new Date() : null,
  };

  let createdVisitor: any = null;

  try {
    const [row] = await db.insert(visitors).values(visitorData).returning();
    createdVisitor = row;
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to persist visitor in database" }, { status: 500 });
    }
    const memRow = {
      id: "vis-" + Math.random().toString(36).substring(2, 8),
      ...visitorData,
      checkinAt: isCheckedIn ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    memoryStore.addVisitor(memRow);
    createdVisitor = memRow;
  }

  const caller = await getAuthUser(req);

  const response = NextResponse.json(createdVisitor, { status: 201 });

  // Only attach visitor session cookie if the caller is NOT already logged in as admin
  // This prevents logging out reception staff/admin when creating walk-in passes!
  if (!caller || caller.role !== "admin") {
    const sessionUser = {
      id: createdVisitor.id,
      name: createdVisitor.name,
      email: createdVisitor.email || `${createdVisitor.code.toLowerCase()}@visitor.eventos.local`,
      role: "visitor" as const,
    };

    const sessionToken = await createSessionToken(sessionUser);
    const cookieOptions = getSessionCookieOptions();

    response.cookies.set({
      ...cookieOptions,
      value: sessionToken,
    });
  }

  return response;
}
