import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "../../src/lib/demoData.ts";
import { generateVerificationHash, verifyCredentialHash } from "../../src/lib/crypto.ts";

describe("End-to-End Event Lifecycle Flow Test", () => {
  it("should successfully execute full lifecycle: Register -> Check-in -> Score -> Issue Certificate -> Verify HMAC", async () => {
    const eventId = "ev-nexathon-26";

    // 1. Register a new Project & Team
    const newProject = memoryStore.addProject({
      id: "p-e2e-demo",
      eventId,
      title: "PulseGuard — Distributed Smart Grid Monitor",
      category: "IoT",
      teamName: "GridWorks",
      leaderName: "Rohan Desai",
      leaderEmail: "rohan@gridworks.tech",
      leaderPhone: "+91 98765 43210",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      demoUrl: "https://gridworks.tech",
      repoUrl: "https://github.com/gridworks/pulseguard",
      members: [{ name: "Rohan Desai", role: "Hardware Lead" }],
      description: "Low-latency microgrid telemetry using edge embedded sensors.",
      techStack: ["C++", "MQTT", "Next.js"],
      code: "PRJ-E2E-GRID",
      status: "approved",
      boothNo: "C-09",
      views: 0,
      checkins: 0,
      votes: 0,
      createdAt: new Date().toISOString(),
    });

    assert.ok(newProject.id === "p-e2e-demo");
    assert.equal(newProject.boothNo, "C-09");

    // 2. Register Attendee & Check-in at Gate
    const visitorCode = "VIS-E2E-999";
    const newVisitor = memoryStore.addVisitor({
      id: "v-e2e-attendee",
      eventId,
      name: "Rohan Desai",
      email: "rohan@gridworks.tech",
      phone: "+91 98765 43210",
      type: "participant",
      interests: ["IoT", "GreenTech"],
      code: visitorCode,
      checkedIn: false,
      createdAt: new Date().toISOString(),
    });

    // Check-in scan at venue
    const scannedVisitor = memoryStore.checkInVisitor(newVisitor.id);
    assert.equal(scannedVisitor?.checkedIn, true);
    assert.ok(scannedVisitor?.checkinAt);

    // 3. Jury Evaluation & Scoring
    const evalScore = memoryStore.addScore({
      id: "s-e2e-1",
      eventId,
      projectId: newProject.id,
      judgeId: "j-ananya",
      criteriaScores: {
        innovation: 10,
        technical: 9,
        impact: 9,
        presentation: 9,
      },
      total: 9.25,
      weightedTotal: 92.5,
      comment: "Superb hardware prototype with clean edge communications.",
      flagged: false,
      flagReason: "",
      createdAt: new Date().toISOString(),
    });

    assert.equal(evalScore.projectId, newProject.id);
    assert.equal(evalScore.total, 9.25);

    // 4. Issue Official Certificate with Cryptographic HMAC-SHA256
    const certCode = "CERT-E2E-8888";
    const certPayload = {
      code: certCode,
      recipientName: "Rohan Desai",
      role: "Hardware Lead / 1st Place IoT",
      title: "PulseGuard — Distributed Smart Grid Monitor",
      eventId,
    };

    const verificationHash = await generateVerificationHash(certPayload);
    assert.ok(typeof verificationHash === "string" && verificationHash.length === 64);

    const issuedCert = memoryStore.addCertificate({
      id: "cert-e2e-1",
      eventId,
      projectId: newProject.id,
      recipientName: certPayload.recipientName,
      recipientEmail: "rohan@gridworks.tech",
      role: certPayload.role,
      title: certPayload.title,
      code: certCode,
      verificationHash,
      issuedAt: new Date().toISOString(),
    });

    assert.equal(issuedCert.code, certCode);

    // 5. Cryptographic Public Verification on /verify/[code]
    const isValid = await verifyCredentialHash(certPayload, issuedCert.verificationHash);
    assert.equal(isValid, true, "Certificate HMAC verification must pass for authentic credentials");

    // 6. Anti-Tamper Verification: Altering recipient name must fail
    const tamperedPayload = {
      ...certPayload,
      recipientName: "Hacker Impersonator",
    };
    const isTamperedValid = await verifyCredentialHash(tamperedPayload, issuedCert.verificationHash);
    assert.equal(isTamperedValid, false, "Tampered recipient name must be caught and rejected");
  });
});
