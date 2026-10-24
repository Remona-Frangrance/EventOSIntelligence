import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsorLeads, sponsors, visitors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const captureLeadSchema = z.object({
  sponsorId: z.string().uuid(),
  visitorCode: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional().default(""),
  rating: z.number().int().min(1).max(5).default(3),
  capturedBy: z.string().optional().default("Booth Scanner"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sponsorId = searchParams.get("sponsorId");
  const eventId = searchParams.get("eventId");

  if (!sponsorId && !eventId) {
    return NextResponse.json({ error: "sponsorId or eventId required" }, { status: 400 });
  }

  try {
    let query = db.select().from(sponsorLeads);
    if (sponsorId) {
      query = query.where(eq(sponsorLeads.sponsorId, sponsorId)) as any;
    } else if (eventId) {
      query = query.where(eq(sponsorLeads.eventId, eventId)) as any;
    }

    const leads = await query.orderBy(desc(sponsorLeads.createdAt));
    return NextResponse.json(leads);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load sponsor leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = captureLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { sponsorId, visitorCode, name, email, phone, company, notes, rating, capturedBy } = parsed.data;

    // Load sponsor
    const sponList = await db.select().from(sponsors).where(eq(sponsors.id, sponsorId)).limit(1);
    if (!sponList.length) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }
    const sponsor = sponList[0];

    let leadName = name || "Attendee";
    let leadEmail = email || "";
    let leadPhone = phone || "";
    let leadInterests: string[] = [];

    // If visitorCode provided, lookup visitor profile
    if (visitorCode && visitorCode.trim()) {
      const cleanCode = visitorCode.trim().toUpperCase();
      const visList = await db.select().from(visitors).where(eq(visitors.code, cleanCode)).limit(1);
      if (visList.length) {
        const vis = visList[0];
        leadName = vis.name;
        leadEmail = vis.email || leadEmail;
        leadPhone = vis.phone || leadPhone;
        leadInterests = (vis.interests as string[]) || [];
      }
    }

    if (!leadEmail && !email) {
      leadEmail = `lead-${Math.random().toString(36).substring(2, 8)}@eventattendee.com`;
    }

    // Check if lead already captured by this sponsor
    const existing = await db
      .select()
      .from(sponsorLeads)
      .where(eq(sponsorLeads.sponsorId, sponsorId));

    const duplicate = existing.find((l) => l.visitorEmail.toLowerCase() === leadEmail.toLowerCase());
    if (duplicate) {
      // Update existing lead notes and rating
      const [updated] = await db
        .update(sponsorLeads)
        .set({
          notes: notes ? `${duplicate.notes ? duplicate.notes + " | " : ""}${notes}` : duplicate.notes,
          rating: rating || duplicate.rating,
        })
        .where(eq(sponsorLeads.id, duplicate.id))
        .returning();

      return NextResponse.json({
        lead: updated,
        isUpdate: true,
        message: `Lead for ${leadName} updated with latest interaction notes.`,
      });
    }

    const [newLead] = await db
      .insert(sponsorLeads)
      .values({
        sponsorId,
        eventId: sponsor.eventId,
        visitorName: leadName,
        visitorEmail: leadEmail,
        visitorPhone: leadPhone,
        visitorCompany: company || "Attendee / Organization",
        interests: leadInterests,
        notes: notes || "Met at sponsor booth",
        rating: rating || 3,
        capturedBy: capturedBy || "Booth Scanner",
      })
      .returning();

    return NextResponse.json({
      lead: newLead,
      isUpdate: false,
      message: `Lead for ${leadName} captured successfully!`,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to capture sponsor lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
  }

  try {
    await db.delete(sponsorLeads).where(eq(sponsorLeads.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete lead" }, { status: 500 });
  }
}
