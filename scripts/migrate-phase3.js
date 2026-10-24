// Idempotent migration script for Phase 3: Business & Monetization
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
  console.log("Connected to Supabase PostgreSQL for Phase 3 migration...");

  try {
    await client.query("BEGIN");

    // 1. Alter events table for custom branding & ticket tiers
    console.log("Adding branding & ticketing fields to events...");
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS brand_color VARCHAR(30) NOT NULL DEFAULT '#4f46e5';
      ALTER TABLE events ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
      ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_tiers JSONB NOT NULL DEFAULT '[
        {"id":"free","name":"General Attendee","price":0,"currency":"INR","description":"Access to all expo booths, project showcase & crowd voting"},
        {"id":"vip","name":"VIP Delegate Pass","price":999,"currency":"INR","description":"Priority hall seating, delegate kit & networking lounge access"}
      ]'::jsonb;
    `);

    // 2. Create orders table for monetization & paid ticketing
    console.log("Creating orders table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
        tier_id VARCHAR(50) NOT NULL DEFAULT 'free',
        tier_name TEXT NOT NULL DEFAULT 'General Attendee',
        amount INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status VARCHAR(30) NOT NULL DEFAULT 'paid',
        payment_provider VARCHAR(30) NOT NULL DEFAULT 'mock',
        provider_order_id TEXT NOT NULL DEFAULT '',
        provider_payment_id TEXT NOT NULL DEFAULT '',
        buyer_name TEXT NOT NULL,
        buyer_email TEXT NOT NULL,
        buyer_phone TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Create sponsors table
    console.log("Creating sponsors table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS sponsors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        tier VARCHAR(30) NOT NULL DEFAULT 'gold',
        logo_url TEXT NOT NULL DEFAULT '',
        website TEXT NOT NULL DEFAULT '',
        booth_no VARCHAR(30) NOT NULL DEFAULT '',
        brochure_url TEXT NOT NULL DEFAULT '',
        contact_email TEXT NOT NULL DEFAULT '',
        passcode VARCHAR(30) NOT NULL DEFAULT '',
        views INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Create sponsor_leads table
    console.log("Creating sponsor_leads table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS sponsor_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        visitor_name TEXT NOT NULL,
        visitor_email TEXT NOT NULL,
        visitor_phone TEXT NOT NULL DEFAULT '',
        visitor_company TEXT NOT NULL DEFAULT '',
        interests JSONB NOT NULL DEFAULT '[]'::jsonb,
        notes TEXT NOT NULL DEFAULT '',
        rating INTEGER NOT NULL DEFAULT 3,
        captured_by TEXT NOT NULL DEFAULT 'Booth Scanner',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Seed default sponsors for existing events if none exist
    const { rows: existingSponsors } = await client.query("SELECT COUNT(*) FROM sponsors");
    if (parseInt(existingSponsors[0].count, 10) === 0) {
      console.log("Seeding initial partner sponsors for demo events...");
      const { rows: evRows } = await client.query("SELECT id FROM events LIMIT 3");
      for (const ev of evRows) {
        await client.query(`
          INSERT INTO sponsors (event_id, name, tier, logo_url, website, booth_no, contact_email, passcode)
          VALUES 
            ($1, 'Anthropic Cloud', 'title', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop', 'https://anthropic.com', 'S-01', 'partners@anthropic.com', 'ANT2026'),
            ($1, 'Supabase Enterprise', 'platinum', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop', 'https://supabase.com', 'S-02', 'sponsors@supabase.io', 'SUPA2026'),
            ($1, 'Vercel Edge', 'gold', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&h=200&fit=crop', 'https://vercel.com', 'S-03', 'events@vercel.com', 'VERC2026')
          ON CONFLICT DO NOTHING
        `, [ev.id]);
      }
    }

    await client.query("COMMIT");
    console.log("Phase 3 Database migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
