import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, scores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  try {
    const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));
    const sc = await db.select().from(scores).where(eq(scores.eventId, eventId));

    if (projs && projs.length > 0) {
      const board = projs
        .map((p) => {
          const mine = sc.filter((s) => s.projectId === p.id);
          const totals = mine.map((s) => s.weightedTotal / 10);
          const avgScore = mine.length ? totals.reduce((a, b) => a + b, 0) / mine.length : 0;
          const flags = mine.filter((s) => s.flagged).length;
          return {
            ...p,
            judgeCount: mine.length,
            avgScore: Math.round(avgScore * 100) / 100,
            flags,
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore || b.votes - a.votes);
      return NextResponse.json(board);
    }

    if (isProduction) return NextResponse.json([]);
  } catch (err) {
    if (isProduction) return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }

  // Fallback to memoryStore only in non-production
  const memProjs = memoryStore.getProjects(eventId);
  const memScores = memoryStore.getScores({ eventId });

  const board = memProjs
    .map((p) => {
      const mine = memScores.filter((s) => s.projectId === p.id);
      const totals = mine.map((s) => s.weightedTotal / 10);
      const avgScore = mine.length ? totals.reduce((a, b) => a + b, 0) / mine.length : 0;
      const flags = mine.filter((s) => s.flagged).length;
      return {
        ...p,
        judgeCount: mine.length,
        avgScore: Math.round(avgScore * 100) / 100,
        flags,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore || b.votes - a.votes);

  return NextResponse.json(board);
}
