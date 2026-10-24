import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors, sponsorLeads, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSponsorSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  tier: z.enum(["title", "platinum", "gold", "silver", "bronze"]).default("gold"),
  logoUrl: z.string().optional().default(""),
  website: z.string().optional().default(""),
  boothNo: z.string().optional().default(""),
  brochureUrl: z.string().optional().default(""),
  contactEmail: z.string().email().optional().or(z.literal("")),
  passcode: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  try {
    let query = db.select().from(sponsors);
    if (eventId) {
      query = query.where(eq(sponsors.eventId, eventId)) as any;
    }
    const list = await query.orderBy(desc(sponsors.createdAt));

    // Get lead counts per sponsor
    const allLeads = await db.select().from(sponsorLeads);
    const leadCountMap: Record<string, number> = {};
    allLeads.forEach((l) => {
      leadCountMap[l.sponsorId] = (leadCountMap[l.sponsorId] || 0) + 1;
    });

    const enriched = list.map((s) => ({
      ...s,
      leadCount: leadCountMap[s.id] || 0,
    }));

    return NextResponse.json(enriched);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load sponsors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = createSponsorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { eventId, name, tier, logoUrl, website, boothNo, brochureUrl, contactEmail, passcode } = parsed.data;

    // Generate passcode if none provided
    const generatedPasscode = passcode && passcode.trim() !== ""
      ? passcode.trim().toUpperCase()
      : `${name.slice(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    const [newSponsor] = await db
      .insert(sponsors)
      .values({
        eventId,
        name,
        tier,
        logoUrl,
        website,
        boothNo,
        brochureUrl,
        contactEmail: contactEmail || "",
        passcode: generatedPasscode,
        views: 0,
      })
      .returning();

    await recordAuditLog({
      eventId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "SPONSOR_ONBOARDED",
      targetType: "sponsor",
      targetId: newSponsor.id,
      details: { name: newSponsor.name, tier: newSponsor.tier, boothNo: newSponsor.boothNo },
    });

    return NextResponse.json(newSponsor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create sponsor" }, { status: 500 });
  }
}
