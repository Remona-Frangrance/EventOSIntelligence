import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, visitors, scores, scans, organizations, floorPlans, floorTemplates } from "@/db/schema";
import { desc, eq, count, and } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { eventCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");

  try {
    let all = await db.select().from(events).orderBy(desc(events.createdAt));

    // Multi-tenant scope if organizationId is specified
    if (organizationId) {
      all = all.filter((e) => e.organizationId === organizationId);
    }

    if (all.length === 0) {
      return NextResponse.json([]);
    }

    // Batch all 4 COUNT queries at once instead of N+1 per event
    const [projectCounts, visitorCounts, scoreCounts, scanCounts] = await Promise.all([
      db.select({ eventId: projects.eventId, c: count() }).from(projects).groupBy(projects.eventId),
      db.select({ eventId: visitors.eventId, c: count() }).from(visitors).groupBy(visitors.eventId),
      db.select({ eventId: scores.eventId, c: count() }).from(scores).groupBy(scores.eventId),
      db.select({ eventId: scans.eventId, c: count() }).from(scans).groupBy(scans.eventId),
    ]);

    const projMap = Object.fromEntries(projectCounts.map((r) => [r.eventId, Number(r.c)]));
    const visMap = Object.fromEntries(visitorCounts.map((r) => [r.eventId, Number(r.c)]));
    const scoreMap = Object.fromEntries(scoreCounts.map((r) => [r.eventId, Number(r.c)]));
    const scanMap = Object.fromEntries(scanCounts.map((r) => [r.eventId, Number(r.c)]));

    const withStats = all.map((e) => ({
      ...e,
      stats: {
        projects: projMap[e.id] ?? 0,
        visitors: visMap[e.id] ?? 0,
        scores: scoreMap[e.id] ?? 0,
        scans: scanMap[e.id] ?? 0,
      },
    }));

    // Deduplicate events by trimmed, lowercase name to prevent duplicates in dropdowns
    const seenNames = new Set<string>();
    const deduplicated: typeof withStats = [];

    for (const ev of withStats) {
      const normalized = (ev.name || "").trim().toLowerCase();
      if (!normalized) continue;
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        deduplicated.push(ev);
      }
    }

    // Sort: live events first, then newest creation date
    deduplicated.sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(deduplicated, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to retrieve events from database" }, { status: 500 });
    }
    return NextResponse.json(memoryStore.getEvents());
  }
}

