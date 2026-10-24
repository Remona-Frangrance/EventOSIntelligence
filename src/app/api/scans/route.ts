import { NextResponse } from "next/server";
import { db } from "@/db";
import { scans, projects } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  try {
    const rows = eventId
      ? await db.select().from(scans).where(eq(scans.eventId, eventId)).orderBy(desc(scans.createdAt))
      : await db.select().from(scans).orderBy(desc(scans.createdAt));
    return NextResponse.json(rows.slice(0, 500));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req);

  // Rate limiting: 60 scans per minute per IP
  const rateLimit = checkRateLimit(`scan:${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetInSec, "Too many scans. Please wait a moment.");
  }

  try {
    const body = await req.json();
    if (!body.eventId || !body.projectId) {
      return NextResponse.json({ error: "eventId and projectId are required" }, { status: 400 });
    }

    const [row] = await db
      .insert(scans)
      .values({
        eventId: body.eventId,
        projectId: body.projectId,
        visitorCode: body.visitorCode || "",
        source: body.source || "qr",
      })
      .returning();

    await db.execute(sql`update projects set checkins = checkins + 1 where id = ${body.projectId}`).catch(() => {});
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to record scan in database" }, { status: 500 });
    }
    return NextResponse.json({ success: true, mocked: true }, { status: 201 });
  }
}
