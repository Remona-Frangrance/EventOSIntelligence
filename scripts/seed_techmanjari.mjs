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
    const existing = await pool.query("SELECT id, name FROM events WHERE name ILIKE '%techmanjari%'");
    let eventId;
    if (existing.rows.length > 0) {
      eventId = existing.rows[0].id;
      console.log("Techmanjari event already exists:", eventId);
    } else {
      const insertEv = await pool.query(`
        INSERT INTO events (name, slug, type, description, venue, city, status, registration_open, created_at)
        VALUES (
          'TECHMANJARI ''26 — National Technical Symposium & Hackathon',
          'techmanjari-26',
          'hackathon',
          'TECHMANJARI is Gujarat''s premier annual national technical symposium and 36-hour hackathon with AI/ML, CyberSecurity, Robotics & IoT, and Web3 tracks.',
          'Campus Central Auditorium & Innovation Dome',
          'Vadodara / Ahmedabad',
          'live',
          true,
          NOW()
        )
        RETURNING id;
      `);
      eventId = insertEv.rows[0].id;
      console.log("Created Techmanjari event:", eventId);
    }

    // Check projects for this event
    const prjRes = await pool.query("SELECT id, title FROM projects WHERE event_id = $1", [eventId]);
    console.log("Current projects for Techmanjari:", prjRes.rows.length);

    if (prjRes.rows.length === 0) {
      await pool.query(`
        INSERT INTO projects (event_id, title, category, team_name, leader_name, leader_email, description, tech_stack, booth_no, code, status, views, votes)
        VALUES 
        ($1, 'DroneVision Sentinel — Aerial Infrastructure Inspection', 'Robotics', 'AeroByte Systems', 'Kunal Shah', 'kunal@aerobyte.in', 'Autonomous edge drone computing for bridge and solar panel thermal inspection using micro-LIDAR and real-time crack classification.', $2::jsonb, 'TM-01', 'PRJ-TM99A1', 'approved', 890, 112),
        ($1, 'VajraShield — Zero-Trust Cloud SIEM & Threat Defense', 'Cybersecurity', 'CyberKnights Vadodara', 'Rohan Varma', 'rohan@cyberknights.org', 'Real-time kernel telemetry and ransomware kill-switch powered by eBPF and LLM prompt-injection detection firewall.', $3::jsonb, 'TM-02', 'PRJ-TM88B2', 'approved', 640, 78);
      `, [
        eventId,
        JSON.stringify(['PX4 Autopilot', 'ROS2', 'YOLOv8', 'Jetson Orin', 'Python']),
        JSON.stringify(['eBPF', 'Rust', 'Go', 'Docker', 'ClickHouse'])
      ]);
      console.log("Successfully inserted DroneVision Sentinel and VajraShield projects for Techmanjari!");
    } else {
      console.log("Projects already present for Techmanjari!");
    }

  } catch (err) {
    console.error("Error seeding Techmanjari:", err);
  } finally {
    await pool.end();
  }
}

run();
