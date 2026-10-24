import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, visitors, scores, scans, organizations } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { eventCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");

  try {
    let all = await db.select().from(events).orderBy(desc(events.createdAt));

    // Multi-tenant scope if organizationId is specified
    if (organizationId) {
      all = all.filter((e) => e.organizationId === organizationId);
    }

    if (all.length === 0) {
      return NextResponse.json([]);
    }

    const withStats = await Promise.all(
      all.map(async (e) => {
        const [p] = await db.select({ c: count() }).from(projects).where(eq(projects.eventId, e.id));
        const [v] = await db.select({ c: count() }).from(visitors).where(eq(visitors.eventId, e.id));
        const [s] = await db.select({ c: count() }).from(scores).where(eq(scores.eventId, e.id));
        const [sc] = await db.select({ c: count() }).from(scans).where(eq(scans.eventId, e.id));
        return { ...e, stats: { projects: p?.c ?? 0, visitors: v?.c ?? 0, scores: s?.c ?? 0, scans: sc?.c ?? 0 } };
      })
    );

    // Deduplicate events by trimmed, lowercase name to prevent duplicates in dropdowns
    const seenNames = new Set<string>();
    const deduplicated: typeof withStats = [];

    for (const ev of withStats) {
      const normalized = (ev.name || "").trim().toLowerCase();
      if (!normalized) continue;
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        deduplicated.push(ev);
      }
    }

    // Sort: live events first, then newest creation date
    deduplicated.sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(deduplicated);
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to retrieve events from database" }, { status: 500 });
    }
    return NextResponse.json(memoryStore.getEvents());
  }
}

export async function POST(req: Request) {
  // 1. Enforce admin-only access
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);

  try {
    const rawBody = await req.json();

    // 2. Validate input with Zod
    const validation = validateBody(eventCreateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const body = validation.data;
    const name = body.name.trim();

    // 3. Resolve Organization for Multi-Tenancy
    let targetOrgId = auth.user.organizationId || body.organizationId;
    if (!targetOrgId) {
      try {
        const orgRows = await db.select({ id: organizations.id }).from(organizations).limit(1);
        if (orgRows[0]?.id) targetOrgId = orgRows[0].id;
      } catch {}
    }

    // Check if an event with this exact name already exists
    try {
      const existing = await db.select().from(events);
      const matched = existing.find(
        (e) => (e.name || "").trim().toLowerCase() === name.toLowerCase()
      );
      if (matched) {
        return NextResponse.json(matched, { status: 200 });
      }
    } catch {}

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60) +
      "-" +
      Math.floor(Math.random() * 9000 + 1000);

    const eventData = {
      name,
      slug,
      type: body.type,
      tagline: body.tagline,
      description: body.description,
      venue: body.venue,
      city: body.city,
      organizationId: targetOrgId || null,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : new Date(Date.now() + 86400000),
      status: body.status || "live",
      bannerGradient: body.bannerGradient || "from-violet-600 via-fuchsia-500 to-amber-400",
      scoringCriteria: body.scoringCriteria || [
        { key: "innovation", label: "Innovation", max: 10, weight: 1.2 },
        { key: "execution", label: "Execution", max: 10, weight: 1.0 },
        { key: "impact", label: "Impact", max: 10, weight: 1.0 },
        { key: "pitch", label: "Pitch", max: 10, weight: 0.8 },
      ],
      categories: body.categories || ["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech"],
      registrationOpen: body.registrationOpen ?? true,
    };

    try {
      const [row] = await db.insert(events).values(eventData).returning();

      await logAudit({
        organizationId: targetOrgId,
        eventId: row.id,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "EVENT_CREATE",
        targetType: "event",
        targetId: row.id,
        details: { name: row.name, slug: row.slug },
        ipAddress: clientIp,
      });

      return NextResponse.json(row, { status: 201 });
    } catch (dbErr) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to persist event to database" }, { status: 500 });
      }

      const mockRow = {
        id: "ev-" + Math.random().toString(36).substring(2, 9),
        ...eventData,
        startsAt: eventData.startsAt.toISOString(),
        endsAt: eventData.endsAt.toISOString(),
        createdAt: new Date().toISOString(),
        stats: { projects: 0, visitors: 0, scores: 0, scans: 0 },
      };
      memoryStore.addEvent(mockRow);
      return NextResponse.json(mockRow, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse request" }, { status: 400 });
  }
}
