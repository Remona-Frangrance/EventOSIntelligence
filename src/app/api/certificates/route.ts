import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { makeCode } from "@/lib/utils";
import { memoryStore } from "@/lib/demoData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  try {
    if (code) {
      const rows = await db.select().from(certificates).where(eq(certificates.code, code.toUpperCase()));
      if (!rows[0]) {
        const memCert = memoryStore.getCertificates(undefined, code);
        if (memCert) return NextResponse.json(memCert);
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }
    const rows = eventId
      ? await db.select().from(certificates).where(eq(certificates.eventId, eventId)).orderBy(desc(certificates.issuedAt))
      : await db.select().from(certificates).orderBy(desc(certificates.issuedAt));
    return NextResponse.json(rows);
  } catch {
    // Database connection offline or initializing — serve memory store
    if (code) {
      const row = memoryStore.getCertificates(undefined, code);
      if (!row) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
      return NextResponse.json(row);
    }
    const memRows = memoryStore.getCertificates(eventId || undefined);
    return NextResponse.json(memRows);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];
  const created = [];

  for (const c of items) {
    const certCode = makeCode("CERT", 6);
    const certPayload = {
      eventId: c.eventId || "ev-nexathon-26",
      projectId: c.projectId || null,
      recipientName: c.recipientName || "Participant",
      recipientEmail: c.recipientEmail || "",
      role: c.role || "participant",
      title: c.title || "Certificate of Excellence",
      code: certCode,
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
        })
        .returning();
      created.push(row);
    } catch {
      const mockRow = {
        id: "cert-" + Math.random().toString(36).substring(2, 9),
        ...certPayload,
        issuedAt: new Date().toISOString(),
      };
      memoryStore.addCertificate(mockRow);
      created.push(mockRow);
    }
  }

  return NextResponse.json(Array.isArray(body) ? created : created[0], { status: 201 });
}
