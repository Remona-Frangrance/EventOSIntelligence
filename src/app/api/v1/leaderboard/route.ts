import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, scores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyApiKey } from "@/lib/apiKey";
import { memoryStore } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId") || "ev-nexathon-26";

  try {
    const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));
    const sc = await db.select().from(scores).where(eq(scores.eventId, eventId));

    if (projs && projs.length > 0) {
      const board = projs
        .map((p) => {
          const mine = sc.filter((s) => s.projectId === p.id);
          const totals = mine.map((s) => (s.weightedTotal != null ? s.weightedTotal / 10 : s.total));
          const avgScore = mine.length ? totals.reduce((a, b) => a + b, 0) / mine.length : 0;
          const flags = mine.filter((s) => s.flagged).length;
          return {
            id: p.id,
            title: p.title,
            category: p.category,
            teamName: p.teamName,
            boothNo: p.boothNo,
            votes: p.votes,
            views: p.views,
            judgeCount: mine.length,
            avgScore: Math.round(avgScore * 100) / 100,
            flags,
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore || b.votes - a.votes);

      return NextResponse.json({
        object: "leaderboard",
        eventId,
        count: board.length,
        data: board,
      });
    }
  } catch {}

  const memProjs = memoryStore.getProjects(eventId);
  const memScores = memoryStore.getScores({ eventId });

  const board = memProjs
    .map((p) => {
      const mine = memScores.filter((s) => s.projectId === p.id);
      const totals = mine.map((s) => (s.weightedTotal != null ? s.weightedTotal / 10 : s.total));
      const avgScore = mine.length ? totals.reduce((a, b) => a + b, 0) / mine.length : 0;
      const flags = mine.filter((s) => s.flagged).length;
      return {
        id: p.id,
        title: p.title,
        category: p.category,
        teamName: p.teamName,
        boothNo: p.boothNo,
        votes: p.votes,
        views: p.views,
        judgeCount: mine.length,
        avgScore: Math.round(avgScore * 100) / 100,
        flags,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore || b.votes - a.votes);

  return NextResponse.json({
    object: "leaderboard",
    eventId,
    count: board.length,
    data: board,
  });
}