export async function POST(req: Request) {
  // 1. Enforce admin-only access
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  try {
    const rawBody = await req.json();

    // 2. Validate input with Zod
    const validation = validateBody(eventCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const body = validation.data;
    const name = body.name.trim();

    // 3. Resolve Organization for Multi-Tenancy
    let targetOrgId = auth.user.organizationId || body.organizationId;
    if (!targetOrgId) {
      try {
        const orgRows = await db.select({ id: organizations.id }).from(organizations).limit(1);
        if (orgRows[0]?.id) targetOrgId = orgRows[0].id;
      } catch {}
    }

    // Check if an event with this exact name already exists
    try {
      const existing = await db.select().from(events);
      const matched = existing.find(
        (e) => (e.name || "").trim().toLowerCase() === name.toLowerCase()
      );
      if (matched) {
        return NextResponse.json(matched, { status: 200 });
      }
    } catch {}

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60) +
      "-" +
      Math.floor(Math.random() * 9000 + 1000);

    const eventData = {
      name,
      slug,
      type: body.type,
      tagline: body.tagline,
      description: body.description,
      venue: body.venue,
      city: body.city,
      organizationId: targetOrgId || null,
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

    let newEventRow: any = null;

    try {
      const [row] = await db.insert(events).values(eventData).returning();
      newEventRow = row;

      await logAudit({
        organizationId: targetOrgId,
        eventId: row.id,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "EVENT_CREATE",
        targetType: "event",
        targetId: row.id,
        details: { name: row.name, slug: row.slug },
        ipAddress: clientIp,
      });
    } catch (dbErr) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to persist event to database" }, { status: 500 });
      }

      const mockRow = {
        id: "ev-" + Math.random().toString(36).substring(2, 9),
        ...eventData,
        startsAt: eventData.startsAt.toISOString(),
        endsAt: eventData.endsAt.toISOString(),
        createdAt: new Date().toISOString(),
        stats: { projects: 0, visitors: 0, scores: 0, scans: 0 },
      };
      memoryStore.addEvent(mockRow);
      newEventRow = mockRow;
    }

    // REQUIREMENT: When an event is created, optionally offer "Start from template" or "Copy layout from a previous event".
    // When copying, copy walls, openings, and booth positions, but clear the project assignments.
    if (newEventRow && body.templateId) {
      try {
        let tpl: any = null;
        try {
          const tRows = await db.select().from(floorTemplates).where(eq(floorTemplates.id, body.templateId));
          if (tRows.length > 0) tpl = tRows[0];
        } catch {}

        if (!tpl && !isProduction) {
          tpl = memoryStore.getFloorTemplateById(body.templateId);
        }

        if (tpl) {
          // Clear project assignments while preserving walls, openings, and booth coordinates
          const cleanBooths = (tpl.booths || []).map((b: any) => ({
            id: b.id || "b-" + Math.random().toString(36).substring(2, 7),
            label: b.label || "Booth",
            x: b.x,
            y: b.y,
            width: b.width || 1,
            height: b.height || 1,
            projectId: null, // CLEAR project assignments
            boothNo: b.label,
            color: b.color || "",
          }));

          const planData = {
            eventId: newEventRow.id,
            name: tpl.name || "Main Exhibition Hall",
            description: tpl.description || "",
            isDefault: true,
            status: "active",
            gridWidth: tpl.gridWidth || 20,
            gridHeight: tpl.gridHeight || 15,
            walls: tpl.walls || [],
            openings: tpl.openings || [],
            booths: cleanBooths,
          };

          try {
            await db.insert(floorPlans).values(planData);
          } catch {
            if (!isProduction) {
              memoryStore.addFloorPlan({
                id: "fp-" + Math.random().toString(36).substring(2, 9),
                ...planData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (copyErr) {
        console.error("Failed to apply template floor plan:", copyErr);
      }
    } else if (newEventRow && body.copyFromEventId) {
      try {
        let prevPlans: any[] = [];
        try {
          prevPlans = await db
            .select()
            .from(floorPlans)
            .where(and(eq(floorPlans.eventId, body.copyFromEventId), eq(floorPlans.status, "active")));
        } catch {}

        if (prevPlans.length === 0 && !isProduction) {
          prevPlans = memoryStore.getFloorPlans(body.copyFromEventId);
        }

        for (const sp of prevPlans) {
          // Copy walls, openings, and booth positions, but clear the project assignments.
          const cleanBooths = (sp.booths || []).map((b: any) => ({
            id: b.id || "b-" + Math.random().toString(36).substring(2, 7),
            label: b.label || "Booth",
            x: b.x,
            y: b.y,
            width: b.width || 1,
            height: b.height || 1,
            projectId: null, // CLEAR project assignments
            boothNo: b.label,
            color: b.color || "",
          }));

          const planData = {
            eventId: newEventRow.id,
            name: sp.name,
            description: sp.description || "",
            isDefault: sp.isDefault,
            status: "active",
            gridWidth: sp.gridWidth,
            gridHeight: sp.gridHeight,
            walls: sp.walls || [],
            openings: sp.openings || [],
            booths: cleanBooths,
          };

          try {
            await db.insert(floorPlans).values(planData);
          } catch {
            if (!isProduction) {
              memoryStore.addFloorPlan({
                id: "fp-" + Math.random().toString(36).substring(2, 9),
                ...planData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (copyErr) {
        console.error("Failed to copy previous event floor plans:", copyErr);
      }
    }

    return NextResponse.json(newEventRow, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse request" }, { status: 400 });
  }
}
