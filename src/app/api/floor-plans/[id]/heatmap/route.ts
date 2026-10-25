import { NextResponse } from "next/server";
import { db } from "@/db";
import { floorPlans, events, scans } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/authGuard";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

/**
 * GET /api/floor-plans/[id]/heatmap
 * Returns dedicated heatmap analytics.
 * CRITICAL REQUIREMENT: Heatmap data: count only scans where scans.eventId = the plan's eventId.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser(req);

  try {
    let plan: any = null;
    try {
      const rows = await db.select().from(floorPlans).where(eq(floorPlans.id, id));
      if (rows.length > 0) plan = rows[0];
    } catch {}

    if (!plan && !isProduction) {
      plan = memoryStore.getFloorPlanById(id);
    }

    if (!plan) {
      return NextResponse.json({ error: "Floor plan not found" }, { status: 404 });
    }

    // Load associated event
    let eventRecord: any = null;
    try {
      const evRows = await db.select().from(events).where(eq(events.id, plan.eventId));
      if (evRows.length > 0) eventRecord = evRows[0];
    } catch {}

    if (!eventRecord && !isProduction) {
      eventRecord = memoryStore.getEventById(plan.eventId);
    }

    // Scoped by admin's organization
    if (
      authUser &&
      authUser.role === "admin" &&
      authUser.organizationId &&
      eventRecord?.organizationId &&
      authUser.organizationId !== eventRecord.organizationId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot view heatmap data for another organization's event" },
        { status: 403 }
      );
    }

    // STRICT REQUIREMENT: Count only scans where scans.eventId = plan.eventId
    let scanGroup: { projectId: string; count: number }[] = [];
    let recentScanRows: any[] = [];

    try {
      const counts = await db
        .select({
          projectId: scans.projectId,
          count: count(scans.id),
        })
        .from(scans)
        .where(eq(scans.eventId, plan.eventId))
        .groupBy(scans.projectId);

      scanGroup = counts.map((c) => ({
        projectId: c.projectId,
        count: Number(c.count),
      }));

      recentScanRows = await db
        .select()
        .from(scans)
        .where(eq(scans.eventId, plan.eventId))
        .orderBy(desc(scans.createdAt))
        .limit(20);
    } catch {}

    const projectScanMap = new Map<string, number>();
    for (const item of scanGroup) {
      projectScanMap.set(item.projectId, item.count);
    }

    let maxScans = 1;
    for (const c of projectScanMap.values()) {
      if (c > maxScans) maxScans = c;
    }

    const booths = Array.isArray(plan.booths) ? plan.booths : [];
    let totalPlanScans = 0;
    let busiestBooth: any = null;

    const heatmapBooths = booths.map((booth: any) => {
      const pId = booth.projectId;
      const scanCount = pId ? (projectScanMap.get(pId) || 0) : 0;
      totalPlanScans += scanCount;
      const intensity = scanCount > 0 ? Math.min(1, Math.round((scanCount / maxScans) * 100) / 100) : 0;

      const item = {
        boothId: booth.id,
        label: booth.label,
        projectId: pId || null,
        x: booth.x,
        y: booth.y,
        width: booth.width,
        height: booth.height,
        scanCount,
        intensity, // 0.0 to 1.0
      };

      if (!busiestBooth || scanCount > busiestBooth.scanCount) {
        if (scanCount > 0) busiestBooth = item;
      }

      return item;
    });

    return NextResponse.json({
      planId: plan.id,
      planName: plan.name,
      eventId: plan.eventId,
      eventName: eventRecord?.name || "",
      totalScans: totalPlanScans,
      maxScans,
      busiestBooth,
      booths: heatmapBooths,
      recentScans: recentScanRows.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        visitorCode: s.visitorCode,
        createdAt: s.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to calculate floor plan heatmap", details: err.message },
      { status: 500 }
    );
  }
}
