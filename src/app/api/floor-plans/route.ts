import { NextResponse } from "next/server";
import { db } from "@/db";
import { floorPlans, events, projects, scans, organizations } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, getAuthUser } from "@/lib/authGuard";
import { floorPlanCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

/**
 * GET /api/floor-plans?eventId=<eventId>
 * Scoped by eventId and logged-in admin's organization.
 * Includes heatmap scan metrics counted strictly where scans.eventId = plan.eventId.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Query parameter 'eventId' is required" }, { status: 400 });
  }

  const authUser = await getAuthUser(req);

  try {
    // 1. Verify Event existence and Organization Scope
    let eventRecord: any = null;
    try {
      const evRows = await db.select().from(events).where(eq(events.id, eventId));
      if (evRows.length > 0) eventRecord = evRows[0];
    } catch {}

    if (!eventRecord && !isProduction) {
      eventRecord = memoryStore.getEventById(eventId);
    }

    if (!eventRecord) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Organization multi-tenant boundary check:
    // If the user is an admin belonging to an organization, they cannot view another org's floor plans.
    if (
      authUser &&
      authUser.role === "admin" &&
      authUser.organizationId &&
      eventRecord.organizationId &&
      authUser.organizationId !== eventRecord.organizationId
    ) {
      return NextResponse.json(
        { error: "Access denied. Event belongs to another organization." },
        { status: 403 }
      );
    }

    // 2. Fetch Floor Plans for this Event
    let plans: any[] = [];
    try {
      plans = await db
        .select()
        .from(floorPlans)
        .where(and(eq(floorPlans.eventId, eventId), eq(floorPlans.status, "active")))
        .orderBy(desc(floorPlans.isDefault), desc(floorPlans.createdAt));
    } catch {}

    if (plans.length === 0 && !isProduction) {
      plans = memoryStore.getFloorPlans(eventId);
    }

    // 3. Compute Heatmap Data:
    // "Heatmap data: count only scans where scans.eventId = the plan's eventId."
    let eventScans: { projectId: string; count: number }[] = [];
    try {
      const scanCounts = await db
        .select({
          projectId: scans.projectId,
          count: count(scans.id),
        })
        .from(scans)
        .where(eq(scans.eventId, eventId))
        .groupBy(scans.projectId);

      eventScans = scanCounts.map((sc) => ({
        projectId: sc.projectId,
        count: Number(sc.count),
      }));
    } catch {}

    const scanCountMap = new Map<string, number>();
    for (const s of eventScans) {
      scanCountMap.set(s.projectId, s.count);
    }

    // Calculate maximum scans across this event to normalize heatmap intensity
    let maxScans = 1;
    for (const c of scanCountMap.values()) {
      if (c > maxScans) maxScans = c;
    }

    // Enrich plans with heatmap metrics
    const enrichedPlans = plans.map((plan) => {
      const booths = Array.isArray(plan.booths) ? plan.booths : [];
      let totalPlanScans = 0;

      const enrichedBooths = booths.map((booth: any) => {
        const pId = booth.projectId;
        const scanCount = pId ? (scanCountMap.get(pId) || 0) : 0;
        totalPlanScans += scanCount;
        const heatIntensity = scanCount > 0 ? Math.min(1, Math.round((scanCount / maxScans) * 100) / 100) : 0;

        return {
          ...booth,
          scanCount,
          heatIntensity,
        };
      });

      return {
        ...plan,
        booths: enrichedBooths,
        heatmapStats: {
          totalScans: totalPlanScans,
          maxBoothScans: maxScans,
          activeBoothsWithScans: enrichedBooths.filter((b: any) => b.scanCount > 0).length,
        },
      };
    });

    return NextResponse.json(enrichedPlans);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve floor plans", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/floor-plans
 * Scoped by eventId and logged-in admin's organization.
 * Validates booth project assignments strictly:
 * - Only projects with the same eventId can be assigned.
 * - A project can be assigned to only one booth per plan.
 */
export async function POST(req: Request) {
  // 1. Enforce admin auth
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  try {
    const rawBody = await req.json();

    // 2. Validate input schema
    const validation = validateBody(floorPlanCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const body = validation.data;
    const { eventId } = body;

    // 3. Resolve and verify event organization
    let eventRecord: any = null;
    try {
      const evRows = await db.select().from(events).where(eq(events.id, eventId));
      if (evRows.length > 0) eventRecord = evRows[0];
    } catch {}

    if (!eventRecord && !isProduction) {
      eventRecord = memoryStore.getEventById(eventId);
    }

    if (!eventRecord) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Scoped by admin's organization: never modify plan from another organization
    if (
      auth.user.organizationId &&
      eventRecord.organizationId &&
      auth.user.organizationId !== eventRecord.organizationId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot create floor plans for events belonging to another organization" },
        { status: 403 }
      );
    }

    // 4. Validate Booth Project Assignments
    // Rule A: A project can be assigned to only one booth per plan.
    // Rule B: Only projects with the same eventId can be assigned.
    const booths = body.booths || [];
    const assignedProjectIds: string[] = [];

    for (const booth of booths) {
      if (booth.projectId && booth.projectId.trim()) {
        const pid = booth.projectId.trim();

        // Check uniqueness within the plan
        if (assignedProjectIds.includes(pid)) {
          return NextResponse.json(
            {
              error: `Invalid booth assignment: Project ${pid} is assigned to multiple booths. A project can be assigned to only one booth per plan.`,
            },
            { status: 400 }
          );
        }
        assignedProjectIds.push(pid);

        // Verify that the project belongs to the EXACT same eventId
        let projectRecord: any = null;
        try {
          const projRows = await db.select().from(projects).where(eq(projects.id, pid));
          if (projRows.length > 0) projectRecord = projRows[0];
        } catch {}

        if (!projectRecord && !isProduction) {
          projectRecord = memoryStore.getProjectById(pid);
        }

        if (!projectRecord) {
          return NextResponse.json(
            { error: `Project ${pid} was not found.` },
            { status: 400 }
          );
        }

        if (projectRecord.eventId !== eventId) {
          return NextResponse.json(
            {
              error: `Invalid booth assignment: Project "${projectRecord.title}" belongs to event "${projectRecord.eventId}", not the current event "${eventId}". Only projects with the same eventId can be assigned.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 5. Default plan management:
    // If marked default, or if it is the first plan for the event, mark isDefault = true
    let isDefault = body.isDefault ?? false;
    let existingPlansCount = 0;
    try {
      const [countRow] = await db
        .select({ c: count() })
        .from(floorPlans)
        .where(and(eq(floorPlans.eventId, eventId), eq(floorPlans.status, "active")));
      existingPlansCount = countRow?.c ?? 0;
    } catch {}

    if (existingPlansCount === 0) {
      isDefault = true;
    }

    if (isDefault) {
      // Clear isDefault on other active floor plans for this event
      try {
        await db
          .update(floorPlans)
          .set({ isDefault: false })
          .where(eq(floorPlans.eventId, eventId));
      } catch {}
    }

    // 6. Insert new floor plan
    const planData = {
      eventId,
      name: body.name.trim(),
      description: body.description || "",
      isDefault,
      status: "active",
      gridWidth: body.gridWidth ?? 20,
      gridHeight: body.gridHeight ?? 15,
      walls: body.walls || [],
      openings: body.openings || [],
      booths: booths,
    };

    let createdRow: any = null;
    try {
      const [inserted] = await db.insert(floorPlans).values(planData).returning();
      createdRow = inserted;

      // Synchronize project booth numbers if assigned
      for (const booth of booths) {
        if (booth.projectId && booth.label) {
          try {
            await db
              .update(projects)
              .set({ boothNo: booth.label })
              .where(eq(projects.id, booth.projectId));
          } catch {}
        }
      }
    } catch (dbErr: any) {
      if (isProduction) {
        return NextResponse.json(
          { error: "Failed to persist floor plan to database", details: dbErr.message },
          { status: 500 }
        );
      }

      // Memory fallback for development/testing
      createdRow = {
        id: "fp-" + Math.random().toString(36).substring(2, 9),
        ...planData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.addFloorPlan(createdRow);
    }

    // 7. Audit log
    await logAudit({
      organizationId: eventRecord.organizationId || auth.user.organizationId,
      eventId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "FLOOR_PLAN_CREATE",
      targetType: "floor_plan",
      targetId: createdRow.id,
      details: {
        name: createdRow.name,
        isDefault: createdRow.isDefault,
        boothsCount: booths.length,
        assignedProjectsCount: assignedProjectIds.length,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json(createdRow, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create floor plan" },
      { status: 400 }
    );
  }
}
