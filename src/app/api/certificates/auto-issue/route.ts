import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { makeCode } from "@/lib/utils";
import { generateCertificateHMAC } from "@/lib/crypto";

export async function POST(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    // 1. Mark event as officially ended
    await db.update(events).set({ status: "ended" }).where(eq(events.id, eventId));

    // 2. Query all projects in this event
    const prjList = await db.select().from(projects).where(eq(projects.eventId, eventId));
    let issuedCount = 0;

    // Check existing certificates for this event to prevent duplicates
    const existingCerts = await db.select().from(certificates).where(eq(certificates.eventId, eventId));
    const existingProjectIds = new Set(existingCerts.map((c) => c.projectId).filter(Boolean));

    for (const p of prjList) {
      if (existingProjectIds.has(p.id)) continue;

      const certCode = makeCode("CERT", 6).toUpperCase();
      const recipientName = `${p.teamName} (${p.leaderName})`;
      const role = "participant";
      const verificationHash = generateCertificateHMAC(certCode, recipientName, eventId, role);

      await db.insert(certificates).values({
        eventId,
        projectId: p.id,
        recipientName,
        recipientEmail: p.leaderEmail || "",
        role,
        title: "Certificate of Active Participation & Engineering Innovation",
        code: certCode,
        verificationHash,
      });

      issuedCount++;
    }

    return NextResponse.json({
      success: true,
      eventStatus: "ended",
      issuedCount,
      totalProjects: prjList.length,
      message: `Event officially ended. ${issuedCount} participant certificates generated and unlocked!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to conclude event and issue certificates" }, { status: 500 });
  }
}
