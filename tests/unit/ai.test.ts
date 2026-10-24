import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  judgeMatchScore,
  fairScoreCheck,
  analyzeSentiment,
  summarizeFeedback,
  recommendProjects,
} from "../../src/lib/ai.ts";

describe("AI Engine Unit Tests (src/lib/ai.ts)", () => {
  describe("judgeMatchScore", () => {
    it("should assign high match score for domain overlap and tech affinity", () => {
      const match = judgeMatchScore({
        judgeExpertise: ["AI/ML", "Python", "Computer Vision"],
        projectCategory: "AI/ML",
        projectTech: ["Python", "PyTorch", "FastAPI"],
      });

      assert.ok(match.score >= 70, `Expected score >= 70, got ${match.score}`);
      assert.ok(match.reasons.some((r) => r.includes("Domain overlap")));
      assert.ok(match.reasons.some((r) => r.includes("Tech affinity")));
    });

    it("should provide generalist score when no direct domain overlap exists", () => {
      const match = judgeMatchScore({
        judgeExpertise: ["FinTech"],
        projectCategory: "GreenTech",
        projectTech: ["Solidity", "IPFS"],
      });

      assert.equal(match.score, 40);
      assert.ok(match.reasons.some((r) => r.includes("Generalist coverage")));
    });
  });

  describe("fairScoreCheck", () => {
    it("should not flag when fewer than 3 scores exist", () => {
      const res = fairScoreCheck([35, 36], 49);
      assert.equal(res.flagged, false);
      assert.equal(res.z, 0);
    });

    it("should flag generosity anomaly when z >= 1.8 sigma", () => {
      const cohort = [20, 22, 21, 23, 20, 22, 21];
      const outlier = 45; // Far above mean (~21)
      const res = fairScoreCheck(cohort, outlier);

      assert.equal(res.flagged, true);
      assert.ok(res.z >= 1.8, `Expected z >= 1.8, got ${res.z}`);
      assert.ok(res.reason.includes("generosity bias"));
    });

    it("should flag harshness anomaly when z <= -1.8 sigma", () => {
      const cohort = [40, 42, 41, 43, 40, 42, 41];
      const outlier = 15; // Far below mean (~41)
      const res = fairScoreCheck(cohort, outlier);

      assert.equal(res.flagged, true);
      assert.ok(res.z <= -1.8, `Expected z <= -1.8, got ${res.z}`);
      assert.ok(res.reason.includes("harshness bias"));
    });

    it("should not flag balanced score within 1.8 sigma", () => {
      const cohort = [30, 32, 34, 31, 33];
      const normalScore = 32;
      const res = fairScoreCheck(cohort, normalScore);

      assert.equal(res.flagged, false);
      assert.ok(Math.abs(res.z) < 1.8);
    });
  });

  describe("analyzeSentiment", () => {
    it("should detect positive feedback", () => {
      assert.equal(analyzeSentiment("The booth was amazing and innovative!"), "positive");
    });

    it("should detect negative feedback", () => {
      assert.equal(analyzeSentiment("The demo had a confusing delay and slow response."), "negative");
    });

    it("should detect neutral feedback", () => {
      assert.equal(analyzeSentiment("The team presented their mobile application."), "neutral");
    });
  });

  describe("summarizeFeedback", () => {
    it("should extract keywords, calculate net score, and generate headline", () => {
      const comments = [
        "Great booth with amazing robotics technology!",
        "Impressive design and smooth user experience.",
        "A bit crowded around the presentation table.",
      ];

      const summary = summarizeFeedback(comments);
      assert.equal(summary.positive, 2);
      assert.equal(summary.negative, 1);
      assert.ok(summary.keywords.length > 0);
      assert.ok(summary.headline.length > 0);
    });
  });

  describe("recommendProjects", () => {
    it("should recommend projects matching visitor interests with explanations", () => {
      const projects = [
        { id: "1", title: "AI Vision Scanner", category: "AI/ML", techStack: ["Python", "OpenCV"] },
        { id: "2", title: "CleanWater IoT", category: "GreenTech", techStack: ["Arduino", "C++"] },
      ];

      const recs = recommendProjects(["AI/ML"], projects);
      assert.equal(recs[0].id, "1");
      assert.ok(recs[0].score > recs[1].score);
      assert.ok(recs[0].reasons[0].includes("Matches your interest in AI/ML"));
    });
  });
});
