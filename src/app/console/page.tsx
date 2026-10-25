"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import QrCode from "@/components/QrCode";
import {
  LayoutDashboard,
  FolderKanban,
  Gavel,
  Trophy,
  Users,
  Award,
  MessagesSquare,
  Plus,
  QrCode as QrIcon,
  ShieldAlert,
  Sparkles,
  Download,
  X,
  CheckCircle2,
  ScanLine,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Printer,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Zap,
  Compass,
  Scale,
  FileText,
  BarChart3,
  FileDown,
  Briefcase,
  CreditCard,
  UploadCloud,
  FileSpreadsheet,
  Copy,
  Ticket,
  MapPin,
} from "lucide-react";
import FloorPlanViewer from "@/components/FloorPlanViewer";

type Event = {
  id: string;
  name: string;
  slug?: string;
  type: string;
  status: string;
  scoringCriteria: { key: string; label: string; max: number; weight: number }[];
  categories: string[];
  venue: string;
  city: string;
};

type Project = {
  id: string;
  title: string;
  category: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  code: string;
  boothNo: string;
  views: number;
  checkins: number;
  votes: number;
  status: string;
  description: string;
  techStack: string[];
};

type Judge = {
  id: string;
  name: string;
  organization: string;
  expertise: string[];
  code: string;
  avatarColor: string;
};

type ScoreRow = {
  id: string;
  projectId: string;
  judgeId: string;
  criteriaScores: Record<string, number>;
  total: number;
  comment: string;
  flagged: boolean;
  flagReason: string;
  createdAt: string;
};

const tabs = [
  { k: "overview", label: "Overview", icon: LayoutDashboard },
  { k: "floor_plans", label: "Floor Plans", icon: MapPin },
  { k: "ai_insights", label: "AI Insights", icon: Sparkles },
  { k: "projects", label: "Projects", icon: FolderKanban },
  { k: "judges", label: "Judges + AI", icon: Gavel },
  { k: "scoring", label: "Live Scoring", icon: Trophy },
  { k: "sponsors", label: "Sponsors & Leads", icon: Briefcase },
  { k: "monetization", label: "Tickets & Sales", icon: CreditCard },
  { k: "visitors", label: "Visitors", icon: Users },
  { k: "certs", label: "Certificates", icon: Award },
  { k: "feedback", label: "Feedback AI", icon: MessagesSquare },
  { k: "audit", label: "Audit Trail", icon: ShieldCheck },
];

