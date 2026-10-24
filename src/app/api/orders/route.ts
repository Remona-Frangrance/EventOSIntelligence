import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  try {
    let orderQuery = db.select().from(orders);
    if (eventId) {
      orderQuery = orderQuery.where(eq(orders.eventId, eventId)) as any;
    }
    const orderList = await orderQuery.orderBy(desc(orders.createdAt));

    // Calculate revenue metrics
    const totalOrders = orderList.length;
    const paidOrders = orderList.filter((o) => o.status === "paid");
    const grossRevenue = paidOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

    const tierBreakdown: Record<string, { count: number; revenue: number }> = {};
    paidOrders.forEach((o) => {
      const tier = o.tierName || "General";
      if (!tierBreakdown[tier]) {
        tierBreakdown[tier] = { count: 0, revenue: 0 };
      }
      tierBreakdown[tier].count++;
      tierBreakdown[tier].revenue += o.amount || 0;
    });

    return NextResponse.json({
      orders: orderList,
      summary: {
        totalOrders,
        paidCount: paidOrders.length,
        grossRevenue,
        currency: "INR",
        tierBreakdown,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load orders" }, { status: 500 });
  }
}
