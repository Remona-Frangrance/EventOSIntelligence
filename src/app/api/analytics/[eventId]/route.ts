import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, visitors, scores, scans, feedbacks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [projs, vis, sc, sn, fb] = await Promise.all([
    db.select().from(projects).where(eq(projects.eventId, eventId)),
    db.select().from(visitors).where(eq(visitors.eventId, eventId)),
    db.select().from(scores).where(eq(scores.eventId, eventId)),
    db.select().from(scans).where(eq(scans.eventId, eventId)),
    db.select().from(feedbacks).where(eq(feedbacks.eventId, eventId)),
  ]);

  const checkedIn = vis.filter((v) => v.checkedIn).length;
  const byCategory: Record<string, number> = {};
  projs.forEach((p) => (byCategory[p.category] = (byCategory[p.category] || 0) + 1));

  const hourly: Record<string, number> = {};
  sn.forEach((s) => {
    const h = new Date(s.createdAt).getHours();
    const k = `${h}:00`;
    hourly[k] = (hourly[k] || 0) + 1;
  });

  const topProjects = [...projs]
    .map((p) => ({ id: p.id, title: p.title, team: p.teamName, views: p.views, checkins: p.checkins, votes: p.votes }))
    .sort((a, b) => b.checkins + b.views - (a.checkins + a.views))
    .slice(0, 6);

  const avgRating = fb.length ? fb.reduce((a, f) => a + f.rating, 0) / fb.length : 0;
  const sentiment = {
    positive: fb.filter((f) => f.sentiment === "positive").length,
    neutral: fb.filter((f) => f.sentiment === "neutral").length,
    negative: fb.filter((f) => f.sentiment === "negative").length,
  };

  return NextResponse.json({
    totals: {
      projects: projs.length,
      visitors: vis.length,
      checkedIn,
      checkinRate: vis.length ? Math.round((checkedIn / vis.length) * 100) : 0,
      scores: sc.length,
      scans: sn.length,
      feedback: fb.length,
      totalViews: projs.reduce((a, p) => a + (p.views || 0), 0),
      avgRating: Math.round(avgRating * 10) / 10,
      flags: sc.filter((s) => s.flagged).length,
    },
    byCategory,
    hourly,
    topProjects,
    sentiment,
    recentScans: sn.slice(0, 12),
  });
}
