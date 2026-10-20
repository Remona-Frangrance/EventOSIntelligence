import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedbacks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { analyzeSentiment } from "@/lib/ai";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const projectId = searchParams.get("projectId");

  try {
    let rows = await db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt));
    if (eventId) rows = rows.filter((r) => r.eventId === eventId);
    if (projectId) rows = rows.filter((r) => r.projectId === projectId);
    if (rows && rows.length > 0) return NextResponse.json(rows);
    return NextResponse.json(memoryStore.getFeedbacks(eventId || undefined, projectId || undefined));
  } catch {
    return NextResponse.json(memoryStore.getFeedbacks(eventId || undefined, projectId || undefined));
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const sentiment = analyzeSentiment(body.message || "");
  const fbData = {
    eventId: body.eventId || "ev-nexathon-26",
    projectId: body.projectId || null,
    authorName: body.authorName || "Visitor",
    authorRole: body.authorRole || "visitor",
    rating: Number(body.rating) || 5,
    message: body.message,
    sentiment,
  };

  try {
    const [row] = await db.insert(feedbacks).values(fbData).returning();
    memoryStore.addFeedback({ ...fbData, id: row.id, createdAt: new Date().toISOString() });
    return NextResponse.json(row, { status: 201 });
  } catch {
    const memRow = {
      id: "fb-" + Math.random().toString(36).substring(2, 8),
      ...fbData,
      createdAt: new Date().toISOString(),
    };
    memoryStore.addFeedback(memRow);
    return NextResponse.json(memRow, { status: 201 });
  }
}
