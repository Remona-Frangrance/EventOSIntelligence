import { NextResponse } from "next/server";
import { db } from "@/db";
import { judges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";

const AVATARS = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-rose-500 to-red-600",
  "from-lime-400 to-emerald-600",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  try {
    if (code) {
      const rows = await db.select().from(judges).where(eq(judges.code, code.toUpperCase()));
      if (rows[0]) return NextResponse.json(rows[0]);
      const memJudge = memoryStore.getJudgeByCode(code);
      if (memJudge) return NextResponse.json(memJudge);
      return NextResponse.json({ error: "Invalid judge code" }, { status: 404 });
    }
    if (eventId) {
      const rows = await db.select().from(judges).where(eq(judges.eventId, eventId));
      if (rows && rows.length > 0) return NextResponse.json(rows);
      return NextResponse.json(memoryStore.getJudges(eventId));
    }
    const rows = await db.select().from(judges);
    if (rows && rows.length > 0) return NextResponse.json(rows);
    return NextResponse.json(memoryStore.getJudges());
  } catch {
    if (code) {
      const memJudge = memoryStore.getJudgeByCode(code);
      if (memJudge) return NextResponse.json(memJudge);
      return NextResponse.json({ error: "Invalid judge code" }, { status: 404 });
    }
    return NextResponse.json(eventId ? memoryStore.getJudges(eventId) : memoryStore.getJudges());
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const judgeData = {
    eventId: body.eventId || "ev-nexathon-26",
    name: body.name,
    email: body.email || "",
    organization: body.organization || "",
    expertise: body.expertise || [],
    assignedCategories: body.assignedCategories || [],
    code: makeCode("JUDGE", 4),
    avatarColor: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  };

  try {
    const [row] = await db.insert(judges).values(judgeData).returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    const memRow = {
      id: "jd-" + Math.random().toString(36).substring(2, 8),
      ...judgeData,
      createdAt: new Date().toISOString(),
    };
    memoryStore.addJudge(memRow);
    return NextResponse.json(memRow, { status: 201 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...rest } = body;
  try {
    const [row] = await db.update(judges).set(rest).where(eq(judges.id, id)).returning();
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ id, ...rest });
  }
}
