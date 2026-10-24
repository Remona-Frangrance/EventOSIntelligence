import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, users, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  plan: z.enum(["free", "event_pack", "pro"]).default("free"),
  logoUrl: z.string().optional().default(""),
  primaryColor: z.string().optional().default("#4f46e5"),
});

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
    return NextResponse.json(orgs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load organizations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = createOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const { name, slug, plan, logoUrl, primaryColor } = parsed.data;

    // Check slug uniqueness
    const existing = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: `Organization slug "${slug}" is already taken` }, { status: 409 });
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name,
        slug,
        plan,
        logoUrl,
        primaryColor,
        ownerId: auth.user.id,
      })
      .returning();

    await recordAuditLog({
      organizationId: newOrg.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "ORGANIZATION_CREATED",
      targetType: "organization",
      targetId: newOrg.id,
      details: { name: newOrg.name, slug: newOrg.slug, plan: newOrg.plan },
    });

    return NextResponse.json(newOrg, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create organization" }, { status: 500 });
  }
}
