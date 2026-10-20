import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, judges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, judgeCode } = body;

    // 1. If judge logs in via judge code
    if (judgeCode) {
      const codeUpper = judgeCode.trim().toUpperCase();
      try {
        const dbJudge = await db.select().from(judges).where(eq(judges.code, codeUpper));
        if (dbJudge[0]) {
          return NextResponse.json({
            success: true,
            user: {
              id: dbJudge[0].id,
              name: dbJudge[0].name,
              email: dbJudge[0].email,
              role: "judge",
              judgeCode: dbJudge[0].code,
              organization: dbJudge[0].organization,
            },
          });
        }
      } catch {}

      const memJudge = memoryStore.getJudgeByCode(codeUpper);
      if (memJudge) {
        return NextResponse.json({
          success: true,
          user: {
            id: memJudge.id,
            name: memJudge.name,
            email: memJudge.email,
            role: "judge",
            judgeCode: memJudge.code,
            organization: memJudge.organization,
          },
        });
      }
      return NextResponse.json({ error: "Invalid judge code" }, { status: 401 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Try DB
    try {
      const rows = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (rows[0] && rows[0].password === password) {
        const u = rows[0];
        return NextResponse.json({
          success: true,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            interests: u.interests,
            organization: u.organization,
            phone: u.phone,
          },
        });
      }
    } catch {}

    // 3. Fallback to memoryStore
    const memUser = memoryStore.getUserByEmail(cleanEmail);
    if (memUser && memUser.password === password) {
      return NextResponse.json({
        success: true,
        user: {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          avatar: memUser.avatar,
          interests: memUser.interests,
          organization: memUser.organization,
          phone: memUser.phone,
          judgeCode: memUser.judgeCode,
          projectId: memUser.projectId,
        },
      });
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
