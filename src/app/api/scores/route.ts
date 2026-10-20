import { NextResponse } from "next/server";
import { db } from "@/db";
import { scores, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { fairScoreCheck } from "@/lib/ai";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
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
  } catch {
    const memScores = memoryStore.getScores({
      eventId: eventId || undefined,
      projectId: projectId || undefined,
      judgeId: judgeId || undefined,
    });
    return NextResponse.json(memScores);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { eventId = "ev-nexathon-26", projectId, judgeId, criteriaScores, comment } = body;

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
    const v = Number(criteriaScores?.[c.key] ?? 0);
    total += v;
    weighted += v * (c.weight ?? 1);
  }
  weighted = Math.round(weighted * 10);

  // Fair-score check
  const memExisting = memoryStore.getScores({ projectId });
  const totals = memExisting.map((s) => s.total);
  const check = fairScoreCheck([...totals, total], total);

  // Sync to memoryStore
  const memScore = {
    id: "sc-" + Math.random().toString(36).substring(2, 9),
    eventId,
    projectId,
    judgeId,
    criteriaScores: criteriaScores || {},
    total,
    weightedTotal: weighted,
    comment: comment || "",
    flagged: check.flagged,
    flagReason: check.reason,
    createdAt: new Date().toISOString(),
  };
  memoryStore.addScore(memScore);

  // Try DB
  try {
    const existing = await db.select().from(scores).where(eq(scores.projectId, projectId));
    const dup = existing.find((s) => s.judgeId === judgeId);
    if (dup) {
      const [row] = await db
        .update(scores)
        .set({
          criteriaScores,
          total,
          weightedTotal: weighted,
          comment: comment || "",
          flagged: check.flagged,
          flagReason: check.reason,
        })
        .where(eq(scores.id, dup.id))
        .returning();
      return NextResponse.json({ ...row, ai: check });
    }

    const [row] = await db
      .insert(scores)
      .values({
        eventId,
        projectId,
        judgeId,
        criteriaScores,
        total,
        weightedTotal: weighted,
        comment: comment || "",
        flagged: check.flagged,
        flagReason: check.reason,
      })
      .returning();
    return NextResponse.json({ ...row, ai: check }, { status: 201 });
  } catch {
    return NextResponse.json({ ...memScore, ai: check }, { status: 201 });
  }
}
