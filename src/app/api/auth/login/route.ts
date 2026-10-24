import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, judges, projects } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";
import { sendLoginSuccessEmail } from "@/lib/email";
import { createSessionToken, getSessionCookieOptions, SessionUser } from "@/lib/session";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { loginSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  const clientIp = getClientIp(req);

  // 1. Rate limiting: 10 attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetInSec, "Too many login attempts. Please try again later.");
  }

  try {
    const rawBody = await req.json();

    // 2. Validate input with Zod
    const validation = validateBody(loginSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const { email, password, judgeCode } = validation.data;

    // 3. Handle Judge Code Login
    if (judgeCode) {
      const codeUpper = judgeCode.trim().toUpperCase();
      let judgeUser: SessionUser | null = null;
      let judgeEmail: string = "";

      try {
        const dbJudge = await db.select().from(judges).where(eq(judges.code, codeUpper));
        if (dbJudge[0]) {
          const j = dbJudge[0];
          judgeEmail = j.email || "";
          judgeUser = {
            id: j.id,
            name: j.name,
            email: j.email || `${j.code.toLowerCase()}@judge.eventos.local`,
            role: "judge",
            judgeCode: j.code,
            organization: j.organization,
          };
        }
      } catch (dbErr) {
        if (isProduction) {
          return NextResponse.json({ error: "Database error during authentication" }, { status: 500 });
        }
      }

      // Memory fallback only in development / test
      if (!judgeUser && !isProduction) {
        const memJudge = memoryStore.getJudgeByCode(codeUpper);
        if (memJudge) {
          judgeEmail = memJudge.email || "";
          judgeUser = {
            id: memJudge.id,
            name: memJudge.name,
            email: memJudge.email || `${memJudge.code.toLowerCase()}@judge.eventos.local`,
            role: "judge",
            judgeCode: memJudge.code,
            organization: memJudge.organization,
          };
        }
      }

      if (!judgeUser) {
        return NextResponse.json({ error: "Invalid judge code. Please check and retry." }, { status: 401 });
      }

      if (judgeEmail) {
        sendLoginSuccessEmail({
          to: judgeEmail,
          name: judgeUser.name,
          role: "judge",
        }).catch(() => {});
      }

      // Generate secure session token and set httpOnly cookie
      const sessionToken = await createSessionToken(judgeUser);
      const cookieOptions = getSessionCookieOptions();

      await logAudit({
        userId: judgeUser.id,
        actorEmail: judgeUser.email,
        actorRole: "judge",
        action: "USER_LOGIN",
        targetType: "session",
        targetId: judgeUser.id,
        details: { method: "judge_code", judgeCode: codeUpper },
        ipAddress: clientIp,
      });

      const response = NextResponse.json({
        success: true,
        user: judgeUser,
        emailNotification: { sent: Boolean(judgeEmail), to: judgeEmail },
      });

      response.cookies.set({
        ...cookieOptions,
        value: sessionToken,
      });

      return response;
    }

    // 4. Handle Email & Password Login
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let authenticatedUser: SessionUser | null = null;
    let userProjectId: string | undefined = undefined;

    // Try DB first
    try {
      const rows = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (rows[0] && rows[0].password === password) {
        const u = rows[0];

        // If participant, look up associated project
        try {
          const prjRows = await db
            .select()
            .from(projects)
            .where(or(eq(projects.userId, u.id), eq(projects.leaderEmail, cleanEmail)));
          if (prjRows[0]) {
            userProjectId = prjRows[0].id;
          }
        } catch {}

        authenticatedUser = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as SessionUser["role"],
          avatar: u.avatar,
          organizationId: u.organizationId,
          organization: u.organization,
          projectId: userProjectId,
        };
      }
    } catch (dbErr) {
      if (isProduction) {
        return NextResponse.json({ error: "Database error during authentication" }, { status: 500 });
      }
    }

    // Demo store fallback ONLY in non-production
    if (!authenticatedUser && !isProduction) {
      const memUser = memoryStore.getUserByEmail(cleanEmail);
      if (memUser && memUser.password === password) {
        authenticatedUser = {
          id: memUser.id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role as SessionUser["role"],
          avatar: memUser.avatar,
          organization: memUser.organization,
          judgeCode: memUser.judgeCode,
          projectId: memUser.projectId,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Send login alert email
    const emailRes = await sendLoginSuccessEmail({
      to: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
    }).catch(() => ({ success: false }));

    // Create session token and set httpOnly cookie
    const sessionToken = await createSessionToken(authenticatedUser);
    const cookieOptions = getSessionCookieOptions();

    await logAudit({
      userId: authenticatedUser.id,
      actorEmail: authenticatedUser.email,
      actorRole: authenticatedUser.role,
      action: "USER_LOGIN",
      targetType: "session",
      targetId: authenticatedUser.id,
      details: { email: cleanEmail },
      ipAddress: clientIp,
    });

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      emailNotification: { sent: emailRes.success, to: authenticatedUser.email },
    });

    response.cookies.set({
      ...cookieOptions,
      value: sessionToken,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Login failed due to unexpected error" }, { status: 500 });
  }
}
