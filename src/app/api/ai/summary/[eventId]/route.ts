import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedbacks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { summarizeFeedback } from "@/lib/ai";

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const fb = await db.select().from(feedbacks).where(eq(feedbacks.eventId, eventId));
  const summary = summarizeFeedback(fb.map((f) => f.message));
  return NextResponse.json({ count: fb.length, ...summary });
}
