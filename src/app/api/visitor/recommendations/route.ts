import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawInterests = searchParams.get("interests");
  const interests: string[] = rawInterests
    ? rawInterests.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : ["ai/ml", "healthtech"];

  let allProjects: any[] = [];
  try {
    const rows = await db.select().from(projects);
    if (rows && rows.length > 0) {
      allProjects = rows;
    } else {
      allProjects = memoryStore.getProjects();
    }
  } catch {
    allProjects = memoryStore.getProjects();
  }

  const scored = allProjects.map((p) => {
    let score = 20; // base score
    const matchedTags: string[] = [];
    const catLower = (p.category || "").toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    const techStack: string[] = Array.isArray(p.techStack) ? p.techStack : [];

    for (const interest of interests) {
      if (catLower.includes(interest) || interest.includes(catLower)) {
        score += 45;
        matchedTags.push(`Category match: ${p.category}`);
      }
      if (descLower.includes(interest)) {
        score += 20;
        matchedTags.push(`Topic mentioned: ${interest}`);
      }
      for (const t of techStack) {
        if (t.toLowerCase().includes(interest) || interest.includes(t.toLowerCase())) {
          score += 15;
          matchedTags.push(`Tech match: ${t}`);
        }
      }
    }

    // Popularity factor
    const popularityBonus = Math.min(10, Math.floor((p.votes || 0) / 10));
    score += popularityBonus;

    const matchPercent = Math.min(99, Math.max(35, score));

    return {
      ...p,
      matchPercent,
      matchedTags: Array.from(new Set(matchedTags)),
    };
  });

  scored.sort((a, b) => b.matchPercent - a.matchPercent);

  return NextResponse.json({
    interests,
    total: scored.length,
    recommendations: scored,
  });
}
