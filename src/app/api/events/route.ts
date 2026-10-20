import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, visitors, scores, scans } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";

export async function GET() {
  try {
    const all = await db.select().from(events).orderBy(desc(events.createdAt));
    if (all.length === 0) {
      return NextResponse.json(memoryStore.getEvents());
    }

    const withStats = await Promise.all(
      all.map(async (e) => {
        const [p] = await db.select({ c: count() }).from(projects).where(eq(projects.eventId, e.id));
        const [v] = await db.select({ c: count() }).from(visitors).where(eq(visitors.eventId, e.id));
        const [s] = await db.select({ c: count() }).from(scores).where(eq(scores.eventId, e.id));
        const [sc] = await db.select({ c: count() }).from(scans).where(eq(scans.eventId, e.id));
        return { ...e, stats: { projects: p.c, visitors: v.c, scores: s.c, scans: sc.c } };
      })
    );

    // Prioritize active live events with projects
    withStats.sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return (b.stats?.projects || 0) - (a.stats?.projects || 0);
    });

    return NextResponse.json(withStats);
  } catch {
    // Database connection offline/initializing - fallback to memory store
    return NextResponse.json(memoryStore.getEvents());
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const slug = (body.slug || body.name || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60) + "-" + Math.floor(Math.random() * 9000 + 1000);

  const eventData = {
    name: body.name || "New Fest",
    slug,
    type: body.type || "hackathon",
    tagline: body.tagline || "",
    description: body.description || "",
    venue: body.venue || "",
    city: body.city || "",
    startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
    endsAt: body.endsAt ? new Date(body.endsAt) : new Date(Date.now() + 86400000),
    status: body.status || "live",
    bannerGradient: body.bannerGradient || "from-violet-600 via-fuchsia-500 to-amber-400",
    scoringCriteria: body.scoringCriteria || [
      { key: "innovation", label: "Innovation", max: 10, weight: 1.2 },
      { key: "execution", label: "Execution", max: 10, weight: 1.0 },
      { key: "impact", label: "Impact", max: 10, weight: 1.0 },
      { key: "pitch", label: "Pitch", max: 10, weight: 0.8 },
    ],
    categories: body.categories || ["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech"],
    registrationOpen: body.registrationOpen ?? true,
  };

  try {
    const [row] = await db.insert(events).values(eventData).returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    const mockRow = {
      id: "ev-" + Math.random().toString(36).substring(2, 9),
      ...eventData,
      startsAt: eventData.startsAt.toISOString(),
      endsAt: eventData.endsAt.toISOString(),
      createdAt: new Date().toISOString(),
      stats: { projects: 0, visitors: 0, scores: 0, scans: 0 },
    };
    memoryStore.addEvent(mockRow);
    return NextResponse.json(mockRow, { status: 201 });
  }
}
