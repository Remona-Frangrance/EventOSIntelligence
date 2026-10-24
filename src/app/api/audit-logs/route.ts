import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Enforce admin-only access
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const limitParam = parseInt(searchParams.get("limit") || "50", 10);
  const limit = Math.min(Math.max(1, limitParam), 200);

  try {
    const query = db.select().from(auditLogs);
    if (eventId) {
      const rows = await query.where(eq(auditLogs.eventId, eventId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
      return NextResponse.json(rows);
    }

    const rows = await query.orderBy(desc(auditLogs.createdAt)).limit(limit);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: "Failed to retrieve audit logs" }, { status: 500 });
  }
}
