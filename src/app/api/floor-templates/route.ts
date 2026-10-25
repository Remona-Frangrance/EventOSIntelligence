import { NextResponse } from "next/server";
import { db } from "@/db";
import { floorTemplates, floorPlans, events, organizations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { floorTemplateCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

/**
 * GET /api/floor-templates
 * Scoped to the logged-in admin's organization.
 * Returns organization-level layout templates (which contain NO project or visitor data).
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let orgId = auth.user.organizationId;
    if (!orgId) {
      try {
        const orgRows = await db.select({ id: organizations.id }).from(organizations).limit(1);
        if (orgRows[0]?.id) orgId = orgRows[0].id;
      } catch {}
    }

    let templates: any[] = [];
    if (orgId) {
      try {
        templates = await db
          .select()
          .from(floorTemplates)
          .where(eq(floorTemplates.organizationId, orgId))
          .orderBy(desc(floorTemplates.createdAt));
      } catch {}
    }

    if (templates.length === 0 && !isProduction) {
      templates = memoryStore.getFloorTemplates(orgId || undefined);
    }

    return NextResponse.json(templates);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve floor templates", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/floor-templates
 * "Save as template" option:
 * Stores a layout at the organization level (floor_templates table) so it can be reused for new events.
 * CRITICAL REQUIREMENT: Templates contain NO project or visitor data.
 */
export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  try {
    const rawBody = await req.json();
    const validation = validateBody(floorTemplateCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const body = validation.data;

    // Resolve target organization
    let targetOrgId = auth.user.organizationId;
    if (!targetOrgId) {
      try {
        const orgRows = await db.select({ id: organizations.id }).from(organizations).limit(1);
        if (orgRows[0]?.id) targetOrgId = orgRows[0].id;
      } catch {}
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { error: "Organization required to save floor template" },
        { status: 400 }
      );
    }

    let walls = body.walls || [];
    let openings = body.openings || [];
    let booths = body.booths || [];
    let gridWidth = body.gridWidth ?? 20;
    let gridHeight = body.gridHeight ?? 15;

    // If sourcePlanId is provided, extract layout from existing floor plan
    if (body.sourcePlanId) {
      let sourcePlan: any = null;
      try {
        const pRows = await db.select().from(floorPlans).where(eq(floorPlans.id, body.sourcePlanId));
        if (pRows.length > 0) sourcePlan = pRows[0];
      } catch {}

      if (!sourcePlan && !isProduction) {
        sourcePlan = memoryStore.getFloorPlanById(body.sourcePlanId);
      }

      if (!sourcePlan) {
        return NextResponse.json({ error: "Source floor plan not found" }, { status: 404 });
      }

      // Check organization boundary of source plan's event
      let srcEvent: any = null;
      try {
        const evRows = await db.select().from(events).where(eq(events.id, sourcePlan.eventId));
        if (evRows.length > 0) srcEvent = evRows[0];
      } catch {}

      if (!srcEvent && !isProduction) {
        srcEvent = memoryStore.getEventById(sourcePlan.eventId);
      }

      if (srcEvent?.organizationId && srcEvent.organizationId !== targetOrgId) {
        return NextResponse.json(
          { error: "Forbidden: Cannot create template from another organization's floor plan" },
          { status: 403 }
        );
      }

      gridWidth = sourcePlan.gridWidth;
      gridHeight = sourcePlan.gridHeight;
      walls = sourcePlan.walls || [];
      openings = sourcePlan.openings || [];

      // CRITICAL REQUIREMENT: Templates contain NO project or visitor data.
      // Strip all project and visitor references, preserving only structural coordinates and labels.
      booths = (sourcePlan.booths || []).map((b: any) => ({
        id: b.id || "b-" + Math.random().toString(36).substring(2, 7),
        label: b.label || "Booth",
        x: b.x,
        y: b.y,
        width: b.width || 1,
        height: b.height || 1,
        color: b.color || "",
      }));
    } else {
      // Clean booths if provided directly: explicitly delete any projectId
      booths = booths.map((b: any) => ({
        id: b.id || "b-" + Math.random().toString(36).substring(2, 7),
        label: b.label || "Booth",
        x: b.x,
        y: b.y,
        width: b.width || 1,
        height: b.height || 1,
        color: b.color || "",
      }));
    }

    const templateData = {
      organizationId: targetOrgId,
      name: body.name.trim(),
      description: body.description || "",
      gridWidth,
      gridHeight,
      walls,
      openings,
      booths,
    };

    let createdTemplate: any = null;
    try {
      const [inserted] = await db.insert(floorTemplates).values(templateData).returning();
      createdTemplate = inserted;
    } catch (dbErr: any) {
      if (isProduction) {
        return NextResponse.json(
          { error: "Failed to persist floor template to database", details: dbErr.message },
          { status: 500 }
        );
      }

      createdTemplate = {
        id: "tpl-" + Math.random().toString(36).substring(2, 9),
        ...templateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.addFloorTemplate(createdTemplate);
    }

    await logAudit({
      organizationId: targetOrgId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "FLOOR_TEMPLATE_CREATE",
      targetType: "floor_template",
      targetId: createdTemplate.id,
      details: {
        name: createdTemplate.name,
        boothsCount: booths.length,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json(createdTemplate, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create floor template" },
      { status: 400 }
    );
  }
}
