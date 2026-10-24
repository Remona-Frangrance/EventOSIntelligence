import { NextResponse } from "next/server";
import { db } from "@/db";
import { scores, projects, judges, scans, visitors, certificates, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";
import { verifyCertificateHMAC } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  // Enforce admin-only access
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { eventId } = await params;

  try {
    const [scList, prjList, jdList, snList, visList, certList, auditList] = await Promise.all([
      db.select().from(scores).where(eq(scores.eventId, eventId)),
      db.select().from(projects).where(eq(projects.eventId, eventId)),
      db.select().from(judges).where(eq(judges.eventId, eventId)),
      db.select().from(scans).where(eq(scans.eventId, eventId)),
      db.select().from(visitors).where(eq(visitors.eventId, eventId)),
      db.select().from(certificates).where(eq(certificates.eventId, eventId)),
      db.select().from(auditLogs).where(eq(auditLogs.eventId, eventId)).limit(100),
    ]);

    // 1. SCORE DISTRIBUTION BUCKETS
    const distribution = {
      "90-100 (Exceptional)": 0,
      "80-89 (Strong)": 0,
      "70-79 (Proficient)": 0,
      "60-69 (Developing)": 0,
      "<60 (Needs Work)": 0,
    };

    scList.forEach((s) => {
      const scoreVal = s.weightedTotal ? s.weightedTotal / 10 : s.total;
      if (scoreVal >= 90) distribution["90-100 (Exceptional)"]++;
      else if (scoreVal >= 80) distribution["80-89 (Strong)"]++;
      else if (scoreVal >= 70) distribution["70-79 (Proficient)"]++;
      else if (scoreVal >= 60) distribution["60-69 (Developing)"]++;
      else distribution["<60 (Needs Work)"]++;
    });

    // 2. BIAS & ANOMALY ALERTS
    const biasAlerts: {
      id: string;
      judgeName: string;
      projectTitle: string;
      type: "harshness" | "generosity" | "outlier";
      severity: "high" | "medium";
      details: string;
      score: number;
    }[] = [];

    // Group scores by project to detect variances
    const scoresByProject: Record<string, typeof scList> = {};
    scList.forEach((s) => {
      if (!scoresByProject[s.projectId]) scoresByProject[s.projectId] = [];
      scoresByProject[s.projectId].push(s);
    });

    for (const [pId, pScores] of Object.entries(scoresByProject)) {
      if (pScores.length >= 2) {
        const prj = prjList.find((p) => p.id === pId);
        const totals = pScores.map((s) => (s.weightedTotal ? s.weightedTotal / 10 : s.total));
        const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
        const sd = Math.sqrt(totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length) || 1;

        pScores.forEach((s) => {
          const val = s.weightedTotal ? s.weightedTotal / 10 : s.total;
          const z = (val - mean) / sd;
          const jd = jdList.find((j) => j.id === s.judgeId);

          if (Math.abs(z) >= 1.6 || s.flagged) {
            const isHarsh = z < 0;
            biasAlerts.push({
              id: s.id,
              judgeName: jd?.name || "Judge",
              projectTitle: prj?.title || "Project",
              type: isHarsh ? "harshness" : "generosity",
              severity: Math.abs(z) >= 2.0 ? "high" : "medium",
              details: s.flagReason || `Scored ${val.toFixed(1)} vs peer average ${mean.toFixed(1)} (${Math.abs(z).toFixed(1)}σ deviation)`,
              score: Math.round(val),
            });
          }
        });
      }
    }

    // 3. JUDGE STRICTNESS COMPARISON
    const eventTotalScore = scList.reduce((acc, s) => acc + (s.weightedTotal ? s.weightedTotal / 10 : s.total), 0);
    const eventOverallMean = scList.length ? eventTotalScore / scList.length : 75;

    const judgeStrictness = jdList.map((j) => {
      const myScores = scList.filter((s) => s.judgeId === j.id);
      const myMean = myScores.length
        ? myScores.reduce((acc, s) => acc + (s.weightedTotal ? s.weightedTotal / 10 : s.total), 0) / myScores.length
        : eventOverallMean;

      const deviation = Math.round((myMean - eventOverallMean) * 10) / 10;
      let archetype: "Strict Evaluator" | "Balanced" | "Generous Evaluator" = "Balanced";
      if (deviation <= -4) archetype = "Strict Evaluator";
      else if (deviation >= 4) archetype = "Generous Evaluator";

      return {
        id: j.id,
        name: j.name,
        organization: j.organization,
        evaluationsCount: myScores.length,
        averageScore: Math.round(myMean * 10) / 10,
        deviation,
        archetype,
      };
    }).sort((a, b) => a.deviation - b.deviation);

    // 4. PEAK HOURS & TIMELINE
    const hourlyCounts: Record<string, number> = {};
    snList.forEach((s) => {
      const h = new Date(s.createdAt).getHours();
      const label = `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`;
      hourlyCounts[label] = (hourlyCounts[label] || 0) + 1;
    });

    let peakHour = "11:00 AM";
    let peakCount = 0;
    for (const [hr, count] of Object.entries(hourlyCounts)) {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hr;
      }
    }

    // 5. FOOTFALL PER BOOTH
    const boothTraffic = prjList.map((p) => {
      const boothScans = snList.filter((s) => s.projectId === p.id).length;
      return {
        id: p.id,
        title: p.title,
        boothNo: p.boothNo,
        category: p.category,
        scans: boothScans,
        views: p.views || 0,
        votes: p.votes || 0,
        engagementScore: Math.round((boothScans * 2) + (p.views || 0) + ((p.votes || 0) * 3)),
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore);

    // 6. SECURITY ALERTS: DUPLICATE / FAKE QR & CERTIFICATE ANOMALIES
    const securityAlerts: {
      type: "duplicate_qr" | "unverified_pass" | "certificate_tamper" | "rapid_scan";
      severity: "critical" | "warning";
      message: string;
      entityId?: string;
      timestamp: string;
    }[] = [];

    // Check certificate HMAC integrity
    certList.forEach((c) => {
      if (c.verificationHash) {
        const isValid = verifyCertificateHMAC(c.code, c.recipientName, c.eventId, c.role, c.verificationHash);
        if (!isValid) {
          securityAlerts.push({
            type: "certificate_tamper",
            severity: "critical",
            message: `Cryptographic tamper detected on certificate ${c.code} (${c.recipientName}). Hash mismatch in registry.`,
            entityId: c.id,
            timestamp: c.issuedAt ? new Date(c.issuedAt).toISOString() : new Date().toISOString(),
          });
        }
      }
    });

    // Check duplicate check-ins from audit logs
    const duplicateCheckins = auditList.filter((a) => a.action === "CHECKIN_DUPLICATE");
    duplicateCheckins.forEach((d) => {
      securityAlerts.push({
        type: "duplicate_qr",
        severity: "warning",
        message: `Duplicate badge check-in attempt for ${(d.details as any)?.name || 'visitor'} (Pass ${(d.details as any)?.code || ''})`,
        entityId: d.targetId,
        timestamp: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      });
    });

    // Rapid scan bursts (>4 scans in 10 seconds on the same booth)
    const scanTimes: Record<string, number[]> = {};
    snList.forEach((s) => {
      if (!scanTimes[s.projectId]) scanTimes[s.projectId] = [];
      scanTimes[s.projectId].push(new Date(s.createdAt).getTime());
    });

    for (const [pId, timestamps] of Object.entries(scanTimes)) {
      timestamps.sort((a, b) => a - b);
      for (let i = 0; i < timestamps.length - 3; i++) {
        if (timestamps[i + 3] - timestamps[i] < 10000) {
          const prj = prjList.find((p) => p.id === pId);
          securityAlerts.push({
            type: "rapid_scan",
            severity: "warning",
            message: `Rapid scan surge (4+ scans in 10s) at Booth ${prj?.boothNo || pId} ("${prj?.title || 'Project'}"). Check for shared QR screenshots.`,
            entityId: pId,
            timestamp: new Date(timestamps[i]).toISOString(),
          });
          break;
        }
      }
    }

    return NextResponse.json({
      scoreDistribution: distribution,
      biasAlerts,
      judgeStrictness,
      peakHours: {
        peakHour,
        peakVolume: peakCount,
        hourlyDistribution: hourlyCounts,
      },
      boothTraffic: {
        topVisited: boothTraffic.slice(0, 5),
        leastVisited: [...boothTraffic].reverse().slice(0, 3),
        totalScansRecorded: snList.length,
      },
      securityAlerts,
      overallMean: Math.round(eventOverallMean * 10) / 10,
      totalEvaluations: scList.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to compute event insights" }, { status: 500 });
  }
}
