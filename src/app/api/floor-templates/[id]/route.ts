import { NextResponse } from "next/server";
import { db } from "@/db";
import { floorTemplates, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

/**
 * GET /api/floor-templates/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;

  try {
    let tpl: any = null;
    try {
      const rows = await db.select().from(floorTemplates).where(eq(floorTemplates.id, id));
      if (rows.length > 0) tpl = rows[0];
    } catch {}

    if (!tpl && !isProduction) {
      tpl = memoryStore.getFloorTemplateById(id);
    }

    if (!tpl) {
      return NextResponse.json({ error: "Floor template not found" }, { status: 404 });
    }

    if (
      auth.user.organizationId &&
      tpl.organizationId &&
      auth.user.organizationId !== tpl.organizationId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot access template from another organization" },
        { status: 403 }
      );
    }

    return NextResponse.json(tpl);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve floor template", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/floor-templates/[id]
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

  try {
    let tpl: any = null;
    try {
      const rows = await db.select().from(floorTemplates).where(eq(floorTemplates.id, id));
      if (rows.length > 0) tpl = rows[0];
    } catch {}

    if (!tpl && !isProduction) {
      tpl = memoryStore.getFloorTemplateById(id);
    }

    if (!tpl) {
      return NextResponse.json({ error: "Floor template not found" }, { status: 404 });
    }

    if (
      auth.user.organizationId &&
      tpl.organizationId &&
      auth.user.organizationId !== tpl.organizationId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete template from another organization" },
        { status: 403 }
      );
    }

    try {
      await db.delete(floorTemplates).where(eq(floorTemplates.id, id));
    } catch {
      if (!isProduction) {
        memoryStore.deleteFloorTemplate(id);
      }
    }

    await logAudit({
      organizationId: tpl.organizationId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "FLOOR_TEMPLATE_DELETE",
      targetType: "floor_template",
      targetId: id,
      details: { name: tpl.name },
      ipAddress: clientIp,
    });

    return NextResponse.json({ ok: true, message: "Floor template deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete floor template", details: err.message },
      { status: 500 }
    );
  }
}
