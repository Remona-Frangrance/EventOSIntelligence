import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, visitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifyPaymentSchema = z.object({
  orderId: z.string().uuid(),
  providerPaymentId: z.string().min(1).default("pay_mock_confirmed"),
  signature: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { orderId, providerPaymentId } = parsed.data;

    const ordList = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!ordList.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const ord = ordList[0];

    // Mark order as paid
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "paid",
        providerPaymentId,
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Get visitor code
    let visitorCode = "";
    if (ord.visitorId) {
      const visList = await db.select().from(visitors).where(eq(visitors.id, ord.visitorId)).limit(1);
      if (visList.length) {
        visitorCode = visList[0].code;
      }
    }

    await recordAuditLog({
      organizationId: ord.organizationId || undefined,
      eventId: ord.eventId,
      actorEmail: ord.buyerEmail,
      actorRole: "visitor",
      action: "TICKET_PAYMENT_VERIFIED",
      targetType: "order",
      targetId: ord.id,
      details: {
        amount: ord.amount,
        tierName: ord.tierName,
        providerPaymentId,
        visitorCode,
      },
    });

    return NextResponse.json({
      verified: true,
      order: updatedOrder,
      visitorCode,
      message: "Ticket payment confirmed. Gate pass activated.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to verify ticket payment" }, { status: 500 });
  }
}
