import { NextResponse } from "next/server";
import { db } from "@/db";
import { judges, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { explainJudgeMatch } from "@/lib/llm";
import { judgeMatchScore } from "@/lib/ai";
import { requireAuth } from "@/lib/authGuard";

export async function GET(req: Request) {
  // Enforce admin-only access for jury matching matrix
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const projectId = searchParams.get("projectId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId query parameter is required" }, { status: 400 });
  }

  try {
    const all = await db.select().from(judges).where(eq(judges.eventId, eventId));
    const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));

    if (projectId) {
      const p = projs.find((x) => x.id === projectId);
      if (!p) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const ranked = await Promise.all(
        all.map(async (j) => {
          const matchResult = await explainJudgeMatch({
            judgeName: j.name,
            judgeOrg: j.organization,
            judgeExpertise: (j.expertise as string[]) || [],
            projectTitle: p.title,
            projectCategory: p.category,
            projectTech: (p.techStack as string[]) || [],
          });
          return { judge: j, ...matchResult };
        })
      );

      ranked.sort((a, b) => b.score - a.score);
      return NextResponse.json({ project: p, matches: ranked });
    }

    // full matrix: for each project top 3 judges with rationale
    const matrix = projs.map((p) => {
      const ranked = all
        .map((j) => {
          const base = judgeMatchScore({
            judgeExpertise: (j.expertise as string[]) || [],
            projectCategory: p.category,
            projectTech: (p.techStack as string[]) || [],
          });
          return {
            judgeId: j.id,
            judgeName: j.name,
            judgeOrg: j.organization,
            score: base.score,
            reasons: base.reasons,
            explanation: `${j.name}'s expertise aligns with ${p.category} and ${((p.techStack as string[]) || []).slice(0, 2).join(", ")}.`,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      return { projectId: p.id, title: p.title, category: p.category, topJudges: ranked };
    });

    return NextResponse.json({ matrix });
  } catch (err) {
    return NextResponse.json({ matrix: [] });
  }
}
