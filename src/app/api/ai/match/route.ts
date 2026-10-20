import { NextResponse } from "next/server";
import { db } from "@/db";
import { judges, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { judgeMatchScore } from "@/lib/ai";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId")!;
  const projectId = searchParams.get("projectId");
  const all = await db.select().from(judges).where(eq(judges.eventId, eventId));
  const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));
  if (projectId) {
    const p = projs.find((x) => x.id === projectId);
    if (!p) return NextResponse.json({ error: "project not found" }, { status: 404 });
    const ranked = all
      .map((j) => {
        const r = judgeMatchScore({
          judgeExpertise: (j.expertise as string[]) || [],
          projectCategory: p.category,
          projectTech: (p.techStack as string[]) || [],
        });
        return { judge: j, ...r };
      })
      .sort((a, b) => b.score - a.score);
    return NextResponse.json({ project: p, matches: ranked });
  }
  // full matrix: for each project top 2 judges
  const matrix = projs.map((p) => {
    const ranked = all
      .map((j) => ({
        judgeId: j.id,
        judgeName: j.name,
        ...judgeMatchScore({
          judgeExpertise: (j.expertise as string[]) || [],
          projectCategory: p.category,
          projectTech: (p.techStack as string[]) || [],
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return { projectId: p.id, title: p.title, category: p.category, topJudges: ranked };
  });
  return NextResponse.json({ matrix });
}
