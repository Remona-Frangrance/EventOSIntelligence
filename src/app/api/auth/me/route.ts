import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
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
            organization: u.organization,
            phone: u.phone,
          },
        });
      }
    }
  } catch {}

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

  return NextResponse.json({ authenticated: false });
}
