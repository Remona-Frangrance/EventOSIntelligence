import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitors, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyApiKey } from "@/lib/apiKey";
import { memoryStore } from "@/lib/demoData";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const { code, eventId } = body;

    if (!code) {
      return NextResponse.json({ error: "Badge pass code is required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check DB
    try {
      const records = await db.select().from(visitors).where(eq(visitors.code, cleanCode)).limit(1);
      if (records && records.length > 0) {
        const v = records[0];
        const wasCheckedIn = v.checkedIn;

        if (!wasCheckedIn) {
          await db
            .update(visitors)
            .set({ checkedIn: true, checkinAt: new Date() })
            .where(eq(visitors.id, v.id));

          logAudit({
            eventId: v.eventId,
            action: "api_checkin",
            targetType: "visitor",
            targetId: v.id,
            details: { name: v.name, code: v.code, source: "v1_rest_api" },
          });
        }

        return NextResponse.json({
          status: "success",
          checkedIn: true,
          wasAlreadyCheckedIn: wasCheckedIn,
          attendee: {
            id: v.id,
            name: v.name,
            email: v.email,
            type: v.type,
            code: v.code,
            interests: v.interests,
            checkinAt: v.checkinAt || new Date().toISOString(),
          },
        });
      }
    } catch {}

    // Memory fallback
    const memVisitor = memoryStore.getVisitorByCode(cleanCode);
    if (memVisitor) {
      const wasCheckedIn = memVisitor.checkedIn;
      memoryStore.checkInVisitor(memVisitor.id);
      return NextResponse.json({
        status: "success",
        checkedIn: true,
        wasAlreadyCheckedIn: wasCheckedIn,
        attendee: {
          id: memVisitor.id,
          name: memVisitor.name,
          email: memVisitor.email,
          type: memVisitor.type,
          code: memVisitor.code,
          interests: memVisitor.interests,
          checkinAt: memVisitor.checkinAt || new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ error: "Badge code not found." }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to process check-in." }, { status: 500 });
  }
}
