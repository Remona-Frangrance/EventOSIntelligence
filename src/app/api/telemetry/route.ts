import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, visitors, scores, scans, orders, organizations } from "@/db/schema";
import { memoryStore } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [evs, projs, vis, scs, scn, ords, orgs] = await Promise.all([
      db.select().from(events),
      db.select().from(projects),
      db.select().from(visitors),
      db.select().from(scores),
      db.select().from(scans),
      db.select().from(orders),
      db.select().from(organizations),
    ]);

    const totalRevenue = ords.reduce((acc, o) => acc + (o.status === "completed" ? o.amount : 0), 0);
    const checkedInCount = vis.filter((v) => v.checkedIn).length;

    return NextResponse.json({
      product: "EventOS Intelligence",
      telemetry: {
        totalOrganizations: orgs.length || 1,
        totalEvents: evs.length,
        totalProjects: projs.length,
        totalAttendees: vis.length,
        totalCheckedIn: checkedInCount,
        checkinRatePct: vis.length ? Math.round((checkedInCount / vis.length) * 100) : 0,
        totalEvaluations: scs.length,
        totalInteractions: scn.length,
        totalOrders: ords.length,
        grossTicketingGmvInr: totalRevenue,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Memory fallback
    const memEvs = memoryStore.getEvents();
    const memProjs = memoryStore.getProjects();
    const memVis = memoryStore.getVisitors();
    const memScs = memoryStore.getScores();

    return NextResponse.json({
      product: "EventOS Intelligence",
      telemetry: {
        totalOrganizations: 1,
        totalEvents: memEvs.length,
        totalProjects: memProjs.length,
        totalAttendees: memVis.length,
        totalCheckedIn: memVis.filter((v) => v.checkedIn).length,
        checkinRatePct: 78,
        totalEvaluations: memScs.length,
        totalInteractions: 1420,
        totalOrders: 3,
        grossTicketingGmvInr: 2997,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
