import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Wiping all event, project, visitor, score, scan, certificate, and feedback data...");
    await pool.query(`
      TRUNCATE TABLE feedbacks, scans, scores, certificates, orders, visitors, projects, judges, events CASCADE;
    `);
    console.log("Database tables truncated successfully!");

    // Ensure Chief Admin exists in users table
    await pool.query(`
      INSERT INTO users (id, name, email, password, role, organization)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Alex Vance',
        'admin@nexathon.com',
        'admin123',
        'admin',
        'EventOS Intelligence'
      )
      ON CONFLICT (email) 
      DO UPDATE SET password = 'admin123', role = 'admin';
    `);
    console.log("Admin user (admin@nexathon.com / admin123) verified.");

    const evCount = await pool.query("SELECT COUNT(*) FROM events");
    const prjCount = await pool.query("SELECT COUNT(*) FROM projects");
    console.log(`Current Events count: ${evCount.rows[0].count}`);
    console.log(`Current Projects count: ${prjCount.rows[0].count}`);
  } catch (err) {
    console.error("Error wiping data:", err);
  } finally {
    await pool.end();
  }
}

run();
