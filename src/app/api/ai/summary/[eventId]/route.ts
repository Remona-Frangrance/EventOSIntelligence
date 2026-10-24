import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedbacks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSmartFeedbackSummary } from "@/lib/llm";
import { requireAuth } from "@/lib/authGuard";

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  try {
    const fb = await db.select().from(feedbacks).where(eq(feedbacks.eventId, eventId));
    const summary = await generateSmartFeedbackSummary(fb.map((f) => f.message));
    return NextResponse.json({ count: fb.length, ...summary });
  } catch (err) {
    return NextResponse.json({
      count: 0,
      headline: "No feedback recorded yet",
      score: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      keywords: [],
      themes: [],
      frictionPoints: [],
      actionItems: [],
      poweredBy: "Deterministic Rule-Engine",
    });
  }
}
