import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { checkinSchema, validateBody } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  // 1. Enforce access control: Admin, Event Staff, and Visitor Gate Pass Checkin
  const auth = await requireAuth(req, ["admin", "visitor", "judge", "participant"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  // 2. Rate limit: 60 check-in requests per minute per IP
  const rateLimit = checkRateLimit(`checkin:${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetInSec, "Scanner rate limit reached. Please wait a moment.");
  }

  try {
    const rawBody = await req.json();

    // 3. Validate input with Zod
    const validation = validateBody(checkinSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const cleanCode = validation.data.code.trim().toUpperCase();

    // 4. Query DB
    let visitorRecord: any = null;
    try {
      const rows = await db.select().from(visitors).where(eq(visitors.code, cleanCode));
      if (rows[0]) {
        visitorRecord = rows[0];
      }
    } catch (dbErr) {
      if (isProduction) {
        return NextResponse.json({ error: "Database error during check-in" }, { status: 500 });
      }
    }

    // Memory fallback in non-production
    if (!visitorRecord && !isProduction) {
      const memV = memoryStore.getVisitors().find((v) => v.code?.toUpperCase() === cleanCode);
      if (memV) visitorRecord = memV;
    }

    if (!visitorRecord) {
      return NextResponse.json({ error: "Pass not found. Verify the badge code and retry." }, { status: 404 });
    }

    // 5. Prevent DUPLICATE check-in
    if (visitorRecord.checkedIn) {
      const checkinTimeFormatted = visitorRecord.checkinAt
        ? new Date(visitorRecord.checkinAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "earlier today";

      await logAudit({
        organizationId: auth.user.organizationId,
        eventId: visitorRecord.eventId,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "CHECKIN_DUPLICATE",
        targetType: "visitor",
        targetId: visitorRecord.id,
        details: { code: cleanCode, name: visitorRecord.name },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        ...visitorRecord,
        alreadyIn: true,
        message: `${visitorRecord.name} was already checked in at ${checkinTimeFormatted}.`,
      });
    }

    // 6. Perform valid check-in
    const now = new Date();
    try {
      const [updated] = await db
        .update(visitors)
        .set({ checkedIn: true, checkinAt: now })
        .where(eq(visitors.id, visitorRecord.id))
        .returning();

      await logAudit({
        organizationId: auth.user.organizationId,
        eventId: visitorRecord.eventId,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "CHECKIN_SUCCESS",
        targetType: "visitor",
        targetId: visitorRecord.id,
        details: { code: cleanCode, name: visitorRecord.name },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        ...updated,
        alreadyIn: false,
        message: `Welcome in, ${visitorRecord.name.split(" ")[0]}!`,
      });
    } catch (err) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to record check-in in database" }, { status: 500 });
      }

      memoryStore.checkInVisitor(visitorRecord.id);
      return NextResponse.json({
        ...visitorRecord,
        checkedIn: true,
        checkinAt: now.toISOString(),
        alreadyIn: false,
        message: `Welcome in, ${visitorRecord.name.split(" ")[0]}!`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Check-in failed" }, { status: 500 });
  }
}
