import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkProjectSchema = z.object({
  eventId: z.string().uuid(),
  projects: z.array(
    z.object({
      title: z.string().min(2),
      category: z.string().default("AI/ML"),
      teamName: z.string().min(1),
      leaderName: z.string().min(2),
      leaderEmail: z.string().optional().default(""),
      leaderPhone: z.string().optional().default(""),
      boothNo: z.string().optional().default(""),
      description: z.string().optional().default(""),
      techStack: z.array(z.string()).optional().default([]),
    })
  ).min(1, "Must provide at least 1 project"),
});

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = bulkProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { eventId, projects: importList } = parsed.data;

    // Verify event exists
    const evList = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!evList.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const insertedProjects = [];
    for (let i = 0; i < importList.length; i++) {
      const p = importList[i];
      const code = `PRJ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const boothNo = p.boothNo && p.boothNo.trim() ? p.boothNo.trim() : `B-${String(i + 1).padStart(2, "0")}`;

      const [newP] = await db
        .insert(projects)
        .values({
          eventId,
          title: p.title,
          category: p.category || "AI/ML",
          teamName: p.teamName,
          leaderName: p.leaderName,
          leaderEmail: p.leaderEmail || "",
          leaderPhone: p.leaderPhone || "",
          boothNo,
          description: p.description || "",
          techStack: p.techStack || [],
          code,
          status: "approved",
          views: 0,
          checkins: 0,
          votes: 0,
        })
        .returning();

      insertedProjects.push(newP);
    }

    await recordAuditLog({
      eventId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "PROJECTS_BULK_IMPORTED",
      targetType: "project",
      targetId: `${insertedProjects.length}_records`,
      details: { count: insertedProjects.length },
    });

    return NextResponse.json({
      success: true,
      importedCount: insertedProjects.length,
      projects: insertedProjects,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to bulk import projects" }, { status: 500 });
  }
}
