import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { generateCertificateHMAC, verifyCertificateHMAC } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");
  const projectId = searchParams.get("projectId");

  // 1. Public credential verification by code
  if (code) {
    const cleanCode = code.trim().toUpperCase();
    try {
      const rows = await db.select().from(certificates).where(eq(certificates.code, cleanCode));
      if (rows[0]) {
        const cert = rows[0];
        const isValidSignature = cert.verificationHash
          ? verifyCertificateHMAC(cert.code, cert.recipientName, cert.eventId, cert.role, cert.verificationHash)
          : true;

        let isLocked = false;
        let eventName = "Event";
        let eventStatus = "ended";
        try {
          const evRows = await db.select().from(events).where(eq(events.id, cert.eventId));
          if (evRows[0]) {
            eventStatus = evRows[0].status;
            eventName = evRows[0].name;
            isLocked = evRows[0].status !== "ended" && evRows[0].status !== "completed";
          }
        } catch {}

        return NextResponse.json({
          ...cert,
          isTamperProof: Boolean(cert.verificationHash),
          isValidSignature,
          isLocked,
          eventStatus,
          eventName,
        });
      }
    } catch {}

    if (!isProduction) {
      const memCert = memoryStore.getCertificates(undefined, cleanCode);
      if (memCert) {
        return NextResponse.json({
          ...memCert,
          isTamperProof: true,
          isValidSignature: true,
          isLocked: false,
          eventStatus: "ended",
        });
      }
    }

    return NextResponse.json({ error: "Certificate credential not found in registry" }, { status: 404 });
  }

  // 2. Query certificate for a specific project
  if (projectId) {
    try {
      const rows = await db.select().from(certificates).where(eq(certificates.projectId, projectId));
      if (rows[0]) {
        const cert = rows[0];
        let isLocked = false;
        let eventStatus = "ended";
        let eventName = "Event";
        try {
          const evRows = await db.select().from(events).where(eq(events.id, cert.eventId));
          if (evRows[0]) {
            eventStatus = evRows[0].status;
            eventName = evRows[0].name;
            isLocked = evRows[0].status !== "ended" && evRows[0].status !== "completed";
          }
        } catch {}
        return NextResponse.json({
          ...cert,
          isLocked,
          eventStatus,
          eventName,
        });
      }
    } catch {}
    return NextResponse.json({ certificate: null, isLocked: true });
  }

  // 3. Listing certificates in Studio or Dashboard
  const auth = await requireAuth(req, ["admin", "participant", "visitor"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const rows = eventId
      ? await db.select().from(certificates).where(eq(certificates.eventId, eventId)).orderBy(desc(certificates.issuedAt))
      : await db.select().from(certificates).orderBy(desc(certificates.issuedAt));
    return NextResponse.json(rows);
  } catch (err) {
    if (isProduction) {
      return NextResponse.json({ error: "Failed to load certificates from database" }, { status: 500 });
    }
    const memRows = memoryStore.getCertificates(eventId || undefined);
    return NextResponse.json(memRows);
  }
}

export async function POST(req: Request) {
  // Enforce admin-only access for issuing certificates
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const clientIp = getClientIp(req);
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];
  const created = [];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let fallbackEventId = "9e33a337-5ba7-4c39-9265-426931e481af";
  try {
    const evRows = await db.select({ id: events.id }).from(events).limit(1);
    if (evRows.length > 0 && evRows[0].id) {
      fallbackEventId = evRows[0].id;
    }
  } catch {}

  for (const c of items) {
    const certCode = (c.code || makeCode("CERT", 6)).toUpperCase();
    const eventId = c.eventId && uuidRegex.test(c.eventId) ? c.eventId : fallbackEventId;
    const recipientName = c.recipientName || "Participant";
    const role = c.role || "participant";

    // Compute tamper-proof HMAC verification hash
    const verificationHash = generateCertificateHMAC(certCode, recipientName, eventId, role);

    const certPayload = {
      eventId,
      projectId: c.projectId && uuidRegex.test(c.projectId) ? c.projectId : null,
      recipientName,
      recipientEmail: c.recipientEmail || "",
      role,
      title: c.title || "Certificate of Excellence",
      code: certCode,
      verificationHash,
      signatory1: c.signatory1 || "Dr. Elena Vance (Head Jury)",
      signatory2: c.signatory2 || "Vikram Malhotra (Director)",
      theme: c.theme || "gold",
    };

    try {
      const [row] = await db
        .insert(certificates)
        .values({
          eventId: certPayload.eventId,
          projectId: certPayload.projectId,
          recipientName: certPayload.recipientName,
          recipientEmail: certPayload.recipientEmail,
          role: certPayload.role,
          title: certPayload.title,
          code: certPayload.code,
          verificationHash: certPayload.verificationHash,
        })
        .returning();

      await logAudit({
        organizationId: auth.user.organizationId,
        eventId,
        userId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "CERTIFICATE_ISSUE",
        targetType: "certificate",
        targetId: row.id,
        details: { code: certCode, recipientName, role },
        ipAddress: clientIp,
      });

      created.push({
        ...row,
        signatory1: certPayload.signatory1,
        signatory2: certPayload.signatory2,
        theme: certPayload.theme,
        isTamperProof: true,
        isValidSignature: true,
      });
    } catch (err) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to persist certificate to database" }, { status: 500 });
      }

      const mockRow = {
        id: "cert-" + Math.random().toString(36).substring(2, 9),
        ...certPayload,
        issuedAt: new Date().toISOString(),
        isTamperProof: true,
        isValidSignature: true,
      };
      memoryStore.addCertificate(mockRow);
      created.push(mockRow);
    }
  }

  return NextResponse.json(Array.isArray(body) ? created : created[0], { status: 201 });
}
