const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Applying floor plan migrations...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS floor_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_default BOOLEAN NOT NULL DEFAULT false,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      grid_width INTEGER NOT NULL DEFAULT 20,
      grid_height INTEGER NOT NULL DEFAULT 15,
      walls JSONB NOT NULL DEFAULT '[]'::jsonb,
      openings JSONB NOT NULL DEFAULT '[]'::jsonb,
      booths JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS floor_plans_event_id_idx ON floor_plans(event_id);

    CREATE TABLE IF NOT EXISTS floor_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      grid_width INTEGER NOT NULL DEFAULT 20,
      grid_height INTEGER NOT NULL DEFAULT 15,
      walls JSONB NOT NULL DEFAULT '[]'::jsonb,
      openings JSONB NOT NULL DEFAULT '[]'::jsonb,
      booths JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS floor_templates_org_id_idx ON floor_templates(organization_id);
  `);
  console.log("Migration executed successfully!");
}

run()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => pool.end());
