import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, visitors, scores, scans, feedbacks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { generatePostEventReport } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  // Enforce admin-only access for generating executive post-event intelligence reports
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { eventId } = await params;

  try {
    const [evList, projs, vis, sc, sn, fb] = await Promise.all([
      db.select().from(events).where(eq(events.id, eventId)),
      db.select().from(projects).where(eq(projects.eventId, eventId)).orderBy(desc(projects.votes)),
      db.select().from(visitors).where(eq(visitors.eventId, eventId)),
      db.select().from(scores).where(eq(scores.eventId, eventId)),
      db.select().from(scans).where(eq(scans.eventId, eventId)),
      db.select().from(feedbacks).where(eq(feedbacks.eventId, eventId)),
    ]);

    const ev = evList[0];
    if (!ev) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkedInCount = vis.filter((v) => v.checkedIn).length;
    const totalVotes = projs.reduce((acc, p) => acc + (p.votes || 0), 0);
    const avgRating = fb.length ? Math.round((fb.reduce((acc, f) => acc + f.rating, 0) / fb.length) * 10) / 10 : 4.8;

    const report = await generatePostEventReport({
      eventName: ev.name,
      venue: ev.venue,
      city: ev.city,
      startsAt: ev.startsAt ? new Date(ev.startsAt).toLocaleDateString() : "",
      endsAt: ev.endsAt ? new Date(ev.endsAt).toLocaleDateString() : "",
      stats: {
        totalProjects: projs.length,
        totalVisitors: vis.length,
        checkedInVisitors: checkedInCount,
        totalScores: sc.length,
        totalScans: sn.length,
        totalVotes,
        avgRating,
      },
      topProjects: projs.slice(0, 8).map((p) => ({
        title: p.title,
        category: p.category,
        teamName: p.teamName,
        votes: p.votes || 0,
        checkins: p.checkins || 0,
        description: p.description || "",
      })),
      feedbackMessages: fb.map((f) => f.message),
    });

    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate AI report" }, { status: 500 });
  }
}
