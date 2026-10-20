import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, visitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const userId = searchParams.get("userId");

  if (!email && !userId) {
    return NextResponse.json({ interests: ["AI/ML", "HealthTech", "Robotics"] });
  }

  const user = email ? memoryStore.getUserByEmail(email) : userId ? memoryStore.getUserById(userId) : null;
  return NextResponse.json({ interests: user?.interests || ["AI/ML", "HealthTech", "Robotics"] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, userId, interests } = body;

    const list = Array.isArray(interests) ? interests : [];

    // Try DB
    try {
      if (email) {
        await db.update(users).set({ interests: list }).where(eq(users.email, email.toLowerCase()));
      } else if (userId) {
        await db.update(users).set({ interests: list }).where(eq(users.id, userId));
      }
    } catch {}

    // Update memoryStore
    if (email) {
      const u = memoryStore.getUserByEmail(email);
      if (u) u.interests = list;
    } else if (userId) {
      const u = memoryStore.getUserById(userId);
      if (u) u.interests = list;
    }

    return NextResponse.json({ success: true, interests: list });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update interests" }, { status: 500 });
  }
}
