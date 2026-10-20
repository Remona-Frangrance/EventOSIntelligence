import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, projects, visitors, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore, UserRole } from "@/lib/demoData";
import { makeCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "visitor",
      organization = "",
      phone = "",
      interests = [],
      // Participant project fields:
      projectTitle,
      category = "AI/ML",
      teamName,
      projectDescription,
      techStack = [],
      imageUrl = "",
      demoUrl = "",
      repoUrl = "",
      members = [],
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingMem = memoryStore.getUserByEmail(cleanEmail);
    if (existingMem) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const userId = "usr-" + Math.random().toString(36).substring(2, 10);
    const validRole: UserRole = ["admin", "participant", "judge", "visitor"].includes(role)
      ? (role as UserRole)
      : "visitor";

    const userData: {
      id: string;
      name: string;
      email: string;
      password: string;
      role: UserRole;
      avatar: string;
      organization: string;
      phone: string;
      interests: string[];
      createdAt: string;
      projectId?: string;
    } = {
      id: userId,
      name,
      email: cleanEmail,
      password,
      role: validRole,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`,
      organization,
      phone,
      interests: Array.isArray(interests) ? interests : [],
      createdAt: new Date().toISOString(),
    };

    let createdProject = null;

    // 1. Try PostgreSQL DB first
    try {
      const [dbUser] = await db
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          avatar: userData.avatar,
          organization: userData.organization,
          phone: userData.phone,
          interests: userData.interests,
        })
        .returning();

      if (dbUser) {
        userData.id = dbUser.id;

        const evList = await db.select().from(events);
        const activeEvent = evList.find((e) => e.id === body.eventId) || evList.find((e) => e.status === "live") || evList[0];
        const targetEventId = activeEvent?.id || "9e33a337-5ba7-4c39-9265-426931e481af";

        // If participant registered with project details
        if (validRole === "participant" && (projectTitle || teamName)) {
          const prjCode = makeCode("PRJ");
          const [dbPrj] = await db
            .insert(projects)
            .values({
              eventId: targetEventId,
              userId: dbUser.id,
              title: projectTitle || `${teamName}'s Project`,
              category: category || "AI/ML",
              teamName: teamName || name,
              leaderName: name,
              leaderEmail: cleanEmail,
              leaderPhone: phone,
              members: members.length > 0 ? members : [{ name, role: "Lead" }],
              description: projectDescription || "",
              techStack: Array.isArray(techStack) ? techStack : [techStack].filter(Boolean),
              imageUrl: imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
              demoUrl: demoUrl || "",
              repoUrl: repoUrl || "",
              code: prjCode,
              status: "approved",
              boothNo: `B-${Math.floor(Math.random() * 50 + 10)}`,
            })
            .returning();
          createdProject = dbPrj;
        }

        // If visitor registered
        if (validRole === "visitor") {
          await db
            .insert(visitors)
            .values({
              eventId: targetEventId,
              userId: dbUser.id,
              name,
              email: cleanEmail,
              phone,
              type: "visitor",
              interests: userData.interests,
              code: makeCode("VIS", 5),
            })
            .returning();
        }
      }
    } catch {
      // PostgreSQL is offline - fall back to memoryStore
    }

    // Always keep memoryStore updated
    memoryStore.addUser(userData);

    if (validRole === "participant" && (projectTitle || teamName) && !createdProject) {
      const prjId = "p-" + Math.random().toString(36).substring(2, 9);
      const prjCode = makeCode("PRJ");
      const memPrj = {
        id: prjId,
        eventId: "ev-nexathon-26",
        userId: userData.id,
        title: projectTitle || `${teamName}'s Project`,
        category: category || "AI/ML",
        teamName: teamName || name,
        leaderName: name,
        leaderEmail: cleanEmail,
        leaderPhone: phone,
        members: members.length > 0 ? members : [{ name, role: "Lead" }],
        description: projectDescription || "",
        techStack: Array.isArray(techStack) ? techStack : [techStack].filter(Boolean),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
        demoUrl: demoUrl || "",
        repoUrl: repoUrl || "",
        code: prjCode,
        status: "approved",
        boothNo: `B-${Math.floor(Math.random() * 50 + 10)}`,
        views: 1,
        checkins: 0,
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      memoryStore.addProject(memPrj);
      userData.projectId = prjId;
      createdProject = memPrj;
    }

    if (validRole === "visitor") {
      memoryStore.addVisitor({
        id: "vis-" + Math.random().toString(36).substring(2, 8),
        eventId: "ev-nexathon-26",
        userId: userData.id,
        name,
        email: cleanEmail,
        phone,
        type: "visitor",
        interests: userData.interests,
        code: makeCode("VIS", 5),
        checkedIn: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatar: userData.avatar,
          interests: userData.interests,
          organization: userData.organization,
          phone: userData.phone,
          projectId: userData.projectId,
        },
        project: createdProject,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
