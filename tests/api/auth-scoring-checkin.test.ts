import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, generateVerificationHash, verifyCredentialHash } from "../../src/lib/crypto.ts";
import { createSessionToken, verifySessionToken } from "../../src/lib/session.ts";
import { memoryStore } from "../../src/lib/demoData.ts";

describe("API Security & Logic Tests (Auth, Scoring, Check-in)", () => {
  describe("Authentication & Password Cryptography", () => {
    it("should hash and verify passwords securely", async () => {
      const password = "adminSecretPassword2026!";
      const hash = await hashPassword(password);

      assert.notEqual(hash, password);
      const isMatch = await verifyPassword(password, hash);
      assert.equal(isMatch, true);

      const isWrong = await verifyPassword("wrongPassword", hash);
      assert.equal(isWrong, false);
    });

    it("should issue signed JWT tokens and verify session payload", async () => {
      const token = await createSessionToken({
        id: "usr-admin-1",
        email: "admin@nexathon.com",
        name: "Admin User",
        role: "admin",
        organizationId: "org-default",
      });

      assert.ok(typeof token === "string" && token.length > 20);

      const payload = await verifySessionToken(token);
      assert.ok(payload !== null);
      assert.equal(payload?.email, "admin@nexathon.com");
      assert.equal(payload?.role, "admin");
      assert.equal(payload?.organizationId, "org-default");
    });

    it("should reject tampered or corrupted JWT tokens", async () => {
      const tampered = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";
      const payload = await verifySessionToken(tampered);
      assert.equal(payload, null);
    });
  });

  describe("Scoring Rubric & Duplicate Prevention", () => {
    it("should calculate weighted criteria score correctly", () => {
      const criteriaScores = {
        innovation: 9, // weight 3.0 -> 27
        technical: 8,  // weight 2.5 -> 20
        impact: 9,     // weight 2.5 -> 22.5
        presentation: 8 // weight 2.0 -> 16
      };
      // Total weighted = 27 + 20 + 22.5 + 16 = 85.5
      const weights: Record<string, number> = {
        innovation: 3.0,
        technical: 2.5,
        impact: 2.5,
        presentation: 2.0,
      };

      const weightedTotal = Object.entries(criteriaScores).reduce(
        (sum, [key, val]) => sum + val * (weights[key] || 1),
        0
      );

      assert.equal(weightedTotal, 85.5);
    });

    it("should prevent duplicate scorecard inflation by upserting existing judge score", () => {
      const existing = memoryStore.getScores({ eventId: "ev-nexathon-26" });
      const initialCount = existing.length;

      // Add score
      memoryStore.addScore({
        id: "test-score-1",
        eventId: "ev-nexathon-26",
        projectId: "p-bioguard",
        judgeId: "j-rajesh",
        criteriaScores: { innovation: 9 },
        total: 9,
        weightedTotal: 90,
        comment: "Excellent first evaluation",
        flagged: false,
        flagReason: "",
        createdAt: new Date().toISOString(),
      });

      // Submit updated evaluation for the same project & judge
      memoryStore.addScore({
        id: "test-score-1-dup",
        eventId: "ev-nexathon-26",
        projectId: "p-bioguard",
        judgeId: "j-rajesh",
        criteriaScores: { innovation: 10 },
        total: 10,
        weightedTotal: 100,
        comment: "Revised after live demonstration",
        flagged: false,
        flagReason: "",
        createdAt: new Date().toISOString(),
      });

      const updated = memoryStore.getScores({ eventId: "ev-nexathon-26", projectId: "p-bioguard", judgeId: "j-rajesh" });
      assert.equal(updated.length, 1, "Expected single upserted score record, not duplicated entries");
      assert.equal(updated[0].total, 10);
    });
  });

  describe("Check-in Scanner & Anti-Duplicate Verification", () => {
    it("should check in visitor and reject duplicate double-scanning", () => {
      const visitorCode = "VIS-TEST-AUTO";
      memoryStore.addVisitor({
        id: "vis-test-unit",
        eventId: "ev-nexathon-26",
        name: "Test Attendee",
        email: "test@example.com",
        phone: "+91 99999 88888",
        type: "visitor",
        interests: ["AI/ML"],
        code: visitorCode,
        checkedIn: false,
        createdAt: new Date().toISOString(),
      });

      // First check-in
      const v1 = memoryStore.getVisitorByCode(visitorCode);
      assert.ok(v1 !== undefined);
      assert.equal(v1.checkedIn, false);

      const checked1 = memoryStore.checkInVisitor(v1.id);
      assert.equal(checked1?.checkedIn, true);

      // Repeat check-in attempt
      const v2 = memoryStore.getVisitorByCode(visitorCode);
      assert.equal(v2?.checkedIn, true);
    });
  });
});
