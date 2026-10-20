import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, visitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recommendProjects } from "@/lib/ai";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId")!;
  const visitorCode = searchParams.get("visitorCode") || "";
  const interestsParam = searchParams.get("interests") || "";
  const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));
  let interests: string[] = interestsParam ? interestsParam.split(",") : [];
  if (visitorCode) {
    const v = await db.select().from(visitors).where(eq(visitors.code, visitorCode.toUpperCase()));
    if (v[0]) interests = (v[0].interests as string[]) || [];
  }
  const recs = recommendProjects(interests, projs.map((p) => ({ id: p.id, title: p.title, category: p.category, techStack: (p.techStack as string[]) || [] })));
  const enriched = recs.map((r) => ({ ...r, full: projs.find((p) => p.id === r.id) }));
  return NextResponse.json({ interests, recommendations: enriched });
}
