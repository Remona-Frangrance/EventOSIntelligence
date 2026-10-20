import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, scores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");
  const userId = searchParams.get("userId");

  try {
    if (code) {
      const rows = await db.select().from(projects).where(eq(projects.code, code));
      if (!rows[0]) {
        const memPrj = memoryStore.getProjects().find((p) => p.code === code);
        if (memPrj) return NextResponse.json({ ...memPrj, scoreCount: 3 });
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await db.update(projects).set({ views: (rows[0].views ?? 0) + 1 }).where(eq(projects.id, rows[0].id));
      const sc = await db.select().from(scores).where(eq(scores.projectId, rows[0].id));
      return NextResponse.json({ ...rows[0], views: (rows[0].views ?? 0) + 1, scoreCount: sc.length });
    }

    if (userId) {
      const rows = await db.select().from(projects).where(eq(projects.userId, userId));
      if (rows[0]) return NextResponse.json(rows[0]);
      const memPrj = memoryStore.getProjectByUserId(userId);
      if (memPrj) return NextResponse.json(memPrj);
      return NextResponse.json(null);
    }

    const q = eventId
      ? await db.select().from(projects).where(eq(projects.eventId, eventId)).orderBy(desc(projects.votes))
      : await db.select().from(projects).orderBy(desc(projects.createdAt));
    return NextResponse.json(q);
  } catch {
    // Database connection offline/initializing - fallback
    if (code) {
      const memPrj = memoryStore.getProjects().find((p) => p.code === code);
      if (memPrj) return NextResponse.json({ ...memPrj, scoreCount: 3 });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (userId) {
      const memPrj = memoryStore.getProjectByUserId(userId);
      return NextResponse.json(memPrj || null);
    }
    const memProjects = memoryStore.getProjects(eventId || undefined);
    return NextResponse.json(memProjects);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const code = makeCode("PRJ");
  const boothNo = `B-${Math.floor(Math.random() * 80 + 1)}`;

  const projectData = {
    eventId: body.eventId || "ev-nexathon-26",
    userId: body.userId || null,
    title: body.title,
    category: body.category || "AI/ML",
    teamName: body.teamName,
    leaderName: body.leaderName,
    leaderEmail: body.leaderEmail || "",
    leaderPhone: body.leaderPhone || "",
    members: body.members || [],
    description: body.description || "",
    techStack: body.techStack || [],
    imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    demoUrl: body.demoUrl || "",
    repoUrl: body.repoUrl || "",
    videoUrl: body.videoUrl || "",
    code,
    status: "approved",
    boothNo,
  };

  try {
    const [row] = await db.insert(projects).values(projectData).returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    const mockRow = {
      id: "p-" + Math.random().toString(36).substring(2, 9),
      ...projectData,
      views: 1,
      checkins: 0,
      votes: 0,
      createdAt: new Date().toISOString(),
    };
    memoryStore.addProject(mockRow);
    return NextResponse.json(mockRow, { status: 201 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...rest } = body;

  try {
    const [row] = await db.update(projects).set(rest).where(eq(projects.id, id)).returning();
    memoryStore.updateProject(id, rest);
    return NextResponse.json(row);
  } catch {
    const updated = memoryStore.updateProject(id, rest);
    return NextResponse.json(updated || { id, ...rest });
  }
}
