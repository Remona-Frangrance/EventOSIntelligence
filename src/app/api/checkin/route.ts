import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitors } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { code } = await req.json();
  const clean = String(code || "").trim().toUpperCase();
  const rows = await db.select().from(visitors).where(eq(visitors.code, clean));
  if (!rows[0]) return NextResponse.json({ error: "Pass not found. Check the code and retry." }, { status: 404 });
  const v = rows[0];
  if (v.checkedIn) {
    return NextResponse.json({ ...v, alreadyIn: true, message: `${v.name} is already checked in.` });
  }
  const [updated] = await db
    .update(visitors)
    .set({ checkedIn: true, checkinAt: new Date() })
    .where(eq(visitors.id, v.id))
    .returning();
  return NextResponse.json({ ...updated, message: `Welcome in, ${v.name.split(" ")[0]}!` });
}
