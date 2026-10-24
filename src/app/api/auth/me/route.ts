import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, projects } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";
import { getAuthUser } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 1. Try server session from httpOnly cookie first (Highest Priority)
  const sessionUser = await getAuthUser(req);
  if (sessionUser) {
    try {
      const dbUsers = await db.select().from(users).where(eq(users.id, sessionUser.id));
      if (dbUsers[0]) {
        const u = dbUsers[0];
        // Fetch project ID if participant
        let projectId = sessionUser.projectId;
        if (!projectId && u.role === "participant") {
          const prj = await db
            .select({ id: projects.id })
            .from(projects)
            .where(or(eq(projects.userId, u.id), eq(projects.leaderEmail, u.email)));
          if (prj[0]) projectId = prj[0].id;
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            interests: u.interests,
            organizationId: u.organizationId,
            organization: u.organization,
            phone: u.phone,
            judgeCode: sessionUser.judgeCode,
            projectId,
          },
        });
      }
    } catch {}

    // If DB check failed or in-memory judge
    return NextResponse.json({
      authenticated: true,
      user: sessionUser,
    });
  }

  // 2. Fallback check by query parameters (for legacy client transitions or testing)
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const id = searchParams.get("id");

  if (!email && !id) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    if (email) {
      const dbUsers = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (dbUsers[0]) {
        const u = dbUsers[0];
        return NextResponse.json({
          authenticated: true,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            interests: u.interests,
            organizationId: u.organizationId,
            organization: u.organization,
            phone: u.phone,
          },
        });
      }
    }
  } catch {}

  if (process.env.NODE_ENV !== "production") {
    const memUser = email ? memoryStore.getUserByEmail(email) : id ? memoryStore.getUserById(id) : null;
    if (memUser) {
      return NextResponse.json({
        authenticated: true,
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
  }

  return NextResponse.json({ authenticated: false });
}
