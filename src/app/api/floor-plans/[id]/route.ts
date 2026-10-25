import { NextResponse } from "next/server";
import { db } from "@/db";
import { floorPlans, events, projects, scans } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, getAuthUser } from "@/lib/authGuard";
import { floorPlanUpdateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Helper to fetch a floor plan and verify organization access.
 */
async function getPlanAndVerifyAccess(planId: string, authUser: any) {
  let plan: any = null;
  try {
    const rows = await db.select().from(floorPlans).where(eq(floorPlans.id, planId));
    if (rows.length > 0) plan = rows[0];
  } catch {}

  if (!plan && !isProduction) {
    plan = memoryStore.getFloorPlanById(planId);
  }

  if (!plan) {
    return { errorResponse: NextResponse.json({ error: "Floor plan not found" }, { status: 404 }) };
  }

  // Load the associated event
  let eventRecord: any = null;
  try {
    const evRows = await db.select().from(events).where(eq(events.id, plan.eventId));
    if (evRows.length > 0) eventRecord = evRows[0];
  } catch {}

  if (!eventRecord && !isProduction) {
    eventRecord = memoryStore.getEventById(plan.eventId);
  }

  if (!eventRecord) {
    return { errorResponse: NextResponse.json({ error: "Associated event not found" }, { status: 404 }) };
  }

  // Scoped by admin's organization: never return or modify a plan from another organization
  if (
    authUser &&
    authUser.organizationId &&
    eventRecord.organizationId &&
    authUser.organizationId !== eventRecord.organizationId
  ) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Cannot access floor plans belonging to another organization" },
        { status: 403 }
      ),
    };
  }

  return { plan, eventRecord };
}

