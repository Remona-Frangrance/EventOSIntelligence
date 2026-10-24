import { NextResponse } from "next/server";
import { db } from "@/db";
import { judges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

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
      if (!isProduction) {
        const memJudge = memoryStore.getJudgeByCode(code);
        if (memJudge) return NextResponse.json(memJudge);
      }
      return NextResponse.json({ error: "Invalid judge code" }, { status: 404 });
    }
    if (eventId) {
      const rows = await db.select().from(judges).where(eq(judges.eventId, eventId));
      return NextResponse.json(rows);
    }
    const rows = await db.select().from(judges);
    return NextResponse.json(rows);
  } catch {
    if (code) {
      if (!isProduction) {
        const memJudge = memoryStore.getJudgeByCode(code);
        if (memJudge) return NextResponse.json(memJudge);
      }
      return NextResponse.json({ error: "Invalid judge code" }, { status: 404 });
    }
    if (isProduction) return NextResponse.json([]);
    return NextResponse.json(eventId ? memoryStore.getJudges(eventId) : memoryStore.getJudges());
  }
}

export async function POST(req: Request) {
  // Enforce admin-only access for creating judges
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "Judge name is required" }, { status: 400 });
  }

  const judgeData = {
    eventId: body.eventId || "9e33a337-5ba7-4c39-9265-426931e481af",
    name: body.name.trim(),
    email: body.email ? body.email.trim().toLowerCase() : "",
    organization: body.organization || "",
    expertise: body.expertise || [],
    assignedCategories: body.assignedCategories || [],
    code: makeCode("JUDGE", 4),
    avatarColor: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  };

  try {
    const [row] = await db.insert(judges).values(judgeData).returning();

    await logAudit({
      organizationId: auth.user.organizationId,
      eventId: judgeData.eventId,
      userId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "JUDGE_ASSIGN",
      targetType: "judge",
      targetId: row.id,
      details: { name: row.name, code: row.code, email: row.email },
      ipAddress: clientIp,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to persist judge in database" }, { status: 500 });
    }
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
  // Enforce admin-only access for updating judge assignments
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const body = await req.json();
  const { id, ...rest } = body;
  try {
    const [row] = await db.update(judges).set(rest).where(eq(judges.id, id)).returning();
    return NextResponse.json(row);
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to update judge in database" }, { status: 500 });
    }
    return NextResponse.json({ id, ...rest });
  }
}
