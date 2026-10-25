import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, projects, visitors, events, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore, UserRole } from "@/lib/demoData";
import { makeCode } from "@/lib/utils";
import { sendLoginSuccessEmail } from "@/lib/email";
import { createSessionToken, getSessionCookieOptions, SessionUser } from "@/lib/session";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { registerSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  const clientIp = getClientIp(req);

  // 1. Rate limiting: 5 registrations per 15 minutes per IP
  const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetInSec, "Too many registration attempts. Please wait.");
  }

  try {
    const rawBody = await req.json();

    // 2. Validate input with Zod
    const validation = validateBody(registerSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error, details: validation.details }, { status: 400 });
    }

    const {
      name,
      email,
      password,
      role = "visitor",
      organization = "",
      phone = "",
      interests = [],
      projectTitle,
      category = "AI/ML",
      teamName,
      projectDescription,
      techStack = [],
      imageUrl = "",
      demoUrl = "",
      repoUrl = "",
      videoUrl = "",
      members = [],
      eventId,
    } = validation.data;

    const cleanEmail = email.trim().toLowerCase();

    // 3. Check if user already exists — with 5s timeout to avoid blocking on cold DB
    try {
      const existingCheck = await Promise.race([
        db.select().from(users).where(eq(users.email, cleanEmail)),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (existingCheck && Array.isArray(existingCheck) && existingCheck[0]) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
    } catch {
      // DB check failed — let the insert proceed; it will fail on unique constraint if duplicate
    }

    if (!isProduction) {
      const existingMem = memoryStore.getUserByEmail(cleanEmail);
      if (existingMem) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
    }

    const validRole: UserRole = ["admin", "participant", "judge", "visitor"].includes(role)
      ? (role as UserRole)
      : "visitor";

    // 4. Resolve Organization ID
    let orgId: string | null = null;
    try {
      const orgRows = await db.select({ id: organizations.id }).from(organizations).limit(1);
      if (orgRows[0]?.id) orgId = orgRows[0].id;
    } catch {}

    let createdUser: any = null;
    let createdProject: any = null;

    // 5. Try DB insertion
    try {
      const [dbUser] = await db
        .insert(users)
        .values({
          name,
          email: cleanEmail,
          password,
          role: validRole,
          organizationId: orgId,
          avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`,
          organization,
          phone,
          interests: Array.isArray(interests) ? interests : [],
        })
        .returning();

      if (dbUser) {
        createdUser = dbUser;

        const evList = await db.select().from(events);
        const activeEvent =
          (eventId && evList.find((e) => e.id === eventId)) ||
          evList.find((e) => e.status === "live") ||
          evList[0];
        const targetEventId = activeEvent?.id || "9e33a337-5ba7-4c39-9265-426931e481af";

        // If participant registered with project details
        if (validRole === "participant" && (projectTitle || teamName)) {
          let finalVideoUrl = videoUrl || "";
          if (finalVideoUrl.startsWith("data:video/") && finalVideoUrl.includes(";base64,")) {
            try {
              const matches = finalVideoUrl.match(/^data:video\/([a-zA-Z0-9]+);base64,(.+)$/);
              if (matches) {
                const ext = matches[1] || "mp4";
                const buffer = Buffer.from(matches[2], "base64");
                if (isCloudinaryConfigured) {
                  try {
                    const cRes = await uploadToCloudinary(buffer, {
                      folder: "eventos_media",
                      resource_type: "video",
                      filename: `vid-${Date.now()}.${ext}`,
                    });
                    finalVideoUrl = cRes.url;
                  } catch (cErr) {
                    console.warn("Cloudinary video upload failed, falling back to disk:", cErr);
                  }
                }
                if (finalVideoUrl.startsWith("data:")) {
                  const uploadsDir = path.join(process.cwd(), "public", "uploads");
                  await mkdir(uploadsDir, { recursive: true });
                  const fileName = `vid-${Date.now()}.${ext}`;
                  await writeFile(path.join(uploadsDir, fileName), buffer);
                  finalVideoUrl = `/uploads/${fileName}`;
                }
              }
            } catch {}
          }

          let finalImageUrl = imageUrl || "";
          if (finalImageUrl.startsWith("data:image/") && finalImageUrl.includes(";base64,")) {
            try {
              const matches = finalImageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
              if (matches) {
                const ext = matches[1] || "jpg";
                const buffer = Buffer.from(matches[2], "base64");
                if (isCloudinaryConfigured) {
                  try {
                    const cRes = await uploadToCloudinary(buffer, {
                      folder: "eventos_media",
                      resource_type: "image",
                      filename: `img-${Date.now()}.${ext}`,
                    });
                    finalImageUrl = cRes.url;
                  } catch (cErr) {
                    console.warn("Cloudinary image upload failed, falling back to disk:", cErr);
                  }
                }
                if (finalImageUrl.startsWith("data:")) {
                  const uploadsDir = path.join(process.cwd(), "public", "uploads");
                  await mkdir(uploadsDir, { recursive: true });
                  const fileName = `img-${Date.now()}.${ext}`;
                  await writeFile(path.join(uploadsDir, fileName), buffer);
                  finalImageUrl = `/uploads/${fileName}`;
                }
              }
            } catch {}
          }

          const prjCode = makeCode("PRJ");
          const [dbPrj] = await db
            .insert(projects)
            .values({
              eventId: targetEventId,
              userId: dbUser.id,
              title: projectTitle || `${teamName || name}'s Project`,
              category: category || "AI/ML",
              teamName: teamName || name,
              leaderName: name,
              leaderEmail: cleanEmail,
              leaderPhone: phone,
              members: members.length > 0 ? members : [{ name, role: "Lead" }],
              description: projectDescription || "",
              techStack: Array.isArray(techStack) ? techStack : [techStack].filter(Boolean),
              imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
              demoUrl: demoUrl || "",
              repoUrl: repoUrl || "",
              videoUrl: finalVideoUrl || "",
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
              interests: Array.isArray(interests) ? interests : [],
              code: makeCode("VIS", 5),
            })
            .returning();
        }
      }
    } catch (err) {
      if (isProduction) {
        return NextResponse.json({ error: "Failed to persist user registration in database" }, { status: 500 });
      }
    }

    // Fallback to memoryStore in non-production only
    if (!createdUser && !isProduction) {
      const mockUserId = "usr-" + Math.random().toString(36).substring(2, 10);
      const memUser = {
        id: mockUserId,
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
      memoryStore.addUser(memUser);
      createdUser = memUser;
    }

    if (!createdUser) {
      return NextResponse.json({ error: "Registration could not be completed" }, { status: 500 });
    }

    // Build session user
    const sessionUser: SessionUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role as SessionUser["role"],
      avatar: createdUser.avatar,
      organizationId: createdUser.organizationId || orgId,
      organization: createdUser.organization,
      projectId: createdProject?.id,
    };

    // Generate JWT and set httpOnly cookie — respond immediately
    const sessionToken = await createSessionToken(sessionUser);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json(
      {
        success: true,
        user: sessionUser,
        project: createdProject,
        emailNotification: { sent: true, to: cleanEmail },
      },
      { status: 201 }
    );

    response.cookies.set({
      ...cookieOptions,
      value: sessionToken,
    });

    // Fire-and-forget: audit log + welcome email must NOT block the registration response
    logAudit({
      organizationId: sessionUser.organizationId,
      userId: sessionUser.id,
      actorEmail: sessionUser.email,
      actorRole: sessionUser.role,
      action: "USER_REGISTER",
      targetType: "user",
      targetId: sessionUser.id,
      details: { role: validRole },
      ipAddress: clientIp,
    }).catch(() => {});
    sendLoginSuccessEmail({
      to: cleanEmail,
      name,
      role: validRole,
    }).catch(() => {});

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
