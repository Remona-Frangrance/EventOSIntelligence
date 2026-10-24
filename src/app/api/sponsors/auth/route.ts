import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sponsorAuthSchema = z.object({
  passcode: z.string().min(1, "Passcode is required"),
  eventId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sponsorAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { passcode, eventId } = parsed.data;
    const cleanPasscode = passcode.trim().toUpperCase();

    let sponList = await db.select().from(sponsors).where(eq(sponsors.passcode, cleanPasscode));
    if (eventId) {
      sponList = sponList.filter((s) => s.eventId === eventId);
    }

    if (!sponList.length) {
      return NextResponse.json({ error: "Invalid sponsor access passcode" }, { status: 401 });
    }

    const sponsor = sponList[0];

    // Load event details
    const evList = await db.select().from(events).where(eq(events.id, sponsor.eventId)).limit(1);
    const event = evList[0] || null;

    // Increment impressions/views
    await db
      .update(sponsors)
      .set({ views: (sponsor.views || 0) + 1 })
      .where(eq(sponsors.id, sponsor.id));

    return NextResponse.json({
      success: true,
      sponsor: {
        id: sponsor.id,
        name: sponsor.name,
        tier: sponsor.tier,
        boothNo: sponsor.boothNo,
        logoUrl: sponsor.logoUrl,
        website: sponsor.website,
        brochureUrl: sponsor.brochureUrl,
        eventId: sponsor.eventId,
      },
      event: event ? { id: event.id, name: event.name, venue: event.venue } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to authenticate sponsor" }, { status: 500 });
  }
}
