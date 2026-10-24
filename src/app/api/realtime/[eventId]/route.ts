import { db } from "@/db";
import { scores, projects, visitors, scans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      req.signal.addEventListener("abort", () => {
        active = false;
        try {
          controller.close();
        } catch {}
      });

      async function sendPulse() {
        if (!active) return;
        try {
          let projs = await db.select().from(projects).where(eq(projects.eventId, eventId));
          let scList = await db.select().from(scores).where(eq(scores.eventId, eventId));
          let visList = await db.select().from(visitors).where(eq(visitors.eventId, eventId));
          let snList = await db.select().from(scans).where(eq(scans.eventId, eventId));

          if ((!projs || projs.length === 0) && process.env.NODE_ENV !== "production") {
            const { memoryStore } = await import("@/lib/demoData");
            projs = memoryStore.getProjects(eventId) as any;
            scList = memoryStore.getScores({ eventId }) as any;
            visList = memoryStore.getVisitors(eventId) as any;
            snList = [] as any;
          }

          const leaderboard = (projs || []).map((p: any) => {
            const pScores = (scList || []).filter((s: any) => s.projectId === p.id);
            const totals = pScores.map((s: any) => (s.weightedTotal != null ? s.weightedTotal / 10 : s.total));
            const avgScore = pScores.length
              ? Math.round((totals.reduce((a: number, b: number) => a + b, 0) / pScores.length) * 10) / 10
              : 0;
            const flags = pScores.filter((s: any) => s.flagged).length;
            return {
              ...p,
              avgScore,
              judgeCount: pScores.length,
              flags,
            };
          }).sort((a: any, b: any) => b.avgScore - a.avgScore || (b.votes || 0) - (a.votes || 0));

          const payload = {
            eventId,
            timestamp: new Date().toISOString(),
            leaderboard,
            checkedInCount: (visList || []).filter((v: any) => v.checkedIn).length,
            totalVisitors: (visList || []).length,
            totalScores: (scList || []).length,
            totalScans: (snList || []).length,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          if (!active) return;
        }
      }

      // Initial pulse
      await sendPulse();

      // Recurring interval pulse every 4 seconds
      const intervalId = setInterval(async () => {
        if (!active) {
          clearInterval(intervalId);
          return;
        }
        await sendPulse();
      }, 4000);

      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
