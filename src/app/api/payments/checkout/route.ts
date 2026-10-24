import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, orders, visitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  eventId: z.string().uuid(),
  tierId: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email"),
  phone: z.string().optional().default(""),
  interests: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { eventId, tierId, name, email, phone, interests } = parsed.data;

    // Load event to verify ticket tier
    const evList = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!evList.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ev = evList[0];
    const tiers = (ev.ticketTiers as Array<{ id: string; name: string; price: number; currency: string; description?: string }>) || [];
    const selectedTier = tiers.find((t) => t.id === tierId) || {
      id: "free",
      name: "General Attendee",
      price: 0,
      currency: "INR",
    };

    // Check if visitor with this email already registered for this event
    const existingVisitors = await db.select().from(visitors).where(eq(visitors.eventId, eventId));
    let visitor = existingVisitors.find((v) => v.email.toLowerCase() === email.toLowerCase());

    const isPaid = selectedTier.price > 0;
    const initialStatus = isPaid ? "pending" : "paid";
    const paymentProvider = isPaid ? (process.env.RAZORPAY_KEY_ID ? "razorpay" : "mock") : "free";

    // Generate unique visitor code if new
    const code = visitor ? visitor.code : `VIS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (!visitor) {
      const [newVisitor] = await db
        .insert(visitors)
        .values({
          eventId,
          name,
          email,
          phone,
          type: selectedTier.id === "vip" ? "vip" : "visitor",
          interests,
          code,
          checkedIn: false,
        })
        .returning();
      visitor = newVisitor;
    }

    // Create Order record
    const providerOrderId = isPaid ? `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : `free_${Date.now()}`;

    const [order] = await db
      .insert(orders)
      .values({
        organizationId: ev.organizationId,
        eventId,
        visitorId: visitor.id,
        tierId: selectedTier.id,
        tierName: selectedTier.name,
        amount: selectedTier.price,
        currency: selectedTier.currency || "INR",
        status: initialStatus,
        paymentProvider,
        providerOrderId,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
      })
      .returning();

    await recordAuditLog({
      organizationId: ev.organizationId || undefined,
      eventId,
      actorEmail: email,
      actorRole: "visitor",
      action: isPaid ? "TICKET_CHECKOUT_INITIATED" : "TICKET_ISSUED_FREE",
      targetType: "order",
      targetId: order.id,
      details: {
        tier: selectedTier.name,
        price: selectedTier.price,
        visitorCode: visitor.code,
        provider: paymentProvider,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      providerOrderId,
      amount: selectedTier.price,
      currency: selectedTier.currency || "INR",
      tierName: selectedTier.name,
      visitorCode: visitor.code,
      isPaid,
      status: order.status,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
      paymentProvider,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to initiate ticket checkout" }, { status: 500 });
  }
}
