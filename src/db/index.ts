import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const isCloud =
  databaseUrl.includes("neon.tech") ||
  databaseUrl.includes("sslmode=require") ||
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("pooler.supabase.com") ||
  databaseUrl.includes("render.com") ||
  databaseUrl.includes("railway.app") ||
  databaseUrl.includes("aivencloud.com");

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaLastDatabaseUrl?: string;
};

if (globalForDb.__arenaLastDatabaseUrl !== databaseUrl && globalForDb.__arenaNextJsPostgresqlPool) {
  try {
    globalForDb.__arenaNextJsPostgresqlPool.end().catch(() => {});
  } catch {}
  globalForDb.__arenaNextJsPostgresqlPool = undefined;
}

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    // Transaction mode pooler (port 6543) multiplexes connections server-side,
    // so a small local pool is ideal to avoid overwhelming the pooler.
    max: isCloud ? 5 : 10,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  globalForDb.__arenaLastDatabaseUrl = databaseUrl;
}

export const db = drizzle(pool);

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  isCloud: boolean;
  host: string;
  error?: string;
  suggestion?: string;
}> {
  let host = "127.0.0.1";
  try {
    const urlObj = new URL(databaseUrl.replace("postgresql://", "http://"));
    host = urlObj.hostname;
  } catch {}

  try {
    await pool.query("SELECT 1;");
    return { connected: true, isCloud, host };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    let suggestion = "";

    if (errorMsg.includes("password authentication failed")) {
      suggestion =
        "Password incorrect or special characters (@, $, #) in password not URL-encoded. Reset your password in Supabase Dashboard -> Settings -> Database, and use URL encoding if special characters exist (e.g. '@' -> '%40', '$' -> '%24').";
    } else if (errorMsg.includes("timeout") || errorMsg.includes("ETIMEDOUT")) {
      suggestion =
        "Connection timed out. If using Supabase, make sure you are using the connection pooler URL (aws-0-...pooler.supabase.com:5432) or port 5432 (Session mode).";
    }

    return { connected: false, isCloud, host, error: errorMsg, suggestion };
  }
}

