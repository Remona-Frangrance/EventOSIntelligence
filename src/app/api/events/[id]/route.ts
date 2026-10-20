import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await db.select().from(events).where(eq(events.id, id));
    if (!rows[0]) {
      const mem = memoryStore.getEvents().find((e) => e.id === id);
      if (mem) return NextResponse.json(mem);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    const mem = memoryStore.getEvents().find((e) => e.id === id);
    if (mem) return NextResponse.json(mem);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const [row] = await db.update(events).set(body).where(eq(events.id, id)).returning();
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ id, ...body });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.delete(events).where(eq(events.id, id));
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}
