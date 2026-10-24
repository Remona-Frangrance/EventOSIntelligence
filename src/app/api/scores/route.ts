import { NextResponse } from "next/server";
import { db } from "@/db";
import { scores, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { fairScoreCheck } from "@/lib/ai";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { scoreCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  // Public leaderboard uses /api/leaderboard; individual score breakdown requires judge or admin
  const auth = await requireAuth(req, ["judge", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const projectId = searchParams.get("projectId");
  const judgeId = searchParams.get("judgeId");

  try {
    let rows = await db.select().from(scores).orderBy(desc(scores.createdAt));
    if (eventId) rows = rows.filter((r) => r.eventId === eventId);
    if (projectId) rows = rows.filter((r) => r.projectId === projectId);
    if (judgeId) rows = rows.filter((r) => r.judgeId === judgeId);
    return NextResponse.json(rows);
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to retrieve scores" }, { status: 500 });
    }
    const memScores = memoryStore.getScores({
      eventId: eventId || undefined,
      projectId: projectId || undefined,
      judgeId: judgeId || undefined,
    });
    return NextResponse.json(memScores);
  }
}

export async function POST(req: Request) {
  // 1. Role enforcement: Judge or Admin
  const auth = await requireAuth(req, ["judge", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  try {
    const rawBody = await req.json();

    // 2. Validate input with Zod
    const validation = validateBody(scoreCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const { eventId, projectId, judgeId, criteriaScores, comment = "" } = validation.data;

    const numericScores: Record<string, number> = {};
    for (const [k, v] of Object.entries(criteriaScores || {})) {
      numericScores[k] = Number(v) || 0;
    }

    let criteria = [
      { key: "innovation", label: "Innovation", max: 10, weight: 1.2 },
      { key: "execution", label: "Execution", max: 10, weight: 1.0 },
      { key: "impact", label: "Impact", max: 10, weight: 1.0 },
      { key: "pitch", label: "Pitch", max: 10, weight: 0.8 },
    ];

    try {
      const ev = await db.select().from(events).where(eq(events.id, eventId));
      if (ev[0]?.scoringCriteria) {
        criteria = ev[0].scoringCriteria as typeof criteria;
      }
    } catch {}

    let total = 0;
    let weighted = 0;
    for (const c of criteria) {
      const v = numericScores[c.key] ?? 0;
      total += v;
      weighted += v * (c.weight ?? 1);
    }
    weighted = Math.round(weighted * 10);

    // Fair-score statistical check
    let existingTotals: number[] = [];
    try {
      const prjScores = await db.select({ total: scores.total }).from(scores).where(eq(scores.projectId, projectId));
      existingTotals = prjScores.map((s) => s.total);
    } catch {
      existingTotals = memoryStore.getScores({ projectId }).map((s) => s.total);
    }

    const check = fairScoreCheck([...existingTotals, total], total);

    // 3. Prevent duplicate scores: check if judge already submitted a score for this project
    let existingScoreId: string | null = null;
    try {
      const existing = await db
        .select()
        .from(scores)
        .where(eq(scores.projectId, projectId));
      const match = existing.find((s) => s.judgeId === judgeId && s.eventId === eventId);
      if (match) {
        existingScoreId = match.id;
      }
    } catch {}

    if (existingScoreId) {
      // Upsert: Update existing score to prevent duplicate score skew
      const [updatedRow] = await db
        .update(scores)
        .set({
          criteriaScores: numericScores,
          total,
          weightedTotal: weighted,
          comment,
          flagged: check.flagged,
          flagReason: check.reason,
        })
        .where(eq(scores.id, existingScoreId))
        .returning();

      await logAudit({
        organizationId: auth.user.organizationId,
        eventId,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "SCORE_UPDATE",
        targetType: "score",
        targetId: existingScoreId,
        details: { projectId, judgeId, total, weighted, flagged: check.flagged },
        ipAddress: clientIp,
      });

      return NextResponse.json({ ...updatedRow, isUpdate: true, ai: check });
    }

    // Insert new score
    try {
      const [row] = await db
        .insert(scores)
        .values({
          eventId,
          projectId,
          judgeId,
          criteriaScores: numericScores,
          total,
          weightedTotal: weighted,
          comment,
          flagged: check.flagged,
          flagReason: check.reason,
        })
        .returning();

      await logAudit({
        organizationId: auth.user.organizationId,
        eventId,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "SCORE_SUBMIT",
        targetType: "score",
        targetId: row.id,
        details: { projectId, judgeId, total, weighted, flagged: check.flagged },
        ipAddress: clientIp,
      });

      return NextResponse.json({ ...row, ai: check }, { status: 201 });
    } catch (err) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to persist score in database" }, { status: 500 });
      }

      const memScore = {
        id: "sc-" + Math.random().toString(36).substring(2, 9),
        eventId,
        projectId,
        judgeId,
        criteriaScores: numericScores,
        total,
        weightedTotal: weighted,
        comment,
        flagged: check.flagged,
        flagReason: check.reason,
        createdAt: new Date().toISOString(),
      };
      memoryStore.addScore(memScore);
      return NextResponse.json({ ...memScore, ai: check }, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Scoring submission failed" }, { status: 500 });
  }
}
