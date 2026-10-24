import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();
  let dbHealthy = false;
  let dbLatencyMs = 0;
  let dbError = null;

  try {
    await db.execute(sql`select 1`);
    dbLatencyMs = Math.round((performance.now() - start) * 100) / 100;
    dbHealthy = true;
  } catch (err: any) {
    dbError = err.message || "Database connection error";
  }

  const memory = process.memoryUsage();

  const payload = {
    status: dbHealthy ? "pass" : "warn",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: "2.4.0",
    environment: process.env.NODE_ENV || "development",
    services: {
      database: {
        status: dbHealthy ? "healthy" : "degraded",
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      sseTelemetry: {
        status: "operational",
        endpoint: "/api/realtime/:eventId",
      },
      aiEngine: {
        status: process.env.ANTHROPIC_API_KEY ? "claude-3-5-sonnet" : "deterministic-fallback",
      },
    },
    system: {
      memoryUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      memoryTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
    },
  };

  return Response.json(payload, {
    status: dbHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
