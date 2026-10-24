import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { eventUpdateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await db.select().from(events).where(eq(events.id, id));
    if (!rows[0]) {
      if (!isProduction) {
        const mem = memoryStore.getEvents().find((e) => e.id === id);
        if (mem) return NextResponse.json(mem);
      }
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    if (!isProduction) {
      const mem = memoryStore.getEvents().find((e) => e.id === id);
      if (mem) return NextResponse.json(mem);
    }
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Enforce admin-only access for updating event settings
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const clientIp = getClientIp(req);

  try {
    const body = await req.json();

    const validation = validateBody(eventUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const updates: Record<string, any> = { ...validation.data };
    if (updates.startsAt) updates.startsAt = new Date(updates.startsAt);
    if (updates.endsAt) updates.endsAt = new Date(updates.endsAt);

    const [row] = await db.update(events).set(updates).where(eq(events.id, id)).returning();

    await logAudit({
      organizationId: row?.organizationId || auth.user.organizationId,
      eventId: id,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "EVENT_UPDATE",
      targetType: "event",
      targetId: id,
      details: updates,
      ipAddress: clientIp,
    });

    return NextResponse.json(row);
  } catch (err: any) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to update event in database" }, { status: 500 });
    }
    return NextResponse.json({ id });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Enforce admin-only access for deleting an event
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;
  const clientIp = getClientIp(req);

  try {
    await db.delete(events).where(eq(events.id, id));

    await logAudit({
      organizationId: auth.user.organizationId,
      eventId: id,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "EVENT_DELETE",
      targetType: "event",
      targetId: id,
      ipAddress: clientIp,
    });

    return NextResponse.json({ ok: true, message: "Event deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
