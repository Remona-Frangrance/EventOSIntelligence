// Idempotent migration script for Phase 5: Experience & Scale (Indexes & API Keys)
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not defined in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  console.log("Connected to Supabase PostgreSQL for Phase 5 performance indexes & API keys...");

  try {
    await client.query("BEGIN");

    // 1. Create api_keys table
    console.log("Creating api_keys table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        key_hash TEXT NOT NULL,
        permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
        last_used_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 2. High-Performance Database Indexes
    console.log("Creating performance database indexes for rapid querying...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_event_id ON projects(event_id);
      CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
      CREATE INDEX IF NOT EXISTS idx_scores_event_id ON scores(event_id);
      CREATE INDEX IF NOT EXISTS idx_scores_project_id ON scores(project_id);
      CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id);
      CREATE INDEX IF NOT EXISTS idx_visitors_event_id ON visitors(event_id);
      CREATE INDEX IF NOT EXISTS idx_visitors_code ON visitors(code);
      CREATE INDEX IF NOT EXISTS idx_scans_event_id ON scans(event_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON audit_logs(event_id);
      CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
      CREATE INDEX IF NOT EXISTS idx_sponsor_leads_sponsor ON sponsor_leads(sponsor_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    `);

    await client.query("COMMIT");
    console.log("Phase 5 database indexes and api_keys migration completed successfully with 0 errors!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Phase 5 migration failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
