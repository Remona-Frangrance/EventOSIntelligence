import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedbacks, projects } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { analyzeSentiment } from "@/lib/ai";
import { memoryStore } from "@/lib/demoData";
import { feedbackSchema, validateBody } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const projectId = searchParams.get("projectId");

  try {
    let rows = await db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt));
    if (eventId) rows = rows.filter((r) => r.eventId === eventId);
    if (projectId) rows = rows.filter((r) => r.projectId === projectId);
    if (rows && rows.length > 0) return NextResponse.json(rows);

    if (isProduction) return NextResponse.json([]);
    return NextResponse.json(memoryStore.getFeedbacks(eventId || undefined, projectId || undefined));
  } catch {
    if (isProduction) return NextResponse.json([], { status: 200 });
    return NextResponse.json(memoryStore.getFeedbacks(eventId || undefined, projectId || undefined));
  }
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req);

  // 1. Rate limiting: 15 feedback submissions per 10 minutes per IP
  const rateLimit = checkRateLimit(`feedback:${clientIp}`, 15, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetInSec, "Voting rate limit reached. Please wait before submitting more feedback.");
  }

  try {
    const rawBody = await req.json();

    // 2. Validate input with Zod
    const validation = validateBody(feedbackSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const {
      eventId,
      projectId,
      message,
      rating = 5,
      authorName = "Visitor",
      authorRole = "visitor",
      authorEmail = "",
      visitorCode = "",
    } = validation.data;

    // 3. Prevent Duplicate Voting / Feedback
    // If visitor provides an email or code, or IP-based check
    if (projectId) {
      try {
        const existing = await db
          .select({ id: feedbacks.id, authorEmail: feedbacks.authorEmail, visitorCode: feedbacks.visitorCode })
          .from(feedbacks)
          .where(eq(feedbacks.projectId, projectId));

        const isDuplicate = existing.some((f) => {
          if (authorEmail && f.authorEmail && f.authorEmail.toLowerCase() === authorEmail.toLowerCase()) {
            return true;
          }
          if (visitorCode && f.visitorCode && f.visitorCode.toUpperCase() === visitorCode.toUpperCase()) {
            return true;
          }
          return false;
        });

        if (isDuplicate) {
          return NextResponse.json(
            { error: "You have already cast your vote / review for this project booth." },
            { status: 409 }
          );
        }
      } catch (checkErr) {
        // Continue if check query fails
      }
    }

    const sentiment = analyzeSentiment(message || "");
    const fbData = {
      eventId,
      projectId: projectId || null,
      authorName,
      authorRole,
      authorEmail,
      visitorCode,
      rating,
      message,
      sentiment,
    };

    try {
      const [row] = await db.insert(feedbacks).values(fbData).returning();

      // If tied to a project, increment project votes count
      if (projectId) {
        await db.execute(sql`update projects set votes = votes + 1 where id = ${projectId}`).catch(() => {});
      }

      await logAudit({
        eventId,
        actorEmail: authorEmail || authorName,
        actorRole: authorRole,
        action: "FEEDBACK_SUBMIT",
        targetType: "project",
        targetId: projectId || "",
        details: { rating, sentiment, authorName },
        ipAddress: clientIp,
      });

      return NextResponse.json(row, { status: 201 });
    } catch (dbErr) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to save feedback in database" }, { status: 500 });
      }

      const memRow = {
        id: "fb-" + Math.random().toString(36).substring(2, 8),
        ...fbData,
        createdAt: new Date().toISOString(),
      };
      memoryStore.addFeedback(memRow);
      return NextResponse.json(memRow, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Feedback submission failed" }, { status: 500 });
  }
}
