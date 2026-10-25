const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  console.log("Seeding floor plans and templates...");

  // 1. Fetch organization
  const orgRes = await pool.query("SELECT id, name FROM organizations LIMIT 1");
  const org = orgRes.rows[0];
  if (!org) {
    console.log("No organization found. Skipping seed.");
    return;
  }

  // 2. Seed an organization template in floor_templates (contains NO project or visitor data!)
  const existingTemplates = await pool.query(
    "SELECT id FROM floor_templates WHERE organization_id = $1",
    [org.id]
  );

  if (existingTemplates.rows.length === 0) {
    const templateBooths = [
      { id: "tb-1", label: "A-01", x: 2, y: 2, width: 2, height: 2, color: "#6366f1" },
      { id: "tb-2", label: "A-02", x: 5, y: 2, width: 2, height: 2, color: "#6366f1" },
      { id: "tb-3", label: "A-03", x: 8, y: 2, width: 2, height: 2, color: "#6366f1" },
      { id: "tb-4", label: "A-04", x: 11, y: 2, width: 2, height: 2, color: "#6366f1" },
      { id: "tb-5", label: "B-01", x: 2, y: 7, width: 2, height: 2, color: "#ec4899" },
      { id: "tb-6", label: "B-02", x: 5, y: 7, width: 2, height: 2, color: "#ec4899" },
      { id: "tb-7", label: "B-03", x: 8, y: 7, width: 2, height: 2, color: "#ec4899" },
      { id: "tb-8", label: "B-04", x: 11, y: 7, width: 2, height: 2, color: "#ec4899" },
    ];

    const templateWalls = [
      { id: "tw-top", x1: 0, y1: 0, x2: 15, y2: 0, thickness: 2 },
      { id: "tw-bottom", x1: 0, y1: 11, x2: 15, y2: 11, thickness: 2 },
      { id: "tw-left", x1: 0, y1: 0, x2: 0, y2: 11, thickness: 2 },
      { id: "tw-right", x1: 15, y1: 0, x2: 15, y2: 11, thickness: 2 },
      { id: "tw-divider", x1: 0, y1: 5, x2: 14, y2: 5, thickness: 1 },
    ];

    const templateOpenings = [
      { id: "to-main", x: 6, y: 0, width: 3, height: 1, type: "entrance", label: "Main Entrance Gate" },
      { id: "to-exit", x: 6, y: 11, width: 2, height: 1, type: "exit", label: "Emergency Hall Exit" },
    ];

    await pool.query(
      `INSERT INTO floor_templates (organization_id, name, description, grid_width, grid_height, walls, openings, booths)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        org.id,
        "Standard Dual-Aisle Expo Grid (16x12)",
        "Standard 8-booth dual aisle exhibition layout with entrance gate and emergency exit. Pre-configured for rapid event rollouts.",
        16,
        12,
        JSON.stringify(templateWalls),
        JSON.stringify(templateOpenings),
        JSON.stringify(templateBooths),
      ]
    );
    console.log("Seeded organization template in floor_templates!");
  }

  // 3. For each event, ensure at least one default floor plan exists
  const eventsRes = await pool.query("SELECT id, name FROM events");
  for (const ev of eventsRes.rows) {
    const plansRes = await pool.query("SELECT id FROM floor_plans WHERE event_id = $1", [ev.id]);
    if (plansRes.rows.length === 0) {
      // Fetch projects for this event to assign to booths
      const projRes = await pool.query("SELECT id, title, booth_no FROM projects WHERE event_id = $1", [ev.id]);
      const eventProjects = projRes.rows;

      const booths = [
        {
          id: "b-1",
          label: "TM-01",
          x: 2,
          y: 2,
          width: 2,
          height: 2,
          color: "#8b5cf6",
          projectId: eventProjects[0] ? eventProjects[0].id : null,
          boothNo: "TM-01",
        },
        {
          id: "b-2",
          label: "TM-02",
          x: 6,
          y: 2,
          width: 2,
          height: 2,
          color: "#3b82f6",
          projectId: eventProjects[1] ? eventProjects[1].id : null,
          boothNo: "TM-02",
        },
        {
          id: "b-3",
          label: "TM-03",
          x: 10,
          y: 2,
          width: 2,
          height: 2,
          color: "#06b6d4",
          projectId: eventProjects[2] ? eventProjects[2].id : null,
          boothNo: "TM-03",
        },
        {
          id: "b-4",
          label: "TM-04",
          x: 2,
          y: 7,
          width: 2,
          height: 2,
          color: "#10b981",
          projectId: eventProjects[3] ? eventProjects[3].id : null,
          boothNo: "TM-04",
        },
        {
          id: "b-5",
          label: "TM-05",
          x: 6,
          y: 7,
          width: 2,
          height: 2,
          color: "#f59e0b",
          projectId: eventProjects[4] ? eventProjects[4].id : null,
          boothNo: "TM-05",
        },
        {
          id: "b-6",
          label: "TM-06",
          x: 10,
          y: 7,
          width: 2,
          height: 2,
          color: "#ec4899",
          projectId: eventProjects[5] ? eventProjects[5].id : null,
          boothNo: "TM-06",
        },
      ];

      const walls = [
        { id: "w-north", x1: 0, y1: 0, x2: 14, y2: 0, thickness: 2 },
        { id: "w-south", x1: 0, y1: 10, x2: 14, y2: 10, thickness: 2 },
        { id: "w-west", x1: 0, y1: 0, x2: 0, y2: 10, thickness: 2 },
        { id: "w-east", x1: 14, y1: 0, x2: 14, y2: 10, thickness: 2 },
        { id: "w-center", x1: 1, y1: 5, x2: 13, y2: 5, thickness: 1 },
      ];

      const openings = [
        { id: "op-main", x: 5, y: 0, width: 4, height: 1, type: "entrance", label: "Expo Entrance Gate" },
        { id: "op-side", x: 14, y: 4, width: 1, height: 2, type: "door", label: "Judge Lounge Access" },
        { id: "op-fire", x: 5, y: 10, width: 3, height: 1, type: "emergency", label: "Fire Exit" },
      ];

      await pool.query(
        `INSERT INTO floor_plans (event_id, name, description, is_default, status, grid_width, grid_height, walls, openings, booths)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          ev.id,
          "Main Exhibition Hall (Ground Floor)",
          "Primary exhibition floor featuring startup stalls, prototype demo bays, and high-traffic sponsor corridors.",
          true,
          "active",
          15,
          11,
          JSON.stringify(walls),
          JSON.stringify(openings),
          JSON.stringify(booths),
        ]
      );
      console.log(`Seeded default floor plan for event: ${ev.name}`);
    }
  }

  console.log("Seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
  })
  .finally(() => pool.end());
