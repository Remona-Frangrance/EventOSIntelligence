import { NextResponse } from "next/server";
import { db } from "@/db";
import { scans, projects } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const rows = eventId
    ? await db.select().from(scans).where(eq(scans.eventId, eventId)).orderBy(desc(scans.createdAt))
    : await db.select().from(scans).orderBy(desc(scans.createdAt));
  return NextResponse.json(rows.slice(0, 500));
}

export async function POST(req: Request) {
  const body = await req.json();
  const [row] = await db
    .insert(scans)
    .values({ eventId: body.eventId, projectId: body.projectId, visitorCode: body.visitorCode || "", source: body.source || "qr" })
    .returning();
  await db.execute(sql`update projects set checkins = checkins + 1 where id = ${body.projectId}`);
  return NextResponse.json(row, { status: 201 });
}
