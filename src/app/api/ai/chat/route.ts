import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { chatVisitorAssistant } from "@/lib/llm";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { memoryStore } from "@/lib/demoData";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  const clientIp = getClientIp(req);

  // Rate limit: 30 chat messages per minute per IP
  const rateLimit = checkRateLimit(`chat:${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetInSec, "Chat rate limit reached. Please wait a moment.");
  }

  try {
    const body = await req.json();
    const { message, eventId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let allEventsList: any[] = [];
    let targetEvent: any = null;
    let eventProjects: any[] = [];

    try {
      allEventsList = await db.select().from(events);
    } catch {}

    if (!allEventsList || allEventsList.length === 0) {
      allEventsList = memoryStore.getEvents();
    }

    const mLower = message.toLowerCase();

    // Check if the query specifically refers to an event by keyword
    if (eventId) {
      targetEvent = allEventsList.find((e) => e.id === eventId);
    } else {
      // Intelligent event detection from prompt
      targetEvent = allEventsList.find((e) => {
        const nameMatch = e.name && mLower.includes(e.name.toLowerCase().split(" ")[0]);
        const slugMatch = e.slug && mLower.includes(e.slug.replace(/-\d+$/, "").toLowerCase());
        const keywordMatch =
          (mLower.includes("techmanjari") && (e.name?.toLowerCase().includes("techmanjari") || e.slug?.includes("techmanjari"))) ||
          (mLower.includes("nexathon") && (e.name?.toLowerCase().includes("nexathon") || e.slug?.includes("nexathon"))) ||
          (mLower.includes("expo") && (e.name?.toLowerCase().includes("expo") || e.slug?.includes("expo")));
        return nameMatch || slugMatch || keywordMatch;
      });

      // Default to first active or live event
      if (!targetEvent && allEventsList.length > 0) {
        targetEvent = allEventsList[0];
      }
    }

    // Retrieve projects for the detected/target event
    try {
      if (targetEvent?.id) {
        eventProjects = await db.select().from(projects).where(eq(projects.eventId, targetEvent.id));
      }
    } catch {}

    if ((!eventProjects || eventProjects.length === 0) && targetEvent?.id) {
      eventProjects = memoryStore.getProjects(targetEvent.id);
    }

    // If still empty, collect projects across all events
    if (!eventProjects || eventProjects.length === 0) {
      const allEvents = memoryStore.getEvents();
      eventProjects = allEvents.flatMap((ev) => memoryStore.getProjects(ev.id));
    }

    const eventName = targetEvent?.name || "EventOS Intelligence Platform";
    const venue = targetEvent?.venue || "Main Convention Hall";
    const categories: string[] = (targetEvent?.categories as string[]) || [
      "AI/ML",
      "IoT",
      "CyberSecurity",
      "FinTech",
      "HealthTech",
      "GreenTech",
      "Robotics",
    ];

    const reply = await chatVisitorAssistant({
      message,
      eventName,
      venue,
      projects: eventProjects.map((p) => ({
        title: p.title,
        category: p.category,
        boothNo: p.boothNo,
        teamName: p.teamName,
        techStack: (p.techStack as string[]) || [],
        description: p.description || "",
        votes: p.votes || 0,
      })),
      categories,
      allEvents: allEventsList.map((e) => ({
        id: e.id,
        name: e.name,
        venue: e.venue,
        city: e.city,
        status: e.status,
        categories: (e.categories as string[]) || [],
        tagline: e.tagline,
        description: e.description,
      })),
      targetEvent,
    });

    return NextResponse.json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { reply: "I'm having trouble retrieving booth details right now. Please explore the floor cards directly!" },
      { status: 200 }
    );
  }
}
