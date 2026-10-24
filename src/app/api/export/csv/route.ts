import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, projects, scores, visitors, feedbacks, sponsors, sponsorLeads, judges } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  let str = typeof val === "object" ? JSON.stringify(val) : String(val);
  str = str.replace(/"/g, '""');
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str}"`;
  }
  return str;
}

export async function GET(req: Request) {
  const auth = await requireAuth(req, ["admin"]);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const type = searchParams.get("type") || "leaderboard";

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    const evList = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const ev = evList[0];
    const eventSlug = ev ? ev.slug : "event";

    let csvContent = "";
    let filename = `${eventSlug}-${type}.csv`;

    if (type === "leaderboard") {
      const projs = await db.select().from(projects).where(eq(projects.eventId, eventId)).orderBy(desc(projects.votes));
      const scList = await db.select().from(scores).where(eq(scores.eventId, eventId));

      const headers = ["Rank", "Project Title", "Category", "Team Name", "Leader Name", "Leader Email", "Booth No", "Project Code", "Average Score", "Total Reviews", "Crowd Votes", "Gate Check-ins", "Views"];
      const rows = projs.map((p, idx) => {
        const pScores = scList.filter((s) => s.projectId === p.id);
        const avg = pScores.length ? Math.round((pScores.reduce((acc, s) => acc + (s.weightedTotal || s.total * 10), 0) / pScores.length) / 10 * 10) / 10 : 0;
        return [
          idx + 1,
          p.title,
          p.category,
          p.teamName,
          p.leaderName,
          p.leaderEmail,
          p.boothNo,
          p.code,
          avg,
          pScores.length,
          p.votes,
          p.checkins,
          p.views,
        ].map(escapeCSV).join(",");
      });

      csvContent = [headers.join(","), ...rows].join("\n");
    } else if (type === "attendees") {
      const visList = await db.select().from(visitors).where(eq(visitors.eventId, eventId)).orderBy(desc(visitors.createdAt));
      const headers = ["Full Name", "Email Address", "Phone", "Pass Type", "Badge Code", "Checked In", "Check-in Timestamp", "Registered At"];
      const rows = visList.map((v) => [
        v.name,
        v.email,
        v.phone,
        v.type,
        v.code,
        v.checkedIn ? "YES" : "NO",
        v.checkinAt ? new Date(v.checkinAt).toLocaleString() : "Not Checked In",
        new Date(v.createdAt).toLocaleString(),
      ].map(escapeCSV).join(","));

      csvContent = [headers.join(","), ...rows].join("\n");
    } else if (type === "scores") {
      const scList = await db.select().from(scores).where(eq(scores.eventId, eventId)).orderBy(desc(scores.createdAt));
      const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));
      const jdList = await db.select().from(judges).where(eq(judges.eventId, eventId));

      const headers = ["Evaluation ID", "Project Title", "Category", "Booth", "Judge Name", "Judge Organization", "Total Score", "Weighted Score", "Rubric Breakdown", "Flagged Anomaly", "Flag Reason", "Comment", "Timestamp"];
      const rows = scList.map((s) => {
        const prj = projs.find((p) => p.id === s.projectId);
        const jd = jdList.find((j) => j.id === s.judgeId);
        return [
          s.id,
          prj?.title || "Unknown",
          prj?.category || "",
          prj?.boothNo || "",
          jd?.name || "Anonymous",
          jd?.organization || "",
          s.total,
          s.weightedTotal ? s.weightedTotal / 10 : s.total,
          JSON.stringify(s.criteriaScores),
          s.flagged ? "FLAGGED" : "CLEAN",
          s.flagReason,
          s.comment,
          new Date(s.createdAt).toLocaleString(),
        ].map(escapeCSV).join(",");
      });

      csvContent = [headers.join(","), ...rows].join("\n");
    } else if (type === "feedback") {
      const fbList = await db.select().from(feedbacks).where(eq(feedbacks.eventId, eventId)).orderBy(desc(feedbacks.createdAt));
      const projs = await db.select().from(projects).where(eq(projects.eventId, eventId));

      const headers = ["Author Name", "Author Role", "Booth Project", "Rating (1-5)", "Sentiment", "Message", "Timestamp"];
      const rows = fbList.map((f) => {
        const prj = projs.find((p) => p.id === f.projectId);
        return [
          f.authorName,
          f.authorRole,
          prj?.title || "General Event",
          f.rating,
          f.sentiment,
          f.message,
          new Date(f.createdAt).toLocaleString(),
        ].map(escapeCSV).join(",");
      });

      csvContent = [headers.join(","), ...rows].join("\n");
    } else if (type === "sponsors") {
      const sponList = await db.select().from(sponsors).where(eq(sponsors.eventId, eventId));
      const leads = await db.select().from(sponsorLeads).where(eq(sponsorLeads.eventId, eventId));

      const headers = ["Sponsor Name", "Partnership Tier", "Booth No", "Contact Email", "Access Passcode", "Booth Views", "Total Leads Captured", "Website URL"];
      const rows = sponList.map((s) => {
        const leadCount = leads.filter((l) => l.sponsorId === s.id).length;
        return [
          s.name,
          s.tier.toUpperCase(),
          s.boothNo,
          s.contactEmail,
          s.passcode,
          s.views,
          leadCount,
          s.website,
        ].map(escapeCSV).join(",");
      });

      csvContent = [headers.join(","), ...rows].join("\n");
    } else {
      return NextResponse.json({ error: `Unknown export type "${type}"` }, { status: 400 });
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate CSV export" }, { status: 500 });
  }
}
