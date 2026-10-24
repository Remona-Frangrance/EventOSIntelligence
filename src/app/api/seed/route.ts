import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, events, projects, judges, visitors, scores, feedbacks, scans, certificates, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { INITIAL_USERS } from "@/lib/demoData";
import { requireAuth } from "@/lib/authGuard";
import { generateCertificateHMAC } from "@/lib/crypto";

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: Request) {
  // Enforce admin-only access for database seeding
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const existing = await db.select().from(events);
    if (existing.length > 0) {
      return NextResponse.json({ message: "Already seeded", events: existing.length });
    }

    // Ensure default organization exists
    let orgId: string | null = null;
    try {
      const [org] = await db
        .insert(organizations)
        .values({
          name: "EventOS Global",
          slug: "default-org",
          plan: "pro",
        })
        .onConflictDoNothing()
        .returning();
      orgId = org?.id || null;
    } catch {}

    if (!orgId) {
      const orgs = await db.select().from(organizations).limit(1);
      if (orgs[0]) orgId = orgs[0].id;
    }

    // Seed users first
    for (const u of INITIAL_USERS) {
      try {
        await db
          .insert(users)
          .values({
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            avatar: u.avatar || "",
            organization: u.organization || "",
            organizationId: orgId,
            phone: u.phone || "",
            interests: u.interests || [],
          })
          .onConflictDoNothing();
      } catch {}
    }

    const now = Date.now();
    const [hack] = await db
      .insert(events)
      .values({
        name: "NEXATHON '26 — National Hackathon Finals",
        slug: "nexathon-26",
        type: "hackathon",
        tagline: "48 hours. 120 teams. One national champion.",
        description:
          "The national finale of Nexathon — India's largest student hackathon. 120 shortlisted teams build across AI, IoT, FinTech, HealthTech and GreenTech tracks in a 48-hour grand finale at the University Innovation Tower.",
        venue: "Innovation Tower, Hall A–C",
        city: "Bengaluru",
        organizationId: orgId,
        startsAt: new Date(now - 6 * 3600000),
        endsAt: new Date(now + 42 * 3600000),
        status: "live",
        bannerGradient: "from-violet-600 via-fuchsia-500 to-amber-400",
        categories: ["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech"],
      })
      .returning();

    const [expo] = await db
      .insert(events)
      .values({
        name: "Startup Expo & Tech Fest '26",
        slug: "startup-expo-26",
        type: "expo",
        tagline: "80 startup stalls · investors · 5,000 visitors",
        description:
          "The university's flagship startup exposition — 80 demo stalls, investor walkthroughs, live pitches and the Startup of the Year award decided by judges and the crowd.",
        venue: "Main Grounds & Convention Centre",
        city: "Hyderabad",
        organizationId: orgId,
        startsAt: new Date(now + 3 * 86400000),
        endsAt: new Date(now + 5 * 86400000),
        status: "upcoming",
        bannerGradient: "from-cyan-500 via-blue-600 to-violet-700",
        categories: ["AI/ML", "FinTech", "D2C", "AgriTech", "SpaceTech", "Robotics"],
      })
      .returning();

    const [conf] = await db
      .insert(events)
      .values({
        name: "FutureTech Conference & Awards",
        slug: "futuretech-conf",
        type: "conference",
        tagline: "Talks, panels & the Innovation Awards night",
        description:
          "A two-day conference with 30 speakers, research poster sessions and the annual Innovation Awards judged live on stage.",
        venue: "Auditorium Complex",
        city: "Chennai",
        organizationId: orgId,
        startsAt: new Date(now - 10 * 86400000),
        endsAt: new Date(now - 8 * 86400000),
        status: "ended",
        bannerGradient: "from-amber-400 via-orange-500 to-rose-600",
        categories: ["AI/ML", "Research", "Robotics", "Climate"],
      })
      .returning();

    const projectSeed = [
      {
        title: "MediQueue AI",
        category: "HealthTech",
        team: "PulseCoders",
        tech: ["Python", "TensorFlow", "React"],
        desc: "AI triage that cuts hospital OPD wait times by 63% using symptom-to-department routing and live token prediction.",
      },
      {
        title: "AgroSense Mesh",
        category: "IoT",
        team: "FieldBytes",
        tech: ["ESP32", "LoRa", "Next.js"],
        desc: "Solar mesh network of soil sensors giving small farmers hyperlocal irrigation alerts over SMS — no smartphone needed.",
      },
      {
        title: "CredScore Campus",
        category: "FinTech",
        team: "LedgerLabs",
        tech: ["Node.js", "PostgreSQL", "Plaid"],
        desc: "Alternative credit scoring for students using rent, gig and campus-payment history. 4,000 profiles scored in pilot.",
      },
      {
        title: "SignBridge",
        category: "AI/ML",
        team: "NeuralNest",
        tech: ["PyTorch", "MediaPipe", "Flutter"],
        desc: "Real-time sign-language to speech translator running fully on-device at 28fps. Supports 3 regional sign dialects.",
      },
      {
        title: "CarbonLedger",
        category: "GreenTech",
        team: "TerraForm",
        tech: ["Solidity", "React", "IPFS"],
        desc: "Verifiable carbon credits for campuses — every tree, solar panel and e-bus ride minted as auditable on-chain offsets.",
      },
      {
        title: "ExamPilot",
        category: "EdTech",
        team: "StudySquad",
        tech: ["OpenAI", "Next.js", "Supabase"],
        desc: "Personal AI examiner that generates adaptive mock tests from your own notes and predicts weak chapters.",
      },
      {
        title: "SwarmDrones",
        category: "IoT",
        team: "SkyForge",
        tech: ["ROS2", "PX4", "Python"],
        desc: "Autonomous drone swarm for warehouse stock-taking — 12 drones, one operator, 10x faster cycle counts.",
      },
      {
        title: "VoiceVault",
        category: "AI/ML",
        team: "EchoChamber",
        tech: ["Whisper", "FastAPI", "React"],
        desc: "Voice-first banking for visually impaired users with speaker verification and fraud-call detection.",
      },
    ];

    const firstNames = ["Aarav", "Diya", "Ishaan", "Kavya", "Arjun", "Meera", "Rohan", "Ananya", "Vikram", "Sanya", "Aditya", "Priya"];
    const lastNames = ["Sharma", "Iyer", "Khan", "Reddy", "Nair", "Gupta", "Das", "Menon", "Patel", "Rao"];
    const pick = () => `${rand(firstNames)} ${rand(lastNames)}`;

    const createdProjects: any[] = [];
    for (let i = 0; i < projectSeed.length; i++) {
      const p = projectSeed[i];
      const leader = pick();
      const [row] = await db
        .insert(projects)
        .values({
          eventId: hack.id,
          title: p.title,
          category: p.category,
          teamName: p.team,
          leaderName: leader,
          leaderEmail: `${p.team.toLowerCase()}@mail.com`,
          leaderPhone: `+91 98${ri(10000000, 99999999)}`,
          members: [leader, pick(), pick()].map((n) => ({ name: n, role: rand(["Dev", "Design", "ML", "Hardware"]) })),
          description: p.desc,
          techStack: p.tech,
          demoUrl: "https://demo.example.com",
          code: `PRJ-${["AX7K2Q", "BM9P41", "CX21D8", "DQ93FZ", "ER44LM", "FT78N2", "GX10P9", "HQ55T3"][i]}`,
          boothNo: `B-${i + 1}`,
          views: ri(80, 900),
          checkins: ri(20, 320),
          votes: ri(10, 240),
        })
        .returning();
      createdProjects.push(row);
    }

    const judgeSeed = [
      { name: "Dr. Anjali Rao", org: "ex-Google AI · Professor", exp: ["AI/ML", "NLP", "Python"] },
      { name: "Suresh Menon", org: "Sequoia Scout · FinTech", exp: ["FinTech", "Startups", "Product"] },
      { name: "Fatima Khan", org: "Bosch · IoT Lead", exp: ["IoT", "Embedded", "Hardware"] },
      { name: "Dr. Vikram Iyer", org: "Apollo Hospitals · Digital Health", exp: ["HealthTech", "AI/ML", "Data"] },
      { name: "Karthik Subramanian", org: "Zerodha · Climate Fund", exp: ["GreenTech", "Climate", "Finance"] },
    ];
    const judgeCodes = ["JUDGE-A1B2", "JUDGE-C3D4", "JUDGE-E5F6", "JUDGE-G7H8", "JUDGE-I9J0"];
    const createdJudges = [];
    for (let i = 0; i < judgeSeed.length; i++) {
      const j = judgeSeed[i];
      const [row] = await db
        .insert(judges)
        .values({
          eventId: hack.id,
          name: j.name,
          email: `judge${i + 1}@eventos.ai`,
          organization: j.org,
          expertise: j.exp,
          assignedCategories: [j.exp[0]],
          code: judgeCodes[i],
          avatarColor: rand([
            "from-violet-500 to-fuchsia-500",
            "from-cyan-500 to-blue-600",
            "from-amber-400 to-orange-600",
            "from-emerald-400 to-teal-600",
            "from-rose-500 to-red-600",
          ]),
        })
        .returning();
      createdJudges.push(row);
    }

    // Seed sample scores
    const criteriaKeys = ["innovation", "execution", "impact", "pitch"];
    for (const j of createdJudges) {
      const sample = [...createdProjects].sort(() => Math.random() - 0.5).slice(0, 5);
      for (const p of sample) {
        const cs: Record<string, number> = {};
        let total = 0;
        for (const k of criteriaKeys) {
          const v = ri(5, 10);
          cs[k] = v;
          total += v;
        }
        await db.insert(scores).values({
          eventId: hack.id,
          projectId: p.id,
          judgeId: j.id,
          criteriaScores: cs,
          total,
          weightedTotal: Math.round((cs.innovation * 1.2 + cs.execution + cs.impact + cs.pitch * 0.8) * 10),
          comment: rand([
            "Strong execution, tighten the GTM story.",
            "Impressive demo. Ask about scale costs.",
            "Novel approach — verify the benchmarks.",
            "Great pitch energy. Impact slide could be sharper.",
            "Top-3 contender in this track.",
          ]),
        });
      }
    }

    // Sample certificates with HMAC signatures
    for (let i = 0; i < 3; i++) {
      const p = createdProjects[i];
      const code = `CERT-${["WIN001", "FIN002", "FIN003"][i]}`;
      const role = i === 0 ? "winner" : "participant";
      const vHash = generateCertificateHMAC(code, p.leaderName, hack.id, role);

      await db.insert(certificates).values({
        eventId: hack.id,
        projectId: p.id,
        recipientName: p.leaderName,
        role,
        title: i === 0 ? "National Champion — Nexathon '26" : "National Finalist — Nexathon '26",
        code,
        verificationHash: vHash,
      });
    }

    return NextResponse.json({ message: "Seeded", events: [hack.id, expo.id, conf.id] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
