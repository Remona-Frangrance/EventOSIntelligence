import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, scores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { projectCreateSchema, projectUpdateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");
  const userId = searchParams.get("userId");
  const leaderEmail = searchParams.get("leaderEmail");

  try {
    if (code) {
      const rows = await db.select().from(projects).where(eq(projects.code, code.toUpperCase()));
      if (!rows[0]) {
        if (!isProduction) {
          const memPrj = memoryStore.getProjects().find((p) => p.code.toUpperCase() === code.toUpperCase());
          if (memPrj) return NextResponse.json({ ...memPrj, scoreCount: 3 });
        }
        return NextResponse.json({ error: "Project booth not found" }, { status: 404 });
      }
      await db.update(projects).set({ views: (rows[0].views ?? 0) + 1 }).where(eq(projects.id, rows[0].id));
      const sc = await db.select().from(scores).where(eq(scores.projectId, rows[0].id));
      return NextResponse.json({ ...rows[0], views: (rows[0].views ?? 0) + 1, scoreCount: sc.length });
    }

    if (userId || leaderEmail) {
      if (userId) {
        const rows = await db.select().from(projects).where(eq(projects.userId, userId));
        if (rows[0]) return NextResponse.json(rows[0]);
      }
      if (leaderEmail) {
        const rows = await db.select().from(projects).where(eq(projects.leaderEmail, leaderEmail.toLowerCase()));
        if (rows[0]) return NextResponse.json(rows[0]);
      }

      if (!isProduction) {
        if (userId) {
          const memPrj = memoryStore.getProjectByUserId(userId);
          if (memPrj) return NextResponse.json(memPrj);
        }
        if (leaderEmail) {
          const memPrj = memoryStore.getProjects().find((p) => p.leaderEmail?.toLowerCase() === leaderEmail.toLowerCase());
          if (memPrj) return NextResponse.json(memPrj);
        }
      }
      return NextResponse.json(null);
    }

    const q = eventId
      ? await db.select().from(projects).where(eq(projects.eventId, eventId)).orderBy(desc(projects.votes))
      : await db.select().from(projects).orderBy(desc(projects.createdAt));
    return NextResponse.json(q);
  } catch (err) {
    if (code) {
      if (!isProduction) {
        const memPrj = memoryStore.getProjects().find((p) => p.code.toUpperCase() === code.toUpperCase());
        if (memPrj) return NextResponse.json({ ...memPrj, scoreCount: 3 });
      }
      return NextResponse.json({ error: "Project booth not found" }, { status: 404 });
    }
    if (isProduction) return NextResponse.json([]);
    const memProjects = memoryStore.getProjects(eventId || undefined);
    return NextResponse.json(memProjects);
  }
}

export async function POST(req: Request) {
  // Enforce authentication: participant or admin
  const auth = await requireAuth(req, ["participant", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  try {
    const rawBody = await req.json();

    // Validate input with Zod
    const validation = validateBody(projectCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const body = validation.data;
    const code = makeCode("PRJ");
    const boothNo = `B-${Math.floor(Math.random() * 80 + 1)}`;

    const projectData = {
      eventId: body.eventId,
      userId: auth.user.id || body.userId || null,
      title: body.title,
      category: body.category || "AI/ML",
      teamName: body.teamName,
      leaderName: body.leaderName,
      leaderEmail: body.leaderEmail || auth.user.email || "",
      leaderPhone: body.leaderPhone || "",
      members: body.members || [],
      description: body.description || "",
      techStack: Array.isArray(body.techStack) ? body.techStack : [body.techStack].filter(Boolean),
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

      await logAudit({
        organizationId: auth.user.organizationId,
        eventId: body.eventId,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "PROJECT_CREATE",
        targetType: "project",
        targetId: row.id,
        details: { title: row.title, code: row.code },
        ipAddress: clientIp,
      });

      return NextResponse.json(row, { status: 201 });
    } catch (err) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to persist project in database" }, { status: 500 });
      }

      const mockRow = {
        id: "p-" + Math.random().toString(36).substring(2, 9),
        ...projectData,
        userId: projectData.userId || undefined,
        views: 1,
        checkins: 0,
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      memoryStore.addProject(mockRow);
      return NextResponse.json(mockRow, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  // Enforce authentication: participant or admin
  const auth = await requireAuth(req, ["participant", "admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);
  const rawBody = await req.json();

  const validation = validateBody(projectUpdateSchema, rawBody);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
  }

  const { id, ...rest } = validation.data;

  try {
    const [row] = await db.update(projects).set(rest).where(eq(projects.id, id)).returning();

    await logAudit({
      organizationId: auth.user.organizationId,
      eventId: row?.eventId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "PROJECT_UPDATE",
      targetType: "project",
      targetId: id,
      details: rest,
      ipAddress: clientIp,
    });

    return NextResponse.json(row);
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to update project in database" }, { status: 500 });
    }
    const memUpdates = {
      ...rest,
      techStack: Array.isArray(rest.techStack) ? rest.techStack : rest.techStack ? [rest.techStack] : undefined,
    };
    const updated = memoryStore.updateProject(id, memUpdates);
    return NextResponse.json(updated || { id, ...rest });
  }
}
