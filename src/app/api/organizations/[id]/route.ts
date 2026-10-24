import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, events, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum(["free", "event_pack", "pro"]).optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const orgList = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    if (!orgList.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgEvents = await db.select().from(events).where(eq(events.organizationId, id));
    const orgMembers = await db.select().from(users).where(eq(users.organizationId, id));

    return NextResponse.json({
      organization: orgList[0],
      eventsCount: orgEvents.length,
      membersCount: orgMembers.length,
      events: orgEvents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch organization" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const [updated] = await db
      .update(organizations)
      .set(parsed.data)
      .where(eq(organizations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await recordAuditLog({
      organizationId: id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "ORGANIZATION_UPDATED",
      targetType: "organization",
      targetId: id,
      details: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update organization" }, { status: 500 });
  }
}