function ConsoleInner() {
  const { user, loading: authLoading, quickLogin } = useAuth();
  const sp = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState(sp.get("event") || "");
  const [tab, setTab] = useState("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [board, setBoard] = useState<(Project & { avgScore: number; judgeCount: number; flags: number })[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [visitors, setVisitors] = useState<{ id: string; name: string; type: string; code: string; checkedIn: boolean; interests: string[] }[]>([]);
  const [certs, setCerts] = useState<{ id: string; recipientName: string; role: string; title: string; code: string; issuedAt: string }[]>([]);
  const [feedback, setFeedback] = useState<{ id: string; authorName: string; authorRole: string; rating: number; message: string; sentiment: string; createdAt: string }[]>([]);
  const [analytics, setAnalytics] = useState<{ totals: Record<string, number>; byCategory: Record<string, number>; hourly: Record<string, number>; topProjects: { title: string; team: string; views: number; checkins: number }[]; sentiment: Record<string, number>; recentScans: { id: string; visitorCode: string; createdAt: string }[] } | null>(null);
  const [aiSummary, setAiSummary] = useState<{ headline: string; score: number; positive: number; negative: number; neutral: number; keywords: { word: string; count: number }[] } | null>(null);
  const [matchMatrix, setMatchMatrix] = useState<{ projectId: string; title: string; category: string; topJudges: { judgeId: string; judgeName: string; score: number; reasons: string[] }[] }[]>([]);
  const [qrProject, setQrProject] = useState<Project | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<{ id: string; name: string; description: string; booths: any[] }[]>([]);
  const [layoutSource, setLayoutSource] = useState<"blank" | "template" | "copy">("blank");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedCopyEventId, setSelectedCopyEventId] = useState("");
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [demoSigningIn, setDemoSigningIn] = useState(false);
  const [auditLogsList, setAuditLogsList] = useState<{
    id: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    details: Record<string, any>;
    ipAddress: string;
    createdAt: string;
  }[]>([]);
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastLivePulse, setLastLivePulse] = useState<string | null>(null);
  const [livePulseData, setLivePulseData] = useState<{
    checkedInCount?: number;
    totalVisitors?: number;
    totalScores?: number;
    totalScans?: number;
  } | null>(null);
  const liveConnectedRef = useRef(false);

  const [insights, setInsights] = useState<{
    scoreDistribution: Record<string, number>;
    biasAlerts: {
      id: string;
      judgeName: string;
      projectTitle: string;
      type: "harshness" | "generosity" | "outlier";
      severity: "high" | "medium";
      details: string;
      score: number;
    }[];
    judgeStrictness: {
      judgeId: string;
      name: string;
      organization: string;
      count: number;
      avgScore: number;
      delta: number;
      status: "harsh" | "lenient" | "balanced";
    }[];
    peakHours: {
      peakHour: string;
      peakVolume: number;
      hourlyDistribution: Record<string, number>;
    };
    boothTraffic: {
      topVisited: { projectId: string; title: string; boothNo: string; count: number }[];
      leastVisited: { projectId: string; title: string; boothNo: string; count: number }[];
      totalScansRecorded: number;
    };
    securityAlerts: {
      type: string;
      severity: string;
      message: string;
      entityId: string;
      timestamp: string;
    }[];
    overallMean: number;
    totalEvaluations: number;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [report, setReport] = useState<{
    executiveSummary: string;
    keyAchievements: string[];
    topProjectsHighlights: {
      title: string;
      category: string;
      team: string;
      whyOutstanding: string;
    }[];
    feedbackThemes: {
      theme: string;
      sentiment: "positive" | "negative" | "neutral";
      insight: string;
    }[];
    footfallInsights: string;
    recommendations: string[];
    organizerNotes: string;
    generatedBy: string;
    timestamp: string;
  } | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  async function loadInsights(id?: string) {
    const targetId = id || eventId;
    if (!targetId) return;
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/ai/insights/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch {}
    setInsightsLoading(false);
  }

  async function generateExecutiveReport() {
    if (!eventId) return;
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/ai/report/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        flash("AI Executive Report generated successfully!");
      } else {
        const err = await res.json();
        flash(`Failed to generate report: ${err.error || "Unknown error"}`);
      }
    } catch {
      flash("Error generating executive report");
    } finally {
      setGeneratingReport(false);
    }
  }

  function downloadReportMarkdown(r: NonNullable<typeof report>) {
    const content = `# Executive Post-Event Intelligence Report
**Event:** ${ev?.name || "Event"}
**Generated by:** ${r.generatedBy}
**Date:** ${new Date(r.timestamp).toLocaleString()}

## 1. Executive Summary
${r.executiveSummary}

## 2. Key Achievements
${r.keyAchievements.map((a) => `- ${a}`).join("\n")}

## 3. Top Projects Highlights
${r.topProjectsHighlights
  .map(
    (p) => `### ${p.title} (${p.category}) — Team ${p.team}
*Why Outstanding:* ${p.whyOutstanding}
`
  )
  .join("\n")}

## 4. Attendee Sentiment & Feedback Themes
${r.feedbackThemes
  .map((t) => `- **[${t.sentiment.toUpperCase()}] ${t.theme}:** ${t.insight}`)
  .join("\n")}

## 5. Footfall & Crowd Flow Telemetry
${r.footfallInsights}

## 6. Strategic Recommendations
${r.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

## 7. Organizer Notes
${r.organizerNotes}
`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(ev?.name || "event").toLowerCase().replace(/\s+/g, "-")}-executive-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadAuditLogs(id?: string) {
    setAuditLoading(true);
    try {
      const url = id ? `/api/audit-logs?eventId=${id}&limit=100` : `/api/audit-logs?limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAuditLogsList(data);
      }
    } catch {}
    setAuditLoading(false);
  }

  const ev = useMemo(() => {
    if (!events.length) return null;
    return events.find((e) => e.id === eventId) || events[0];
  }, [events, eventId]);

  async function loadEvents(preferredId?: string) {
    try {
      const r = await fetch(`/api/events?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const d = await r.json();
      if (Array.isArray(d)) {
        setEvents(d);
        if (preferredId) {
          setEventId(preferredId);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/console?event=${preferredId}`);
          }
        } else if (!eventId && d.length) {
          const initId = sp.get("event") || d[0].id;
          setEventId(initId);
        } else if (eventId && !d.some((item) => item.id === eventId) && d.length) {
          setEventId(d[0].id);
        }
        return d;
      }
    } catch (err) {
      console.error("Failed to load events", err);
    }
    return [];
  }

  async function loadAll(id: string) {
    if (!id) return;
    setLoading(true);

    // Phase 1: Load essential data needed for Overview tab first
    const [p, j, b, a] = await Promise.all([
      fetch(`/api/projects?eventId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/judges?eventId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/leaderboard/${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/analytics/${id}`).then((r) => r.json()).catch(() => null),
    ]);
    setProjects(p || []);
    setJudges(j || []);
    setBoard(b || []);
    setAnalytics(a || null);
    setLoading(false); // Show the UI immediately after essential data

    // Phase 2: Load secondary data in background (non-blocking)
    Promise.all([
      fetch(`/api/scores?eventId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/visitors?eventId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/certificates?eventId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/feedback?eventId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/ai/summary/${id}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/ai/match?eventId=${id}`).then((r) => r.json()).catch(() => null),
    ]).then(([s, v, c, f, ai, m]) => {
      setScores(s || []);
      setVisitors(v || []);
      setCerts(c || []);
      setFeedback(f || []);
      setAiSummary(ai || null);
      setMatchMatrix(m?.matrix || []);
    }).catch(() => {});

    loadInsights(id);
    loadSponsors(id);
    loadOrders(id);
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (eventId && user?.role === "admin") {
      loadAll(eventId);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (!eventId || tab !== "scoring") return;

    let es: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      es = new EventSource(`/api/realtime/${eventId}`);
      es.onopen = () => {
        setIsLiveConnected(true);
        liveConnectedRef.current = true;
      };
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.leaderboard) {
            setBoard(data.leaderboard);
            setLivePulseData({
              checkedInCount: data.checkedInCount,
              totalVisitors: data.totalVisitors,
              totalScores: data.totalScores,
              totalScans: data.totalScans,
            });
            setLastLivePulse(new Date().toLocaleTimeString());
          }
        } catch {}
      };
      es.onerror = () => {
        setIsLiveConnected(false);
        liveConnectedRef.current = false;
      };
    } catch {
      setIsLiveConnected(false);
      liveConnectedRef.current = false;
    }

    // Refresh scores stream and fallback board if disconnected
    fallbackInterval = setInterval(async () => {
      try {
        const s = await fetch(`/api/scores?eventId=${eventId}`).then((r) => r.json());
        if (Array.isArray(s)) setScores(s);
        if (!liveConnectedRef.current) {
          const b = await fetch(`/api/leaderboard/${eventId}`).then((r) => r.json());
          if (Array.isArray(b)) setBoard(b);
        }
      } catch {}
    }, 5000);

    return () => {
      if (es) {
        es.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      setIsLiveConnected(false);
      liveConnectedRef.current = false;
    };
  }, [eventId, tab]);

  useEffect(() => {
    if (tab === "audit" && user?.role === "admin") {
      loadAuditLogs(eventId);
    }
  }, [tab, eventId, user]);

  useEffect(() => {
    if (tab === "ai_insights" && eventId && user?.role === "admin") {
      loadInsights(eventId);
    }
  }, [tab, eventId, user]);

  // Phase 3: Sponsors, Monetization & Bulk Import state
  const [sponsorsList, setSponsorsList] = useState<
    {
      id: string;
      name: string;
      tier: string;
      boothNo: string;
      website: string;
      brochureUrl: string;
      contactEmail: string;
      passcode: string;
      leadCount: number;
      views: number;
    }[]
  >([]);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [creatingSponsor, setCreatingSponsor] = useState(false);

  const [ordersList, setOrdersList] = useState<
    {
      id: string;
      tierName: string;
      amount: number;
      currency: string;
      status: string;
      paymentProvider: string;
      buyerName: string;
      buyerEmail: string;
      createdAt: string;
    }[]
  >([]);
  const [ordersSummary, setOrdersSummary] = useState<{
    totalOrders: number;
    paidCount: number;
    grossRevenue: number;
    currency: string;
    tierBreakdown: Record<string, { count: number; revenue: number }>;
  } | null>(null);

  const [showBulkProjectModal, setShowBulkProjectModal] = useState(false);
  const [showBulkJudgeModal, setShowBulkJudgeModal] = useState(false);
  const [bulkProjectText, setBulkProjectText] = useState("");
  const [bulkJudgeText, setBulkJudgeText] = useState("");
  const [importingBulk, setImportingBulk] = useState(false);
  const [showGateQrModal, setShowGateQrModal] = useState(false);
  const [copiedGateUrl, setCopiedGateUrl] = useState(false);

  async function loadSponsors(id?: string) {
    const targetId = id || eventId;
    if (!targetId) return;
    try {
      const res = await fetch(`/api/sponsors?eventId=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSponsorsList(data);
      }
    } catch {}
  }

  async function createSponsor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) return;
    setCreatingSponsor(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: fd.get("name"),
          tier: fd.get("tier"),
          boothNo: fd.get("boothNo"),
          website: fd.get("website"),
          contactEmail: fd.get("contactEmail"),
          passcode: fd.get("passcode"),
        }),
      });
      if (res.ok) {
        setShowSponsorModal(false);
        loadSponsors(eventId);
        flash("Partner onboarded with booth terminal access!");
      } else {
        const err = await res.json();
        flash(err.error || "Failed to onboard partner");
      }
    } catch {
      flash("Network error onboarding partner");
    } finally {
      setCreatingSponsor(false);
    }
  }

  async function loadOrders(id?: string) {
    const targetId = id || eventId;
    if (!targetId) return;
    try {
      const res = await fetch(`/api/orders?eventId=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data.orders || []);
        setOrdersSummary(data.summary || null);
      }
    } catch {}
  }

  async function handleBulkProjectImport() {
    if (!eventId || !bulkProjectText.trim()) return;
    setImportingBulk(true);
    try {
      const lines = bulkProjectText.trim().split("\n").filter(Boolean);
      const projectRows = [];
      const startIndex = lines[0].toLowerCase().includes("title") ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length >= 3) {
          projectRows.push({
            title: cols[0],
            category: cols[1] || "AI/ML",
            teamName: cols[2] || `Team ${cols[0]}`,
            leaderName: cols[3] || "Lead Engineer",
            leaderEmail: cols[4] || "",
            boothNo: cols[5] || "",
            description: cols[6] || "",
          });
        }
      }

      if (!projectRows.length) {
        flash("No valid rows detected. Format: title,category,teamName,leaderName,leaderEmail,boothNo");
        setImportingBulk(false);
        return;
      }

      const res = await fetch("/api/import/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, projects: projectRows }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowBulkProjectModal(false);
        setBulkProjectText("");
        loadAll(eventId);
        flash(`Successfully imported ${data.importedCount} project teams!`);
      } else {
        const err = await res.json();
        flash(err.error || "Failed to import projects");
      }
    } catch {
      flash("Error parsing project CSV");
    } finally {
      setImportingBulk(false);
    }
  }

  async function handleBulkJudgeImport() {
    if (!eventId || !bulkJudgeText.trim()) return;
    setImportingBulk(true);
    try {
      const lines = bulkJudgeText.trim().split("\n").filter(Boolean);
      const judgeRows = [];
      const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length >= 1) {
          judgeRows.push({
            name: cols[0],
            email: cols[1] || "",
            organization: cols[2] || "Jury Panel",
            expertise: cols[3] ? cols[3].split(";").map((s) => s.trim()) : ["General"],
          });
        }
      }

      if (!judgeRows.length) {
        flash("No valid rows detected. Format: name,email,organization,expertise");
        setImportingBulk(false);
        return;
      }

      const res = await fetch("/api/import/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, judges: judgeRows }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowBulkJudgeModal(false);
        setBulkJudgeText("");
        loadAll(eventId);
        flash(`Successfully imported ${data.importedCount} jury members!`);
      } else {
        const err = await res.json();
        flash(err.error || "Failed to import jury members");
      }
    } catch {
      flash("Error parsing jury CSV");
    } finally {
      setImportingBulk(false);
    }
  }

  useEffect(() => {
    if (tab === "sponsors" && eventId && user?.role === "admin") {
      loadSponsors(eventId);
    }
  }, [tab, eventId, user]);

  useEffect(() => {
    if (tab === "monetization" && eventId && user?.role === "admin") {
      loadOrders(eventId);
    }
  }, [tab, eventId, user]);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(""), 3500);
  }

  async function handleDemoAdminLogin() {
    setDemoSigningIn(true);
    try {
      await quickLogin("admin@nexathon.com", "admin123");
    } finally {
      setDemoSigningIn(false);
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch("/api/floor-templates");
      if (res.ok) {
        const data = await res.json();
        setAvailableTemplates(data || []);
        if (data && data.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(data[0].id);
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (showEventModal) {
      loadTemplates();
      if (events.length > 0 && !selectedCopyEventId) {
        setSelectedCopyEventId(events[0].id);
      }
    }
  }, [showEventModal, events]);

  async function createEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (creatingEvent) return;
    setCreatingEvent(true);
    try {
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get("name") || "").trim();
      const city = String(fd.get("city") || "").trim();
      const venue = String(fd.get("venue") || "").trim();
      const tagline = String(fd.get("tagline") || "").trim();
      const description = String(fd.get("description") || "").trim();
      const type = String(fd.get("type") || "hackathon").trim();

      if (!name || !city || !venue || !tagline || !description) {
        flash("All fields (name, type, city, venue, tagline, description) are required.");
        setCreatingEvent(false);
        return;
      }

      const templateId = layoutSource === "template" && selectedTemplateId ? selectedTemplateId : undefined;
      const copyFromEventId = layoutSource === "copy" && selectedCopyEventId ? selectedCopyEventId : undefined;

      const r = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          tagline,
          description,
          venue,
          city,
          categories: ["AI/ML", "HealthTech", "FinTech", "CleanTech", "Open Innovation"],
          scoringCriteria: [
            { key: "innovation", label: "Innovation & Novelty", max: 25, weight: 1 },
            { key: "tech", label: "Technical Execution", max: 25, weight: 1 },
            { key: "impact", label: "Impact & Viability", max: 25, weight: 1 },
            { key: "design", label: "UX & Presentation", max: 25, weight: 1 },
          ],
          templateId,
          copyFromEventId,
        }),
      });
      const d = await r.json();

      if (!r.ok || !d?.id) {
        flash(d?.error || "Error creating event. Check parameters.");
        setCreatingEvent(false);
        return;
      }

      // Optimistically inject the new event so the dropdown and active pill update immediately
      setEvents((prev) => [d, ...prev.filter((item) => item.id !== d.id)]);
      setEventId(d.id);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/console?event=${d.id}`);
      }

      setShowEventModal(false);
      setLayoutSource("blank");
      setShowGateQrModal(true);
      flash(`Event "${d.name}" created successfully! Entrance Gate QR code is ready.`);

      // Sync backend event list and load telemetry for the new event
      await loadEvents(d.id);
      loadAll(d.id);
    } catch {
      flash("Error creating event. Check parameters.");
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleEndEvent(id: string) {
    if (!confirm("Officially end this event ceremony? This will finalize judging results and immediately unlock participation certificates for all registered teams.")) return;
    try {
      const res = await fetch(`/api/certificates/auto-issue?eventId=${id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        flash(data.message || "Event ceremony concluded! Participant certificates are now unlocked.");
        loadAll(id);
      } else {
        flash(data.error || "Failed to conclude event.");
      }
    } catch {
      flash("Network error while concluding event.");
    }
  }

  async function handleReopenEvent(id: string) {
    if (!confirm("Reopen this event for live scoring and check-ins?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live" }),
      });
      if (res.ok) {
        flash("Event reopened to live status.");
        loadAll(id);
      } else {
        flash("Failed to reopen event.");
      }
    } catch {
      flash("Network error while reopening event.");
    }
  }

  async function createJudge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/judges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        name: fd.get("name"),
        organization: fd.get("org"),
        email: fd.get("email"),
        expertise: String(fd.get("expertise") || "").split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const d = await r.json();
    setShowJudgeModal(false);
    loadAll(eventId);
    flash(`Judge onboarded with passcode: ${d.code}`);
  }

  async function issueCert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, recipientName: fd.get("name"), role: fd.get("role"), title: fd.get("title") }),
    });
    setShowCertModal(false);
    loadAll(eventId);
    flash("Certificate issued with verifiable QR");
  }

  async function bulkCertifyTop3() {
    const top = board.slice(0, 3);
    if (!top.length) return;
    const medals = ["Champion", "1st Runner-up", "2nd Runner-up"];
    await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        top.map((p, i) => ({
          eventId,
          projectId: p.id,
          recipientName: `${p.teamName} — ${p.leaderName}`,
          role: "winner",
          title: `${medals[i]} · ${p.title}`,
        }))
      ),
    });
    loadAll(eventId);
    flash("Top-3 winner certificates issued");
  }

  const maxHour = Math.max(1, ...Object.values(analytics?.hourly || { x: 1 }));
  const maxCat = Math.max(1, ...Object.values(analytics?.byCategory || { x: 1 }));

  if (authLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-600 shadow-sm animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Verifying Organizer OS session…</span>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-32">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 md:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-slate-900 md:text-3xl">
            Organizer Mission Control
          </h1>
          <p className="mt-2.5 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {user ? (
              <>
                You are currently signed in as <strong className="text-slate-900">{user.name}</strong> with the{" "}
                <span className="rounded bg-slate-100 px-2 py-0.5 text-indigo-700 font-semibold text-xs capitalize">
                  {user.role}
                </span>{" "}
                role. Managing events, judges, scoring, and certificates requires Platform Administrator credentials.
              </>
            ) : (
              <>
                Administrator credentials are required to operate event telemetry, AI judge matching, and master scoring.
              </>
            )}
          </p>

          {/* 1-Click Demo Login to instantly access full flow */}
          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-left max-w-md mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-900 mb-1">
              One-Click Evaluator Sign-In
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Click below to immediately log in as Chief Organizer (Alex Vance) and unlock all platform capabilities:
            </p>

            <button
              type="button"
              onClick={handleDemoAdminLogin}
              disabled={demoSigningIn}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {demoSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entering Mission Control…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>1-Click Sign In as Chief Admin (Alex Vance)</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {user?.role === "judge" && (
              <Link
                href="/judge"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Go to Jury Portal
              </Link>
            )}
            {user?.role === "participant" && (
              <Link
                href="/participant"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Go to Participant Dashboard
              </Link>
            )}
            {user?.role === "visitor" && (
              <Link
                href="/visitor"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Go to Explore Feed
              </Link>
            )}
            <Link
              href="/login?role=admin"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
            >
              Sign in with custom credentials →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Platform Control Room · Mission Control
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Event Intelligence OS
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={eventId}
            onChange={(e) => {
              const newId = e.target.value;
              setEventId(newId);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", `/console?event=${newId}`);
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 shadow-xs max-w-xs"
          >
            {events.length === 0 && <option value="">Loading events…</option>}
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Quick Access to Event Gate QR Standee */}
          <button
            type="button"
            onClick={() => setShowGateQrModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2.5 text-xs font-semibold shadow-xs transition"
            title="Display Entrance Gate QR Code & Printable Standee"
          >
            <QrIcon className="h-4 w-4 text-indigo-600" />
            <span>Event QR Pass</span>
          </button>

          <Link
            href={`/checkin?eventId=${eventId}`}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-semibold shadow-xs transition"
          >
            <ScanLine className="h-4 w-4" />
            <span>Gate Terminal</span>
          </Link>

          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </button>

          <button
            onClick={async () => {
              await loadEvents(eventId);
              if (eventId) loadAll(eventId);
            }}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition"
            title="Refresh Live Data & Event List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Active Event Pill */}
      {ev && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-600 shadow-xs">
          <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
            {ev.type}
          </span>
          <span className="font-medium text-slate-800">
            {ev.venue} · {ev.city}
          </span>
          <Link
            href={`/register/${ev.id}`}
            className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            Registration Link <ExternalLink className="h-3 w-3" />
          </Link>
          <Link
            href={`/feedback/${ev.id}`}
            className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            Live Feedback Wall <ExternalLink className="h-3 w-3" />
          </Link>
          <Link
            href={`/checkin?eventId=${ev.id}`}
            className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>QR Gate Check-In</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowGateQrModal(true)}
            className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition"
          >
            <QrIcon className="h-3.5 w-3.5 text-indigo-600" />
            <span>Gate Pass QR</span>
          </button>
          {ev.status !== "ended" ? (
            <button
              type="button"
              onClick={() => handleEndEvent(ev.id)}
              className="flex items-center gap-1.5 font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 px-3 py-1 rounded-lg shadow-xs transition"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>End Event &amp; Unlock Certs</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-bold text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Event Ended · Certs Unlocked</span>
              </span>
              <button
                type="button"
                onClick={() => handleReopenEvent(ev.id)}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-1"
              >
                Reopen
              </button>
            </div>
          )}
          <span className="ml-auto hidden items-center gap-1.5 text-[11px] font-medium text-emerald-700 md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            SYSTEM OPERATIONAL
          </span>
        </div>
      )}

      {msg && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-xs font-medium text-indigo-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-6 flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 -mb-[2px] ${
              tab === t.k
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 font-semibold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.label}</span>
            {t.k === "scoring" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && analytics && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    l: "Teams Registered",
                    v: analytics.totals.projects,
                    d: `${board.length} on live leaderboard`,
                    icon: FolderKanban,
                    color: "text-indigo-600 bg-indigo-50",
                  },
                  {
                    l: "Gate Check-in Rate",
                    v: `${analytics.totals.checkinRate}%`,
                    d: `${analytics.totals.checkedIn}/${analytics.totals.visitors} visitors inside`,
                    icon: ScanLine,
                    color: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    l: "Total QR Scans",
                    v: analytics.totals.scans,
                    d: `${analytics.totals.totalViews} stall visits`,
                    icon: QrIcon,
                    color: "text-sky-600 bg-sky-50",
                  },
                  {
                    l: "Average Rating",
                    v: analytics.totals.avgRating || "—",
                    d: `${analytics.totals.feedback} feedback entries`,
                    icon: TrendingUp,
                    color: "text-amber-600 bg-amber-50",
                  },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{s.l}</span>
                      <div className={`p-2 rounded-xl ${s.color}`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">
                      {s.v}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{s.d}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Hourly footfall */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Footfall by Hour (QR Influx)
                    </h3>
                    <span className="text-xs text-slate-500">Live Telemetry</span>
                  </div>
                  <div className="mt-6 flex h-40 items-end gap-2">
                    {Object.entries(analytics.hourly).length === 0 && (
                      <p className="text-xs text-slate-400 py-12 text-center w-full">
                        Gate scans will stream in real-time.
                      </p>
                    )}
                    {Object.entries(analytics.hourly).sort().map(([h, v]) => (
                      <div key={h} className="group relative flex-1 flex flex-col items-center">
                        <div
                          className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition"
                          style={{ height: `${Math.max(12, (Number(v) / maxHour) * 120)}px` }}
                        />
                        <div className="mt-2 text-[10px] text-slate-500 font-mono">{h}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Teams by Category Track
                    </h3>
                    <span className="text-xs text-slate-500">Distribution</span>
                  </div>
                  <div className="mt-5 space-y-3.5">
                    {Object.entries(analytics.byCategory).map(([c, v]) => (
                      <div key={c}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{c}</span>
                          <span className="font-mono text-slate-500">{v} teams</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${(Number(v) / maxCat) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second row: Top Stalls & Sentiment Radar */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Highest Visitor Engagement Stalls
                  </h3>
                  <div className="mt-4 space-y-2">
                    {analytics.topProjects.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                      >
                        <span className={`text-sm font-bold w-6 ${i === 0 ? "text-indigo-600" : "text-slate-400"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-slate-900">{p.title}</div>
                          <div className="text-[11px] text-slate-500">{p.team}</div>
                        </div>
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {p.checkins} scans
                        </span>
                        <span className="text-xs text-slate-500">
                          {p.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      AI Sentiment Radar &amp; Summary
                    </h3>
                  </div>

                  {aiSummary ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-indigo-600">
                          {aiSummary.score}
                          <span className="text-sm font-normal text-slate-400">/100</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">{aiSummary.headline}</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                          ▲ {aiSummary.positive} positive
                        </span>
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          ● {aiSummary.neutral} neutral
                        </span>
                        <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-100">
                          ▼ {aiSummary.negative} critical
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {aiSummary.keywords.map((k) => (
                          <span
                            key={k.word}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            #{k.word} <span className="text-slate-400">×{k.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">Aggregating attendee feedback…</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FLOOR PLANS */}
          {tab === "floor_plans" && (
            <FloorPlanViewer
              eventId={eventId}
              isAdmin={true}
              onSelectProject={(pid) => {
                const found = projects.find((p) => p.id === pid);
                if (found) {
                  setTab("projects");
                }
              }}
            />
          )}

          {/* TAB: AI INSIGHTS */}
          {tab === "ai_insights" && (
            <div className="space-y-6">
              {/* Header & Control Bar */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h2 className="text-lg font-semibold text-slate-900">
                        Autonomous Intelligence &amp; Neural Telemetry
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Z-score jury calibration, cohort score bell curve, spatial footfall telemetry, cryptographic integrity monitoring, and Claude-powered executive synthesis.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => eventId && loadInsights(eventId)}
                      disabled={insightsLoading}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${insightsLoading ? "animate-spin text-indigo-600" : ""}`} />
                      <span>{insightsLoading ? "Analyzing…" : "Refresh Telemetry"}</span>
                    </button>

                    <button
                      onClick={generateExecutiveReport}
                      disabled={generatingReport}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                    >
                      {generatingReport ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Claude Synthesizing Report…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Post-Event Executive Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Top Metrics Row */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Evaluation Mean</span>
                      <Scale className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {insights?.overallMean ? `${insights.overallMean}` : "—"}
                      <span className="text-xs font-normal text-slate-400"> / 100</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Cohort consensus across {insights?.totalEvaluations ?? 0} scores
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Statistical Calibration</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {(insights?.biasAlerts?.length ?? 0) === 0 ? "100%" : `${insights?.biasAlerts?.length} Flags`}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Z-score 1.8σ normal distribution engine
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Peak Hour Activity</span>
                      <ScanLine className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {insights?.peakHours?.peakHour ? `Hour ${insights.peakHours.peakHour}` : "—"}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {insights?.peakHours?.peakVolume ?? 0} scans logged during peak burst
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Cryptographic Health</span>
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {(insights?.securityAlerts?.length ?? 0) === 0 ? "Verified" : `${insights?.securityAlerts?.length} Signals`}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      HMAC SHA-256 certificate &amp; pass protection
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Visual Intelligence Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 1. Score Distribution Histogram */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Score Distribution Bell Curve</h3>
                    </div>
                    <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      Histogram (0-100)
                    </span>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    {insights?.scoreDistribution ? (
                      Object.entries(insights.scoreDistribution).map(([bin, count]) => {
                        const total = insights.totalEvaluations || 1;
                        const pct = Math.round((count / total) * 100);
                        const isExceptional = bin.includes("Exceptional");
                        const isStrong = bin.includes("Strong");
                        const isProficient = bin.includes("Proficient");
                        const isDeveloping = bin.includes("Developing");
                        const barColor = isExceptional
                          ? "bg-emerald-500"
                          : isStrong
                          ? "bg-indigo-600"
                          : isProficient
                          ? "bg-sky-500"
                          : isDeveloping
                          ? "bg-amber-500"
                          : "bg-rose-500";

                        return (
                          <div key={bin} className="text-xs">
                            <div className="flex items-center justify-between text-slate-600 mb-1">
                              <span className="font-medium text-slate-800">{bin}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{count}</span>
                                <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
                              </div>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                                style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-8 text-center text-xs text-slate-400">Loading scoring telemetry…</p>
                    )}
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                    Calculated over live jury scoring submissions. Outliers exceeding 1.8 standard deviations from the cohort mean are automatically isolated for bias check.
                  </p>
                </div>

                {/* 2. Jury Strictness & Bias Calibration Index */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Jury Strictness &amp; Calibration</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Mean: {insights?.overallMean ?? "—"}</span>
                  </div>

                  <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto">
                    {insights?.judgeStrictness && insights.judgeStrictness.length > 0 ? (
                      insights.judgeStrictness.map((j) => {
                        const isHarsh = j.status === "harsh";
                        const isLenient = j.status === "lenient";
                        const badgeClass = isHarsh
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isLenient
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200";

                        const label = isHarsh ? "Strict / Harsh" : isLenient ? "Lenient / Generous" : "Calibrated";

                        return (
                          <div
                            key={j.judgeId}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">{j.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {j.organization || "Jury Panel"} · {j.count} reviews
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-bold text-slate-900">{j.avgScore}</span>
                                <span
                                  className={`text-[10px] font-mono font-semibold ${
                                    j.delta > 0 ? "text-amber-600" : j.delta < 0 ? "text-rose-600" : "text-slate-400"
                                  }`}
                                >
                                  ({j.delta > 0 ? `+${j.delta}` : j.delta})
                                </span>
                              </div>
                              <span className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[10px] font-medium border ${badgeClass}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-8 text-center text-xs text-slate-400">No jury score data recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* 3. Statistical Bias & Outlier Alerts */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Statistical Bias &amp; Variance Flags</h3>
                    </div>
                    <span className="rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Z-Score 1.8σ
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto">
                    {insights?.biasAlerts && insights.biasAlerts.length > 0 ? (
                      insights.biasAlerts.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-900">
                              {b.judgeName} → {b.projectTitle}
                            </span>
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                              {b.type} (Score {b.score})
                            </span>
                          </div>
                          <p className="text-amber-800/90 text-[11px] leading-relaxed">{b.details}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-emerald-800">
                        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
                        <div className="font-semibold">Normal Variance Verified</div>
                        <p className="mt-1 text-[11px] text-emerald-700/80">
                          All jury submissions match peer consensus within 1.8 standard deviations. No rogue grading or skew detected.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Real-time Security & Fraud Signals */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-purple-600" />
                      <h3 className="text-sm font-semibold text-slate-900">Cryptographic &amp; Gate Pass Security</h3>
                    </div>
                    <span className="rounded-md bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      HMAC Verified
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto">
                    {insights?.securityAlerts && insights.securityAlerts.length > 0 ? (
                      insights.securityAlerts.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-rose-900 uppercase text-[11px]">
                              {s.type.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-rose-600 font-mono">
                              {new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-rose-800 text-[11px]">{s.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-emerald-800">
                        <ShieldCheck className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
                        <div className="font-semibold">Zero Security Anomalies</div>
                        <p className="mt-1 text-[11px] text-emerald-700/80">
                          No duplicate QR badge check-ins, rapid scan surges, or certificate signature tampering recorded.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spatial Traffic & Crowd Velocity */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <ScanLine className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Spatial Footfall &amp; Stall Velocity ({insights?.boothTraffic?.totalScansRecorded ?? 0} total scans)
                  </h3>
                </div>

                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block mb-2">
                      Top 5 Visited Booths (High Crowd Density)
                    </span>
                    <div className="space-y-2">
                      {insights?.boothTraffic?.topVisited?.map((b) => (
                        <div
                          key={b.projectId}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                        >
                          <div className="min-w-0 pr-3">
                            <span className="font-semibold text-slate-900 truncate block">{b.title}</span>
                            <span className="text-[10px] text-slate-400">Booth {b.boothNo}</span>
                          </div>
                          <span className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 shrink-0">
                            {b.count} scans
                          </span>
                        </div>
                      ))}
                      {!insights?.boothTraffic?.topVisited?.length && (
                        <p className="py-4 text-xs text-slate-400">No booth scans recorded yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-800 block mb-2">
                      Under-Visited Booths (Recommended for Traffic Routing)
                    </span>
                    <div className="space-y-2">
                      {insights?.boothTraffic?.leastVisited?.map((b) => (
                        <div
                          key={b.projectId}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                        >
                          <div className="min-w-0 pr-3">
                            <span className="font-semibold text-slate-900 truncate block">{b.title}</span>
                            <span className="text-[10px] text-slate-400">Booth {b.boothNo}</span>
                          </div>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 shrink-0">
                            {b.count} scans
                          </span>
                        </div>
                      ))}
                      {!insights?.boothTraffic?.leastVisited?.length && (
                        <p className="py-4 text-xs text-slate-400">No stall scan discrepancies.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Post-Event Report Display */}
              {report ? (
                <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-b from-white via-indigo-50/20 to-white p-7 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-indigo-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">
                          Executive Post-Event Intelligence Report
                        </h3>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Synthesized by <span className="font-medium text-indigo-700">{report.generatedBy}</span> · {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => downloadReportMarkdown(report)}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs transition"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Download Report (.md)</span>
                    </button>
                  </div>

                  {/* Executive Summary */}
                  <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
                      Executive Summary
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 font-medium">
                      {report.executiveSummary}
                    </p>
                  </div>

                  {/* Key Achievements */}
                  <div className="mt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                      Key Event Milestones &amp; Achievements
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {report.keyAchievements.map((ach, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{ach}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Projects Highlights */}
                  {report.topProjectsHighlights && report.topProjectsHighlights.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                        Standout Projects &amp; Innovation Highlights
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {report.topProjectsHighlights.map((prj, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-slate-900">{prj.title}</span>
                              <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                {prj.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mb-2">Team: {prj.team}</div>
                            <p className="text-slate-600 leading-relaxed">{prj.whyOutstanding}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attendee Sentiment Themes */}
                  {report.feedbackThemes && report.feedbackThemes.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                        Attendee Voice &amp; Qualitative Themes
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {report.feedbackThemes.map((thm, idx) => {
                          const badgeColor =
                            thm.sentiment === "positive"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : thm.sentiment === "negative"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-slate-100 text-slate-700 border-slate-200";

                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-semibold text-slate-900">{thm.theme}</span>
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${badgeColor}`}>
                                  {thm.sentiment}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-[11px]">{thm.insight}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 mb-3">
                        Strategic Directives for Next Edition
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-bold text-indigo-600 shrink-0">{idx + 1}.</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/30 p-8 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-indigo-500 mb-2" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Ready to Generate Executive Intelligence Brief?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Synthesizes footfall velocity, jury deliberations, stall ratings, and feedback into a comprehensive C-level brief with Claude 3.5 Sonnet.
                  </p>
                  <button
                    onClick={generateExecutiveReport}
                    disabled={generatingReport}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                  >
                    {generatingReport ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Synthesizing Report…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Synthesize Executive Brief Now →</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {tab === "projects" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  {projects.length} registered teams · click QR badge to open printable booth card
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowBulkProjectModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition"
                  >
                    <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Bulk Import (CSV)</span>
                  </button>

                  {eventId && (
                    <a
                      href={`/api/export/csv?eventId=${eventId}&type=leaderboard`}
                      download
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Export Teams (CSV)</span>
                    </a>
                  )}

                  {ev && (
                    <Link
                      href={`/register/${ev.id}?tab=team`}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Register New Team</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center shadow-xs"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm">
                      {p.teamName.slice(0, 1)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{p.title}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {p.category}
                        </span>
                        <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          Booth {p.boothNo}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {p.teamName} · Lead: {p.leaderName} ({p.leaderEmail}) · Tech: {p.techStack.slice(0, 4).join(", ")}
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs text-slate-500 font-medium">
                      <span><b className="text-slate-800">{p.views}</b> views</span>
                      <span><b className="text-indigo-600">{p.checkins}</b> scans</span>
                      <span><b className="text-amber-600">{p.votes}</b> votes</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setQrProject(p)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition"
                      >
                        <QrIcon className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{p.code}</span>
                      </button>
                      <Link
                        href={`/p/${p.code}`}
                        target="_blank"
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-slate-600 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: JUDGES + AI */}
          {tab === "judges" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Judging Panel ({judges.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBulkJudgeModal(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition"
                    >
                      <UploadCloud className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Bulk Import (CSV)</span>
                    </button>
                    <button
                      onClick={() => setShowJudgeModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Onboard Judge</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {judges.map((j) => (
                    <div
                      key={j.id}
                      className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-50 text-amber-800 font-semibold text-xs flex items-center justify-center">
                        {j.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-900">{j.name}</div>
                        <div className="truncate text-[11px] text-slate-500">{j.organization}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {j.expertise.map((e) => (
                            <span
                              key={e}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1">
                        {j.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Judge Matching */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    JudgeMatch AI — Recommended Allocation
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Calculates compatibility across expertise, problem track, and tech stack affinity.
                </p>

                <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {matchMatrix.map((m) => (
                    <div
                      key={m.projectId}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{m.title}</span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {m.category}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {m.topJudges.map((t, i) => (
                          <div key={t.judgeId} className="flex items-center gap-2 text-xs">
                            <span className="text-[10px] font-mono text-slate-400">#{i + 1}</span>
                            <span className="flex-1 truncate font-medium text-slate-700">{t.judgeName}</span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-indigo-600"
                                style={{ width: `${t.score}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-medium text-slate-600">{t.score}%</span>
                          </div>
                        ))}
                        <p className="mt-2 text-[10px] text-slate-500">
                          Match basis: {m.topJudges[0]?.reasons.join(" · ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE SCORING */}
          {tab === "scoring" && (
            <div className="space-y-6">
              {/* Real-time Telemetry Bar */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stream Status</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveConnected ? "animate-ping bg-emerald-400" : "bg-amber-400"}`} />
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLiveConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {isLiveConnected ? "SSE Stream Connected" : "HTTP Polling"}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {lastLivePulse ? `Pulse: ${lastLivePulse}` : "Establishing stream..."}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gate Check-ins</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                    {livePulseData?.checkedInCount ?? visitors.filter((v) => v.checkedIn).length}
                    <span className="text-xs font-normal text-slate-400"> / {livePulseData?.totalVisitors ?? visitors.length}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">Live attendee velocity</div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Booth Scans</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                    {livePulseData?.totalScans ?? analytics?.totals?.scans ?? 0}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">Floor QR engagements</div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Scorecards</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                    {livePulseData?.totalScores ?? scores.length}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">Jury evaluations logged</div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                {/* Leaderboard */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className={`h-2.5 w-2.5 rounded-full ${isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
                      Live Judging Leaderboard
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLiveConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {isLiveConnected ? "SSE Active (4s Pulse)" : "Polling (5s)"}
                      </span>
                    </div>
                  </div>

                <div className="mt-4 space-y-2">
                  {board.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 transition ${
                        i === 0
                          ? "border-amber-200 bg-amber-50/50"
                          : i < 3
                          ? "border-slate-200 bg-slate-50/40"
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <span className={`text-base font-bold w-6 ${i === 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-slate-900">{p.title}</span>
                          {p.flags > 0 && (
                            <span className="flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                              <ShieldAlert className="h-3 w-3" />
                              {p.flags} flag
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{p.teamName}</span>
                          <span>·</span>
                          <span className={p.judgeCount < judges.length ? "text-amber-700 font-medium" : "text-emerald-700 font-medium"}>
                            {p.judgeCount}/{judges.length} scored
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-slate-900 tabular-nums">
                        {p.avgScore.toFixed(1)}
                      </span>
                    </div>
                  ))}

                  {!board.length && (
                    <p className="py-12 text-center text-xs text-slate-400">
                      No jury evaluations submitted yet. Scoring can be performed from the Judge Portal.
                    </p>
                  )}
                </div>
              </div>

              {/* FairScore Alerts & Stream */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      FairScore Anomaly Alerts ({scores.filter((s) => s.flagged).length})
                    </h3>
                  </div>

                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                    {scores.filter((s) => s.flagged).map((s) => {
                      const p = projects.find((x) => x.id === s.projectId);
                      const j = judges.find((x) => x.id === s.judgeId);
                      return (
                        <div
                          key={s.id}
                          className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs"
                        >
                          <div className="font-semibold text-amber-950">
                            {p?.title} <span className="font-normal text-amber-800">by {j?.name}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                            {s.flagReason}
                          </div>
                        </div>
                      );
                    })}
                    {!scores.some((s) => s.flagged) && (
                      <p className="text-xs text-slate-500 py-3">
                        No score anomalies detected. Evaluation variance is within standard parameters.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Scoring Stream</h3>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {scores.slice(0, 20).map((s) => {
                      const p = projects.find((x) => x.id === s.projectId);
                      const j = judges.find((x) => x.id === s.judgeId);
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-900">{p?.title || "—"}</span>
                            <span className="text-slate-500"> · {j?.name || "Judge"}</span>
                            {s.comment && (
                              <div className="truncate text-[11px] italic text-slate-500">
                                &ldquo;{s.comment}&rdquo;
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {s.total} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* TAB: SPONSORS & LEADS */}
          {tab === "sponsors" && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                      <h2 className="text-lg font-semibold text-slate-900">
                        Sponsor &amp; Partner Terminal Management
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Onboard expo sponsors, track booth delegate lead conversion, generate partner access passcodes, and monitor partner ROI.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowSponsorModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Onboard Partner</span>
                    </button>

                    <Link
                      href="/sponsor"
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition"
                    >
                      <span>Open Booth Portal</span>
                      <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                    </Link>

                    {eventId && (
                      <a
                        href={`/api/export/csv?eventId=${eventId}&type=sponsors`}
                        download
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Export CSV</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Active Partners</span>
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{sponsorsList.length}</div>
                    <p className="mt-1 text-[11px] text-slate-500">Exhibition &amp; sponsor stalls</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Total Leads Captured</span>
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {sponsorsList.reduce((acc, s) => acc + (s.leadCount || 0), 0)}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Attendee badges scanned across booths</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Digital Impressions</span>
                      <BarChart3 className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {sponsorsList.reduce((acc, s) => acc + (s.views || 0), 0)}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Public profile &amp; brochure views</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Partner Terminal</span>
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">Live</div>
                    <p className="mt-1 text-[11px] text-slate-500">Passcode-authenticated CRM active</p>
                  </div>
                </div>
              </div>

              {/* Sponsors Table */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Onboarded Event Partners ({sponsorsList.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Passcodes allow sponsor representatives to log into /sponsor on mobile
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {sponsorsList.map((s) => {
                    const tierBadge =
                      s.tier === "title"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : s.tier === "platinum"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : s.tier === "gold"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={s.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs uppercase border border-slate-200">
                            {s.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tierBadge}`}>
                                {s.tier}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                                Booth {s.boothNo || "Main"}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500">
                              {s.contactEmail && <span>Email: {s.contactEmail}</span>}
                              {s.website && (
                                <a href={s.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                  {s.website}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-right">
                          <div className="text-center sm:text-right">
                            <div className="text-xs font-bold text-slate-900">{s.leadCount} leads</div>
                            <div className="text-[10px] text-slate-400">{s.views} stall views</div>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-slate-800">
                            <span>{s.passcode}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(s.passcode);
                                flash(`Copied passcode ${s.passcode} to clipboard`);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy passcode"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!sponsorsList.length && (
                    <div className="p-12 text-center text-slate-400">
                      <Briefcase className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No event partners added yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Add headline, platinum, and gold partners to grant them booth access and attendee lead retrieval capabilities.
                      </p>
                      <button
                        onClick={() => setShowSponsorModal(true)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Onboard First Partner</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MONETIZATION & TICKETS */}
          {tab === "monetization" && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <h2 className="text-lg font-semibold text-slate-900">
                        Ticketing &amp; Monetization Engine
                      </h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Registration revenue telemetry, ticket tier sales, gateway settlements, and pass issuance logs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ev && (
                      <Link
                        href={`/register/${ev.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition"
                      >
                        <span>Public Ticket Portal</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}

                    {eventId && (
                      <a
                        href={`/api/export/csv?eventId=${eventId}&type=attendees`}
                        download
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Export Attendees CSV</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Gross Revenue</span>
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      ₹{(ordersSummary?.grossRevenue || 0).toLocaleString()}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Total settled pass revenue</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Paid Passes</span>
                      <Ticket className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {ordersSummary?.paidCount || 0}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Confirmed VIP &amp; paid registrations</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Total Orders</span>
                      <Users className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {ordersSummary?.totalOrders || 0}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Free + paid delegate checkouts</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider">Avg Order Value</span>
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      ₹
                      {ordersSummary?.paidCount
                        ? Math.round(ordersSummary.grossRevenue / ordersSummary.paidCount).toLocaleString()
                        : "0"}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Per paid delegate transaction</p>
                  </div>
                </div>
              </div>

              {/* Tier Breakdown Cards */}
              {ordersSummary?.tierBreakdown && Object.keys(ordersSummary.tierBreakdown).length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(ordersSummary.tierBreakdown).map(([tierName, data]) => (
                    <div key={tierName} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">{tierName}</span>
                        <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {data.count} passes
                        </span>
                      </div>
                      <div className="text-xl font-extrabold text-slate-900">
                        ₹{data.revenue.toLocaleString()}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">Total volume for this pass tier</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Transactions List Table */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Recent Pass Orders ({ordersList.length})
                  </h3>
                  <span className="text-xs text-slate-500">Directly settled into organizer account</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {ordersList.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ord.buyerName}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({ord.buyerEmail})</span>
                          <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                            {ord.tierName}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-slate-500 text-[11px]">
                          <span>Provider: {ord.paymentProvider.toUpperCase()}</span>
                          <span>· Order ID: {ord.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {ord.amount === 0 ? "FREE" : `₹${ord.amount.toLocaleString()}`}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            ord.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {!ordersList.length && (
                    <div className="p-12 text-center text-slate-400">
                      <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No ticket orders recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Attendee registrations and VIP ticket sales from the public registration portal will show here in real-time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VISITORS */}
          {tab === "visitors" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                    <div className="text-xs font-medium text-slate-500">Registered Visitors</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-900">{visitors.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                    <div className="text-xs font-medium text-slate-500">Currently Inside</div>
                    <div className="mt-2 text-3xl font-semibold text-emerald-600">
                      {visitors.filter((v) => v.checkedIn).length}
                    </div>
                  </div>
                </div>

                {/* Common Entrance Gate QR */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs text-center">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Entrance Turnstile
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                      Universal Gate Pass
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Main Gate Check-In QR
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Display at event entrance. Attendees scan with any mobile camera for instant verification.
                  </p>

                  <div className="mx-auto mt-4 w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                    <QrCode
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/gate/${ev?.id || eventId}`
                          : `https://eventos.live/gate/${ev?.id || eventId}`
                      }
                      size={160}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/gate/${ev?.id || eventId}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-xs font-semibold shadow-xs transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Test Gate Pass</span>
                    </Link>

                    <Link
                      href={`/checkin?eventId=${ev?.id || eventId}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition"
                    >
                      <ScanLine className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Gate Terminal</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Visitor Registry */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Attendee Registry</h3>
                  {eventId && (
                    <a
                      href={`/api/export/csv?eventId=${eventId}&type=attendees`}
                      download
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Export CSV</span>
                    </a>
                  )}
                </div>
                <div className="max-h-[520px] space-y-2 overflow-y-auto">
                  {visitors.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs"
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          v.checkedIn ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900">{v.name}</span>
                        <span className="ml-2 rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-600 capitalize">
                          {v.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 hidden md:block">
                        {v.interests.slice(0, 2).join(", ")}
                      </span>
                      <span className="font-mono text-xs font-medium text-indigo-600">
                        {v.code}
                      </span>
                    </div>
                  ))}
                  {!visitors.length && (
                    <p className="py-12 text-center text-xs text-slate-400">No attendees checked in yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CERTIFICATES */}
          {tab === "certs" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <h3 className="text-sm font-semibold text-slate-900">Issue Verifiable Credentials</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Each credential features a cryptographically verifiable QR verification route.
                  </p>
                  <button
                    onClick={() => setShowCertModal(true)}
                    className="mt-4 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-semibold shadow-xs transition"
                  >
                    + Issue Single Certificate
                  </button>
                  <button
                    onClick={bulkCertifyTop3}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-medium text-slate-700 shadow-xs transition"
                  >
                    🏆 Auto-Certify Top 3 Winners
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="text-xs font-medium text-slate-500">Issued to Date</div>
                  <div className="mt-2 text-4xl font-semibold text-slate-900">{certs.length}</div>
                </div>
              </div>

              {/* Issued Credentials list */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Credentials Ledger</h3>
                <div className="max-h-[520px] space-y-2 overflow-y-auto">
                  {certs.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                    >
                      <Award
                        className={`h-5 w-5 shrink-0 ${
                          c.role === "winner" ? "text-amber-500" : "text-indigo-600"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900">{c.recipientName}</div>
                        <div className="text-[11px] text-slate-500">{c.title} · {c.role}</div>
                      </div>
                      <span className="font-mono text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <Link
                        href={`/verify/${c.code}`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                        title="View & Print Certificate"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                  {!certs.length && (
                    <p className="py-12 text-center text-xs text-slate-400">
                      No certificates generated yet. Issue credentials above.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FEEDBACK AI */}
          {tab === "feedback" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs h-fit">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    AI Feedback Synthesis
                  </h3>
                </div>

                {aiSummary && (
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-indigo-600">
                      {aiSummary.score}
                      <span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {aiSummary.headline}
                    </p>
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-emerald-800">
                        <span>Positive Signals</span>
                        <b className="font-semibold">{aiSummary.positive}</b>
                      </div>
                      <div className="flex justify-between rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-slate-700">
                        <span>Neutral</span>
                        <b className="font-semibold">{aiSummary.neutral}</b>
                      </div>
                      <div className="flex justify-between rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-rose-800">
                        <span>Critical Notes</span>
                        <b className="font-semibold">{aiSummary.negative}</b>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-medium text-slate-500 mb-2">Key Themes</div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiSummary.keywords.map((k) => (
                          <span
                            key={k.word}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            #{k.word} ×{k.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Raw Feedback List */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Raw Attendee Feedback ({feedback.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {eventId && (
                      <a
                        href={`/api/export/csv?eventId=${eventId}&type=feedback`}
                        download
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs transition"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Export CSV</span>
                      </a>
                    )}
                    {ev && (
                      <Link
                        href={`/feedback/${ev.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Public Wall →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="max-h-[560px] space-y-2.5 overflow-y-auto">
                  {feedback.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{f.authorName}</span>
                        <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {f.authorRole}
                        </span>
                        <span
                          className={`ml-auto rounded px-2 py-0.5 text-[10px] font-medium ${
                            f.sentiment === "positive"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : f.sentiment === "negative"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {f.sentiment} · ★{f.rating}
                        </span>
                      </div>
                      <p className="mt-1.5 text-slate-600 leading-relaxed">{f.message}</p>
                    </div>
                  ))}
                  {!feedback.length && (
                    <p className="py-12 text-center text-xs text-slate-400">No feedback submitted yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT TRAIL */}
          {tab === "audit" && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                      <h2 className="text-lg font-semibold text-slate-900">Enterprise Security Audit Trail</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Immutable forensic log of organizer changes, scoring operations, pass check-ins, and cryptographic certificates.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadAuditLogs(eventId)}
                      disabled={auditLoading}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${auditLoading ? "animate-spin text-indigo-600" : ""}`} />
                      <span>{auditLoading ? "Syncing…" : "Refresh Logs"}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="mt-5 flex flex-col gap-3 pt-4 border-t border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "all", label: "All Activity" },
                      { id: "EVENT", label: "Events" },
                      { id: "PROJECT", label: "Projects" },
                      { id: "SCORE", label: "Scores" },
                      { id: "CHECKIN", label: "Check-ins" },
                      { id: "CERTIFICATE", label: "Certificates" },
                      { id: "USER", label: "Auth Sessions" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setAuditFilter(f.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          auditFilter === f.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search by actor email or target ID…"
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Audit Log Entries List */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {auditLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" />
                    <p className="mt-2 text-xs text-slate-500">Querying cryptographic audit logs…</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {auditLogsList
                      .filter((log) => {
                        if (auditFilter !== "all" && !log.action.startsWith(auditFilter)) return false;
                        if (auditSearch) {
                          const query = auditSearch.toLowerCase();
                          return (
                            log.actorEmail.toLowerCase().includes(query) ||
                            log.action.toLowerCase().includes(query) ||
                            (log.targetId && log.targetId.toLowerCase().includes(query))
                          );
                        }
                        return true;
                      })
                      .map((log) => {
                        const isScore = log.action.includes("SCORE");
                        const isCheckin = log.action.includes("CHECKIN");
                        const isCert = log.action.includes("CERTIFICATE");
                        const isEvent = log.action.includes("EVENT");
                        const isAuth = log.action.includes("USER");

                        const badgeColor = isScore
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : isCheckin
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isCert
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : isEvent
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : isAuth
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-700 border-slate-200";

                        return (
                          <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start gap-3">
                              <span className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider border shrink-0 ${badgeColor}`}>
                                {log.action}
                              </span>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-slate-900">{log.actorEmail}</span>
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium">
                                    {log.actorRole}
                                  </span>
                                  {log.targetType && (
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      → {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 10)})` : ""}
                                    </span>
                                  )}
                                </div>

                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {Object.entries(log.details).map(([k, v]) => (
                                      <span key={k} className="rounded bg-slate-50 border border-slate-150 px-2 py-0.5 text-[11px] text-slate-600 font-mono">
                                        {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 text-slate-500 font-mono text-[11px]">
                              <div>{new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              <div className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                              {log.ipAddress && <div className="text-[10px] text-slate-300">IP: {log.ipAddress}</div>}
                            </div>
                          </div>
                        );
                      })}

                    {auditLogsList.length === 0 && !auditLoading && (
                      <div className="p-12 text-center text-slate-400">
                        <ShieldAlert className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-700">No security audit records found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Actions like creating events, scoring projects, verifying passes, or issuing certificates will appear here automatically.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR MODAL */}
      {qrProject && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setQrProject(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Printable Booth Pass
              </span>
              <button
                onClick={() => setQrProject(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{qrProject.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500 font-mono">
              Booth {qrProject.boothNo} · Code {qrProject.code}
            </p>
            <div className="mx-auto mt-5 w-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <QrCode
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${qrProject.code}`}
                size={180}
              />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Print and mount at the exhibit stall. Visitors scan to view details and rate.
            </p>
            <Link
              href={`/p/${qrProject.code}`}
              target="_blank"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-semibold shadow-xs transition"
            >
              <span>Preview Live Project Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showEventModal && (
        <Modal onClose={() => setShowEventModal(false)} title="Initialize New Event">
          <form onSubmit={createEvent} className="space-y-3">
            <Field label="Event Title *">
              <input name="name" required placeholder="e.g. InnovateX Grand Expo '26" className="inp" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type *">
                <select name="type" required className="inp">
                  <option value="hackathon">Hackathon</option>
                  <option value="expo">Expo / Exhibition</option>
                  <option value="conference">Conference</option>
                  <option value="techfest">Tech Fest</option>
                  <option value="tradefair">Trade Fair</option>
                  <option value="cultural">Cultural Fest</option>
                </select>
              </Field>
              <Field label="City *">
                <input name="city" required placeholder="e.g. Bengaluru" className="inp" />
              </Field>
            </div>
            <Field label="Tagline *">
              <input name="tagline" required placeholder="One crisp line summarizing the event" className="inp" />
            </Field>
            <Field label="Venue *">
              <input name="venue" required placeholder="Main Convention Center" className="inp" />
            </Field>
            <Field label="Description *">
              <textarea
                name="description"
                required
                rows={2}
                placeholder="Overview of tracks, challenge statements, and visitor guidelines"
                className="inp resize-none"
              />
            </Field>

            {/* Floor Plan Layout Setup */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <span>Floor Plan Layout Setup</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Optionally initialize this event with an architectural floor plan:
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutSource("blank")}
                  className={`rounded-xl border p-2 text-center text-xs font-medium transition ${
                    layoutSource === "blank"
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Start Blank
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSource("template")}
                  className={`rounded-xl border p-2 text-center text-xs font-medium transition ${
                    layoutSource === "template"
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  From Template
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSource("copy")}
                  className={`rounded-xl border p-2 text-center text-xs font-medium transition ${
                    layoutSource === "copy"
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Copy Past Event
                </button>
              </div>

              {layoutSource === "template" && (
                <div className="mt-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Select Organization Template:
                  </label>
                  {availableTemplates.length > 0 ? (
                    <select
                      name="templateId"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                    >
                      {availableTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.booths?.length || 0} booths)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                      No organization templates saved yet. (Save any layout as a template from the Floor Plans tab!).
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Walls, openings, and booth coordinates will be loaded. All project assignments start empty.
                  </p>
                </div>
              )}

              {layoutSource === "copy" && (
                <div className="mt-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Copy Layout from Event:
                  </label>
                  <select
                    name="copyFromEventId"
                    value={selectedCopyEventId}
                    onChange={(e) => setSelectedCopyEventId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 shadow-xs"
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.city})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Copies walls, openings, and booth positions, but clears all project assignments.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={creatingEvent}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              {creatingEvent ? "Booting event…" : "Create & Launch Event →"}
            </button>
          </form>
        </Modal>
      )}

      {/* ADD JUDGE MODAL */}
      {showJudgeModal && (
        <Modal onClose={() => setShowJudgeModal(false)} title="Onboard Jury Member">
          <form onSubmit={createJudge} className="space-y-3">
            <Field label="Full Name *">
              <input name="name" required placeholder="Dr. Jane Doe" className="inp" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Organization">
                <input name="org" placeholder="Google / Sequoia" className="inp" />
              </Field>
              <Field label="Email Address">
                <input name="email" type="email" placeholder="jane@org.com" className="inp" />
              </Field>
            </div>
            <Field label="Expertise Domains (comma-separated)">
              <input name="expertise" placeholder="AI/ML, HealthTech, Systems Architecture" className="inp" />
            </Field>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs transition"
            >
              Generate Jury Passcode →
            </button>
          </form>
        </Modal>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertModal && (
        <Modal onClose={() => setShowCertModal(false)} title="Issue Verifiable Certificate">
          <form onSubmit={issueCert} className="space-y-3">
            <Field label="Recipient Name *">
              <input name="name" required placeholder="Aarav Sharma" className="inp" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <select name="role" className="inp">
                  <option value="participant">Participant</option>
                  <option value="winner">Winner</option>
                  <option value="judge">Judge</option>
                  <option value="mentor">Mentor</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="organizer">Organizer</option>
                </select>
              </Field>
              <Field label="Credential Title">
                <input name="title" placeholder="National Finalist — Nexathon '26" className="inp" />
              </Field>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs transition"
            >
              Issue with QR Verification →
            </button>
          </form>
        </Modal>
      )}

      {/* ONBOARD SPONSOR MODAL */}
      {showSponsorModal && (
        <Modal onClose={() => setShowSponsorModal(false)} title="Onboard Event Partner / Sponsor">
          <form onSubmit={createSponsor} className="space-y-3">
            <Field label="Partner Name *">
              <input name="name" required placeholder="e.g. Anthropic / AWS / Google" className="inp" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Partnership Tier *">
                <select name="tier" required className="inp">
                  <option value="title">Title Partner</option>
                  <option value="platinum">Platinum Partner</option>
                  <option value="gold">Gold Partner</option>
                  <option value="silver">Silver Partner</option>
                  <option value="bronze">Bronze Partner</option>
                </select>
              </Field>
              <Field label="Booth Number">
                <input name="boothNo" placeholder="e.g. S-01" className="inp" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Email">
                <input name="contactEmail" type="email" placeholder="partners@corp.com" className="inp" />
              </Field>
              <Field label="Booth Access Passcode">
                <input name="passcode" placeholder="Leave empty to auto-generate" className="inp" />
              </Field>
            </div>
            <Field label="Website URL">
              <input name="website" placeholder="https://…" className="inp" />
            </Field>
            <button
              type="submit"
              disabled={creatingSponsor}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              {creatingSponsor ? "Onboarding Partner…" : "Create Partner & Generate Booth Key →"}
            </button>
          </form>
        </Modal>
      )}

      {/* BULK IMPORT PROJECTS MODAL */}
      {showBulkProjectModal && (
        <Modal onClose={() => setShowBulkProjectModal(false)} title="Bulk Import Project Teams (CSV)">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Paste CSV or plain text with columns: <span className="font-mono text-indigo-600">title, category, teamName, leaderName, leaderEmail, boothNo, description</span>
            </p>
            <textarea
              rows={6}
              value={bulkProjectText}
              onChange={(e) => setBulkProjectText(e.target.value)}
              placeholder={`title,category,teamName,leaderName,leaderEmail,boothNo,description\nMediQueue AI,HealthTech,PulseCoders,Priya Sharma,priya@mail.com,B-01,AI patient triaging system\nSolarGrid,CleanTech,SunPower,Aarav Patel,aarav@mail.com,B-02,Decentralized microgrid management`}
              className="inp resize-none font-mono text-[11px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkProjectText(
                    `title,category,teamName,leaderName,leaderEmail,boothNo,description\nMediQueue AI,HealthTech,PulseCoders,Priya Sharma,priya@mail.com,B-01,AI patient triaging system\nSolarGrid,CleanTech,SunPower,Aarav Patel,aarav@mail.com,B-02,Decentralized microgrid management\nFraudSentinel,FinTech,CyberSec,Neha Gupta,neha@mail.com,B-03,Real-time transaction anomaly detector`
                  );
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Load Sample Data
              </button>
              <button
                type="button"
                onClick={handleBulkProjectImport}
                disabled={importingBulk || !bulkProjectText.trim()}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
              >
                {importingBulk ? "Importing Teams…" : "Import All Teams Now →"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* BULK IMPORT JUDGES MODAL */}
      {showBulkJudgeModal && (
        <Modal onClose={() => setShowBulkJudgeModal(false)} title="Bulk Import Jury Members (CSV)">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Paste CSV with columns: <span className="font-mono text-indigo-600">name, email, organization, expertise (semicolon-separated)</span>
            </p>
            <textarea
              rows={6}
              value={bulkJudgeText}
              onChange={(e) => setBulkJudgeText(e.target.value)}
              placeholder={`name,email,organization,expertise\nDr. Vikram Rao,vikram@iisc.ac.in,IISc Bangalore,AI/ML;Systems\nAnita Sengupta,anita@sequoia.com,Sequoia Capital,FinTech;Product\nRajesh Nair,rajesh@google.com,Google Research,CleanTech;Robotics`}
              className="inp resize-none font-mono text-[11px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkJudgeText(
                    `name,email,organization,expertise\nDr. Vikram Rao,vikram@iisc.ac.in,IISc Bangalore,AI/ML;Systems\nAnita Sengupta,anita@sequoia.com,Sequoia Capital,FinTech;Product\nRajesh Nair,rajesh@google.com,Google Research,CleanTech;Robotics`
                  );
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Load Sample Jury
              </button>
              <button
                type="button"
                onClick={handleBulkJudgeImport}
                disabled={importingBulk || !bulkJudgeText.trim()}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
              >
                {importingBulk ? "Importing Jury…" : "Import All Judges Now →"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* EVENT GATE PASS QR MODAL */}
      {showGateQrModal && ev && (
        <Modal onClose={() => setShowGateQrModal(false)} title="Event Gate Admission &amp; Digital Pass">
          <div className="text-center space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[11px] font-bold text-indigo-700">
                <QrIcon className="h-3 w-3" />
                <span>OFFICIAL ENTRANCE STANDEE</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-2">{ev.name}</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Display this QR standee at the registration desk or venue entrance. Attendees scan with any mobile phone to register and enter the expo.
              </p>
            </div>

            {/* Branded QR Card Frame */}
            <div className="mx-auto w-fit rounded-3xl bg-gradient-to-b from-indigo-50/50 to-white p-4 border border-indigo-100 shadow-md">
              <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
                <QrCode
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/gate/${ev.id}`
                      : `https://eventos.live/gate/${ev.id}`
                  }
                  size={200}
                />
              </div>
              <span className="mt-2.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Scan with any Smartphone Camera
              </span>
            </div>

            {/* Clean Enterprise Link Pill */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2 text-xs">
              <div className="flex items-center gap-2 truncate text-left pl-1">
                <span className="rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide shrink-0">
                  Gate URL
                </span>
                <span className="font-mono text-slate-700 text-xs truncate">
                  {typeof window !== "undefined"
                    ? `${window.location.host}/gate/${ev.slug || ev.id.slice(0, 8)}`
                    : `/gate/${ev.id.slice(0, 8)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/gate/${ev.id}` : "";
                  navigator.clipboard.writeText(url);
                  setCopiedGateUrl(true);
                  setTimeout(() => setCopiedGateUrl(false), 2000);
                }}
                className="ml-2 flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white transition shrink-0 shadow-xs"
              >
                {copiedGateUrl ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Professional Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/gate/${ev.id}`}
                target="_blank"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-2.5 text-xs font-bold shadow-xs transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                <span>Preview Attendee Pass</span>
              </Link>
              <Link
                href={`/checkin?eventId=${ev.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-xs transition"
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>Reception Terminal</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                const w = window.open(`/gate/${ev.id}`, "_blank");
                if (w) {
                  w.onload = () => w.print();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-xs font-semibold transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print A4 Entrance Standee Poster</span>
            </button>
          </div>
        </Modal>
      )}

      <style>{`.inp{width:100%;border-radius:0.75rem;border:1px solid #E2E8F0;background:#F8FAFC;padding:0.625rem 0.875rem;font-size:0.75rem;outline:none;color:#0F172A;transition:all 0.15s}.inp:focus{background:#fff;border-color:#6366F1;box-shadow:0 0 0 2px rgba(99,102,241,0.15)}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ConsolePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 pt-32 text-center text-xs text-slate-500">
          Loading Mission Control…
        </main>
      }
    >
      <ConsoleInner />
    </Suspense>
  );
}
