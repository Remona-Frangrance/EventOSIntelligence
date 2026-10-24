require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Starting Phase 1 DB Migration...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug varchar(100) NOT NULL UNIQUE,
        plan varchar(30) NOT NULL DEFAULT 'free',
        logo_url text NOT NULL DEFAULT '',
        primary_color varchar(30) NOT NULL DEFAULT '#7c3aed',
        owner_id uuid,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
      ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_hash text NOT NULL DEFAULT '';
      ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_email text NOT NULL DEFAULT '';
      ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS visitor_code varchar(30) NOT NULL DEFAULT '';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
        event_id uuid REFERENCES events(id) ON DELETE SET NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        actor_email text NOT NULL DEFAULT '',
        actor_role varchar(30) NOT NULL DEFAULT 'system',
        action text NOT NULL,
        target_type varchar(50) NOT NULL DEFAULT '',
        target_id text NOT NULL DEFAULT '',
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        ip_address text NOT NULL DEFAULT '',
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      INSERT INTO organizations (name, slug, plan)
      VALUES ('EventOS Global', 'default-org', 'pro')
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query(`
      UPDATE events
      SET organization_id = (SELECT id FROM organizations WHERE slug = 'default-org')
      WHERE organization_id IS NULL;
    `);

    await client.query(`
      UPDATE users
      SET organization_id = (SELECT id FROM organizations WHERE slug = 'default-org')
      WHERE organization_id IS NULL;
    `);

    await client.query("COMMIT;");
    console.log("✅ Phase 1 Migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
