import { NextResponse } from "next/server";
import { db } from "@/db";
import { judges, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkJudgeSchema = z.object({
  eventId: z.string().uuid(),
  judges: z.array(
    z.object({
      name: z.string().min(2),
      email: z.string().optional().default(""),
      organization: z.string().optional().default(""),
      expertise: z.array(z.string()).optional().default([]),
    })
  ).min(1, "Must provide at least 1 judge"),
});

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = bulkJudgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { eventId, judges: importList } = parsed.data;

    const evList = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!evList.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const avatarGradients = [
      "from-violet-500 to-fuchsia-500",
      "from-blue-500 to-indigo-500",
      "from-emerald-500 to-teal-500",
      "from-amber-500 to-orange-500",
      "from-rose-500 to-pink-500",
    ];

    const insertedJudges = [];
    for (let i = 0; i < importList.length; i++) {
      const j = importList[i];
      const code = `JD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const avatarColor = avatarGradients[i % avatarGradients.length];

      const [newJ] = await db
        .insert(judges)
        .values({
          eventId,
          name: j.name,
          email: j.email || "",
          organization: j.organization || "Jury Panel",
          expertise: j.expertise || [],
          code,
          avatarColor,
        })
        .returning();

      insertedJudges.push(newJ);
    }

    await recordAuditLog({
      eventId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "JUDGES_BULK_IMPORTED",
      targetType: "judge",
      targetId: `${insertedJudges.length}_records`,
      details: { count: insertedJudges.length },
    });

    return NextResponse.json({
      success: true,
      importedCount: insertedJudges.length,
      judges: insertedJudges,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to bulk import judges" }, { status: 500 });
  }
}