/**
 * GET /api/floor-plans/[id]
 * Retrieves single floor plan with heatmap analytics strictly scoped to scans.eventId = plan.eventId.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser(req);

  const check = await getPlanAndVerifyAccess(id, authUser);
  if (check.errorResponse) return check.errorResponse;

  const { plan } = check;

  // Heatmap scan counts strictly where scans.eventId = plan.eventId
  let eventScans: { projectId: string; count: number }[] = [];
  try {
    const scanCounts = await db
      .select({
        projectId: scans.projectId,
        count: count(scans.id),
      })
      .from(scans)
      .where(eq(scans.eventId, plan.eventId))
      .groupBy(scans.projectId);

    eventScans = scanCounts.map((sc) => ({
      projectId: sc.projectId,
      count: Number(sc.count),
    }));
  } catch {}

  const scanMap = new Map<string, number>();
  for (const s of eventScans) {
    scanMap.set(s.projectId, s.count);
  }

  let maxScans = 1;
  for (const c of scanMap.values()) {
    if (c > maxScans) maxScans = c;
  }

  const booths = Array.isArray(plan.booths) ? plan.booths : [];
  let totalPlanScans = 0;
  const enrichedBooths = booths.map((booth: any) => {
    const pId = booth.projectId;
    const scanCount = pId ? (scanMap.get(pId) || 0) : 0;
    totalPlanScans += scanCount;
    const heatIntensity = scanCount > 0 ? Math.min(1, Math.round((scanCount / maxScans) * 100) / 100) : 0;

    return {
      ...booth,
      scanCount,
      heatIntensity,
    };
  });

  return NextResponse.json({
    ...plan,
    booths: enrichedBooths,
    heatmapStats: {
      totalScans: totalPlanScans,
      maxBoothScans: maxScans,
    },
  });
}

/**
 * PATCH /api/floor-plans/[id]
 * Updates floor plan layout, walls, openings, booth assignments, default status.
 * Enforces:
 * - Admin auth & organization boundary.
 * - Booth project assignment: only projects with the same eventId can be assigned.
 * - A project can be assigned to only one booth per plan.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const clientIp = getClientIp(req);

  const check = await getPlanAndVerifyAccess(id, auth.user);
  if (check.errorResponse) return check.errorResponse;

  const { plan, eventRecord } = check;

  try {
    const rawBody = await req.json();
    const validation = validateBody(floorPlanUpdateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const updates = validation.data;
    const planEventId = plan.eventId;

    // Validate booth assignments if booths are being updated
    if (updates.booths) {
      const assignedProjectIds: string[] = [];

      for (const booth of updates.booths) {
        if (booth.projectId && booth.projectId.trim()) {
          const pid = booth.projectId.trim();

          // Rule: A project can be assigned to only one booth per plan
          if (assignedProjectIds.includes(pid)) {
            return NextResponse.json(
              {
                error: `Invalid booth assignment: Project ${pid} is assigned to multiple booths in this floor plan. Each project can only be assigned to one booth per plan.`,
              },
              { status: 400 }
            );
          }
          assignedProjectIds.push(pid);

          // Rule: Only projects with the same eventId can be assigned
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

          if (projectRecord.eventId !== planEventId) {
            return NextResponse.json(
              {
                error: `Invalid booth assignment: Project "${projectRecord.title}" belongs to event "${projectRecord.eventId}", but this floor plan belongs to event "${planEventId}". Only projects with the same eventId can be assigned.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Default status handling
    if (updates.isDefault === true) {
      // Clear isDefault from other plans for this event
      try {
        await db
          .update(floorPlans)
          .set({ isDefault: false })
          .where(eq(floorPlans.eventId, planEventId));
      } catch {}
    }

    let updatedPlan: any = null;
    try {
      const [row] = await db
        .update(floorPlans)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(floorPlans.id, id))
        .returning();
      updatedPlan = row;

      // Update booth numbers in projects table
      if (updates.booths) {
        for (const booth of updates.booths) {
          if (booth.projectId && booth.label) {
            try {
              await db
                .update(projects)
                .set({ boothNo: booth.label })
                .where(eq(projects.id, booth.projectId));
            } catch {}
          }
        }
      }
    } catch (dbErr: any) {
      if (isProduction) {
        return NextResponse.json(
          { error: "Failed to update floor plan in database", details: dbErr.message },
          { status: 500 }
        );
      }

      updatedPlan = memoryStore.updateFloorPlan(id, updates);
    }

    await logAudit({
      organizationId: eventRecord.organizationId || auth.user.organizationId,
      eventId: planEventId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "FLOOR_PLAN_UPDATE",
      targetType: "floor_plan",
      targetId: id,
      details: updates,
      ipAddress: clientIp,
    });

    return NextResponse.json(updatedPlan);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update floor plan" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/floor-plans/[id]
 * Soft archives the floor plan (status = 'archived').
 * Preserves scan history and assigns new default if needed.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const clientIp = getClientIp(req);

  const check = await getPlanAndVerifyAccess(id, auth.user);
  if (check.errorResponse) return check.errorResponse;

  const { plan, eventRecord } = check;

  try {
    // Soft archive the floor plan
    try {
      await db
        .update(floorPlans)
        .set({ status: "archived", isDefault: false, updatedAt: new Date() })
        .where(eq(floorPlans.id, id));

      // If the archived plan was the default, pick the next active plan to be default
      if (plan.isDefault) {
        const remaining = await db
          .select()
          .from(floorPlans)
          .where(and(eq(floorPlans.eventId, plan.eventId), eq(floorPlans.status, "active")))
          .limit(1);

        if (remaining.length > 0) {
          await db
            .update(floorPlans)
            .set({ isDefault: true })
            .where(eq(floorPlans.id, remaining[0].id));
        }
      }
    } catch (dbErr) {
      if (!isProduction) {
        memoryStore.deleteFloorPlan(id);
      }
    }

    await logAudit({
      organizationId: eventRecord.organizationId || auth.user.organizationId,
      eventId: plan.eventId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "FLOOR_PLAN_ARCHIVE",
      targetType: "floor_plan",
      targetId: id,
      details: { name: plan.name },
      ipAddress: clientIp,
    });

    return NextResponse.json({ ok: true, message: "Floor plan archived successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to archive floor plan", details: err.message },
      { status: 500 }
    );
  }
}
