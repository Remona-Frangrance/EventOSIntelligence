"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import QrCode from "@/components/QrCode";
import {
  LayoutDashboard, FolderKanban, Gavel, Trophy, Users, Award, MessagesSquare,
  Plus, QrCode as QrIcon, ShieldAlert, Sparkles, Download, X, CheckCircle2,
  ScanLine, TrendingUp, AlertTriangle, RefreshCw, ExternalLink, Printer,
} from "lucide-react";

type Event = { id: string; name: string; type: string; status: string; scoringCriteria: { key: string; label: string; max: number; weight: number }[]; categories: string[]; venue: string; city: string };
type Project = { id: string; title: string; category: string; teamName: string; leaderName: string; leaderEmail: string; code: string; boothNo: string; views: number; checkins: number; votes: number; status: string; description: string; techStack: string[] };
type Judge = { id: string; name: string; organization: string; expertise: string[]; code: string; avatarColor: string };
type ScoreRow = { id: string; projectId: string; judgeId: string; criteriaScores: Record<string, number>; total: number; comment: string; flagged: boolean; flagReason: string; createdAt: string };

const tabs = [
  { k: "overview", label: "Overview", icon: LayoutDashboard },
  { k: "projects", label: "Projects", icon: FolderKanban },
  { k: "judges", label: "Judges + AI", icon: Gavel },
  { k: "scoring", label: "Live Scoring", icon: Trophy },
  { k: "visitors", label: "Visitors", icon: Users },
  { k: "certs", label: "Certificates", icon: Award },
  { k: "feedback", label: "Feedback AI", icon: MessagesSquare },
];

function ConsoleInner() {
  const { user, loading: authLoading } = useAuth();
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
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const ev = useMemo(() => events.find((e) => e.id === eventId), [events, eventId]);

  async function loadEvents() {
    const r = await fetch("/api/events");
    const d = await r.json();
    setEvents(d);
    if (!eventId && d.length) setEventId(sp.get("event") || d[0].id);
  }

  async function loadAll(id: string) {
    if (!id) return;
    setLoading(true);
    const [p, j, b, s, v, c, f, a, ai, m] = await Promise.all([
      fetch(`/api/projects?eventId=${id}`).then((r) => r.json()),
      fetch(`/api/judges?eventId=${id}`).then((r) => r.json()),
      fetch(`/api/leaderboard/${id}`).then((r) => r.json()),
      fetch(`/api/scores?eventId=${id}`).then((r) => r.json()),
      fetch(`/api/visitors?eventId=${id}`).then((r) => r.json()),
      fetch(`/api/certificates?eventId=${id}`).then((r) => r.json()),
      fetch(`/api/feedback?eventId=${id}`).then((r) => r.json()),
      fetch(`/api/analytics/${id}`).then((r) => r.json()),
      fetch(`/api/ai/summary/${id}`).then((r) => r.json()),
      fetch(`/api/ai/match?eventId=${id}`).then((r) => r.json()),
    ]);
    setProjects(p); setJudges(j); setBoard(b); setScores(s); setVisitors(v);
    setCerts(c); setFeedback(f); setAnalytics(a); setAiSummary(ai); setMatchMatrix(m.matrix || []);
    setLoading(false);
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
    const id = setInterval(async () => {
      const b = await fetch(`/api/leaderboard/${eventId}`).then((r) => r.json());
      setBoard(b);
      const s = await fetch(`/api/scores?eventId=${eventId}`).then((r) => r.json());
      setScores(s);
    }, 5000);
    return () => clearInterval(id);
  }, [eventId, tab]);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(""), 3500);
  }

  async function createEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"), type: fd.get("type"), tagline: fd.get("tagline"),
        venue: fd.get("venue"), city: fd.get("city"), status: "live",
      }),
    });
    const d = await r.json();
    await loadEvents();
    setEventId(d.id);
    setShowEventModal(false);
    flash("Event kernel booted — share the registration link!");
  }

  async function createJudge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/judges", {
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
    setShowJudgeModal(false);
    loadAll(eventId);
    flash("Judge onboarded with a login code");
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
      body: JSON.stringify(top.map((p, i) => ({
        eventId, projectId: p.id, recipientName: `${p.teamName} — ${p.leaderName}`,
        role: "winner", title: `${medals[i]} · ${p.title}`,
      }))),
    });
    loadAll(eventId);
    flash("Top-3 winner certificates issued");
  }

  const maxHour = Math.max(1, ...Object.values(analytics?.hourly || { x: 1 }));
  const maxCat = Math.max(1, ...Object.values(analytics?.byCategory || { x: 1 }));

  if (authLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 text-center">
        <div className="glass inline-block rounded-2xl px-6 py-4 font-mono text-xs text-white/60 animate-pulse">
          Authenticating Admin OS credentials…
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-32">
        <div className="glass-strong rounded-3xl border border-rose-500/20 p-8 md:p-12 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="font-display mt-6 text-2xl font-black text-white md:text-3xl">
            Admin OS Access Restricted
          </h1>
          <p className="mt-3 text-sm text-white/60 leading-relaxed max-w-md mx-auto">
            {user ? (
              <>
                You are signed in as <strong className="text-white">{user.name}</strong> with the{" "}
                <span className="font-mono rounded bg-white/10 px-2 py-0.5 text-amber-300 uppercase font-bold text-xs">
                  {user.role}
                </span>{" "}
                role. Managing events, creating judges, and accessing master controls requires Administrator credentials.
              </>
            ) : (
              <>
                You must be signed in with an Administrator account to access the Event Intelligence Control Room.
              </>
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user?.role === "judge" && (
              <Link
                href="/judge"
                className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-white transition shadow-lg"
              >
                Go to Jury Portal
              </Link>
            )}
            {user?.role === "participant" && (
              <Link
                href="/participant"
                className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-white transition shadow-lg"
              >
                Go to Participant Dashboard
              </Link>
            )}
            {user?.role === "visitor" && (
              <Link
                href="/visitor"
                className="rounded-xl bg-[#c8f31d] px-5 py-2.5 text-xs font-bold text-black hover:bg-white transition shadow-lg"
              >
                Go to Explore Feed
              </Link>
            )}
            <Link
              href="/login?role=admin"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Sign In as Administrator
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28">
      {/* header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#c8f31d]">// Organizer OS · control room</div>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">Mission control</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="glass max-w-xs rounded-xl px-4 py-3 text-sm font-semibold outline-none">
            {events.map((e) => (
              <option key={e.id} value={e.id} className="bg-[#0b0f1d]">{e.name}</option>
            ))}
          </select>
          <button onClick={() => setShowEventModal(true)} className="flex items-center gap-1.5 rounded-xl bg-[#c8f31d] px-4 py-3 text-sm font-bold text-black hover:bg-white">
            <Plus className="h-4 w-4" /> New event
          </button>
          <button onClick={() => eventId && loadAll(eventId)} className="glass rounded-xl p-3 hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {ev && (
        <div className="glass mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-5 py-3.5 text-[13px] text-white/60">
          <span className="font-mono rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/70">{ev.type}</span>
          <span>{ev.venue} · {ev.city}</span>
          <Link href={`/register/${ev.id}`} className="flex items-center gap-1 text-[#c8f31d] hover:text-white">Public registration link <ExternalLink className="h-3 w-3" /></Link>
          <Link href={`/feedback/${ev.id}`} className="flex items-center gap-1 text-cyan-300 hover:text-white">Feedback wall <ExternalLink className="h-3 w-3" /></Link>
          <span className="font-mono ml-auto hidden items-center gap-1.5 text-[11px] text-emerald-300 md:flex"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-emerald-400" /> KERNEL LIVE</span>
        </div>
      )}

      {msg && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#c8f31d]/40 bg-[#c8f31d]/10 px-5 py-3 text-sm font-medium text-[#c8f31d]">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </div>
      )}

      {/* tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === t.k ? "bg-[#c8f31d] text-black" : "glass text-white/65 hover:text-white"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.k === "scoring" && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-red-500" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {tab === "overview" && analytics && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { l: "Teams", v: analytics.totals.projects, d: `${board.length} on leaderboard`, icon: FolderKanban, c: "text-[#c8f31d]" },
                  { l: "Check-in rate", v: `${analytics.totals.checkinRate}%`, d: `${analytics.totals.checkedIn}/${analytics.totals.visitors} inside`, icon: ScanLine, c: "text-emerald-300" },
                  { l: "QR scans", v: analytics.totals.scans, d: `${analytics.totals.totalViews} profile views`, icon: QrIcon, c: "text-cyan-300" },
                  { l: "Avg rating", v: analytics.totals.avgRating || "—", d: `${analytics.totals.feedback} feedback notes`, icon: TrendingUp, c: "text-amber-300" },
                ].map((s) => (
                  <div key={s.l} className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{s.l}</span>
                      <s.icon className={`h-4 w-4 ${s.c}`} />
                    </div>
                    <div className="font-display mt-2 text-3xl font-bold tabular-nums">{s.v}</div>
                    <div className="mt-1 text-xs text-white/45">{s.d}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold">Footfall by hour (QR scans)</h3>
                  <div className="mt-5 flex h-36 items-end gap-1.5">
                    {Object.entries(analytics.hourly).length === 0 && <p className="text-sm text-white/40">Scans will stream here during the event.</p>}
                    {Object.entries(analytics.hourly).sort().map(([h, v]) => (
                      <div key={h} className="group relative flex-1">
                        <div className="rounded-t-md bg-gradient-to-t from-cyan-500/60 to-[#c8f31d]" style={{ height: `${Math.max(8, (Number(v) / maxHour) * 130)}px` }} />
                        <div className="font-mono mt-1.5 text-center text-[9px] text-white/35">{h}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold">Teams per category</h3>
                  <div className="mt-4 space-y-3">
                    {Object.entries(analytics.byCategory).map(([c, v]) => (
                      <div key={c}>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-medium">{c}</span>
                          <span className="font-mono text-white/50">{v}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-[#c8f31d]" style={{ width: `${(Number(v) / maxCat) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold">Hottest booths right now</h3>
                  <div className="mt-4 space-y-2.5">
                    {analytics.topProjects.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                        <span className={`font-display text-lg font-bold ${i === 0 ? "text-[#c8f31d]" : "text-white/25"}`}>{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{p.title}</div>
                          <div className="text-xs text-white/40">{p.team}</div>
                        </div>
                        <span className="font-mono text-[11px] text-cyan-300">{p.checkins} scans</span>
                        <span className="font-mono text-[11px] text-white/40">{p.views} views</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold">AI sentiment radar</h3>
                  {aiSummary ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-4">
                        <div className="font-display text-5xl font-bold text-[#c8f31d]">{aiSummary.score}<span className="text-lg text-white/40">/100</span></div>
                        <p className="text-sm leading-relaxed text-white/60">{aiSummary.headline}</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <span className="font-mono rounded-lg bg-emerald-400/10 px-3 py-1.5 text-[11px] text-emerald-300">▲ {aiSummary.positive} positive</span>
                        <span className="font-mono rounded-lg bg-white/5 px-3 py-1.5 text-[11px] text-white/50">● {aiSummary.neutral} neutral</span>
                        <span className="font-mono rounded-lg bg-rose-400/10 px-3 py-1.5 text-[11px] text-rose-300">▼ {aiSummary.negative} negative</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {aiSummary.keywords.map((k) => (
                          <span key={k.word} className="font-mono rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/70">#{k.word} ×{k.count}</span>
                        ))}
                      </div>
                    </div>
                  ) : <p className="mt-4 text-sm text-white/40">Collecting feedback…</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "projects" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">{projects.length} registered teams · click QR to preview booth identity</p>
                {ev && <Link href={`/register/${ev.id}`} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold hover:bg-white/20"><Plus className="h-3.5 w-3.5" /> Add team</Link>}
              </div>
              {projects.map((p) => (
                <div key={p.id} className="glass flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 font-display text-lg font-bold">
                    {p.teamName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold">{p.title}</span>
                      <span className="font-mono rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/60">{p.category}</span>
                      <span className="font-mono rounded bg-[#c8f31d]/15 px-2 py-0.5 text-[10px] text-[#c8f31d]">{p.boothNo}</span>
                    </div>
                    <div className="mt-1 truncate text-[13px] text-white/50">{p.teamName} · {p.leaderName} · {p.techStack.slice(0, 4).join(" · ")}</div>
                  </div>
                  <div className="font-mono flex gap-4 text-[11px] text-white/50">
                    <span><b className="text-white">{p.views}</b> views</span>
                    <span><b className="text-cyan-300">{p.checkins}</b> scans</span>
                    <span><b className="text-amber-300">{p.votes}</b> votes</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setQrProject(p)} className="flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-semibold hover:bg-white/10">
                      <QrIcon className="h-3.5 w-3.5" /> {p.code}
                    </button>
                    <Link href={`/p/${p.code}`} target="_blank" className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20"><ExternalLink className="h-4 w-4" /></Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "judges" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">Judging panel ({judges.length})</h3>
                  <button onClick={() => setShowJudgeModal(true)} className="flex items-center gap-1.5 rounded-xl bg-[#c8f31d] px-4 py-2 text-[13px] font-bold text-black hover:bg-white"><Plus className="h-3.5 w-3.5" /> Add judge</button>
                </div>
                <div className="mt-4 space-y-3">
                  {judges.map((j) => (
                    <div key={j.id} className="glass flex items-center gap-4 rounded-2xl p-4">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br font-display font-bold ${j.avatarColor}`}>
                        {j.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{j.name}</div>
                        <div className="truncate text-xs text-white/45">{j.organization}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {j.expertise.map((e) => (
                            <span key={e} className="font-mono rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/65">{e}</span>
                          ))}
                        </div>
                      </div>
                      <span className="font-mono shrink-0 rounded-lg border border-dashed border-white/20 px-2 py-1 text-[10px] text-[#c8f31d]">{j.code}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-fuchsia-300" />
                  <h3 className="font-display text-lg font-bold">JudgeMatch AI — suggested panels</h3>
                </div>
                <p className="mt-1 text-[13px] text-white/50">Expertise × category × tech affinity. Top-3 judges per project with reasoning.</p>
                <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {matchMatrix.map((m) => (
                    <div key={m.projectId} className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{m.title}</span>
                        <span className="font-mono rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/60">{m.category}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {m.topJudges.map((t, i) => (
                          <div key={t.judgeId} className="flex items-center gap-3">
                            <span className={`font-mono text-[10px] ${i === 0 ? "text-[#c8f31d]" : "text-white/35"}`}>#{i + 1}</span>
                            <span className="flex-1 truncate text-[13px] text-white/80">{t.judgeName}</span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${t.score}%` }} />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-white/80">{t.score}%</span>
                          </div>
                        ))}
                        <p className="font-mono mt-2 text-[10px] leading-relaxed text-white/40">↳ {m.topJudges[0]?.reasons.join(" · ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "scoring" && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display flex items-center gap-2 text-lg font-bold">
                    <span className="h-2 w-2 animate-blink rounded-full bg-red-500" /> Live leaderboard
                  </h3>
                  <span className="font-mono text-[11px] text-white/40">auto-refresh 5s</span>
                </div>
                <div className="mt-4 space-y-2">
                  {board.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${i === 0 ? "border-[#c8f31d]/50 bg-[#c8f31d]/[0.07]" : i < 3 ? "border-white/15 bg-white/[0.04]" : "border-white/5 bg-white/[0.02]"}`}>
                      <span className={`font-display w-8 text-xl font-bold ${i === 0 ? "text-[#c8f31d]" : "text-white/25"}`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold">{p.title}</span>
                          {p.flags > 0 && <span className="font-mono flex items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300"><ShieldAlert className="h-3 w-3" /> {p.flags}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span>{p.teamName}</span>
                          <span>·</span>
                          <span className={p.judgeCount < judges.length ? "text-amber-300 font-mono" : "text-emerald-300 font-mono"}>
                            {p.judgeCount} / {judges.length} judges
                          </span>
                          {judges.length > p.judgeCount && (
                            <span className="font-mono rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300">
                              {judges.length - p.judgeCount} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-display text-xl font-bold tabular-nums">{p.avgScore.toFixed(1)}</span>
                    </div>
                  ))}
                  {!board.length && <p className="py-8 text-center text-sm text-white/40">No scores yet — judges score from the Judge Portal.</p>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display flex items-center gap-2 text-lg font-bold"><AlertTriangle className="h-4 w-4 text-amber-300" /> FairScore alerts ({scores.filter((s) => s.flagged).length})</h3>
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                    {scores.filter((s) => s.flagged).map((s) => {
                      const p = projects.find((x) => x.id === s.projectId);
                      const j = judges.find((x) => x.id === s.judgeId);
                      return (
                        <div key={s.id} className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-[13px]">
                          <div className="font-semibold">{p?.title} <span className="font-normal text-white/45">by {j?.name}</span></div>
                          <div className="font-mono mt-1 text-[11px] leading-relaxed text-amber-200/90">{s.flagReason}</div>
                        </div>
                      );
                    })}
                    {!scores.some((s) => s.flagged) && <p className="text-sm text-white/40">No bias detected. All scores within fair bands.</p>}
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold">Score stream</h3>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {scores.slice(0, 20).map((s) => {
                      const p = projects.find((x) => x.id === s.projectId);
                      const j = judges.find((x) => x.id === s.judgeId);
                      return (
                        <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[13px]">
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold">{p?.title || "—"}</span>
                            <span className="text-white/40"> · {j?.name || "judge"}</span>
                            {s.comment && <div className="truncate text-xs italic text-white/35">&ldquo;{s.comment}&rdquo;</div>}
                          </div>
                          <span className="font-display font-bold tabular-nums">{s.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "visitors" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-2xl p-5">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Registered</div>
                    <div className="font-display mt-1 text-3xl font-bold">{visitors.length}</div>
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Inside now</div>
                    <div className="font-display mt-1 text-3xl font-bold text-emerald-300">{visitors.filter((v) => v.checkedIn).length}</div>
                  </div>
                </div>
                {/* Common Event Gate Entrance QR Code */}
                <div className="glass rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#c8f31d]">
                      Entrance Gate Pass
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Common QR for All Visitors
                    </span>
                  </div>
                  <h3 className="font-display mt-2 text-base font-bold text-white">
                    Event Gate Entrance QR Code
                  </h3>
                  <p className="mt-1 text-xs text-white/50">
                    Print or display this single QR code at the entrance. Visitors scan with their phones to self-register in 10 seconds!
                  </p>

                  <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow-2xl">
                    <QrCode
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/gate/${ev?.id || eventId}`
                          : `https://nexathon.live/gate/${ev?.id || eventId}`
                      }
                      size={160}
                    />
                  </div>

                  <div className="font-mono mt-2 text-[11px] text-emerald-300">
                    /gate/{ev?.id || eventId}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/gate/${ev?.id || eventId}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c8f31d] px-3 py-2.5 text-xs font-bold text-black hover:bg-white transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Test Gate Pass</span>
                    </Link>

                    <Link
                      href="/checkin"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      <span>Gate Terminal</span>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold">Visitor registry</h3>
                <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
                  {visitors.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${v.checkedIn ? "bg-emerald-400" : "bg-white/20"}`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold">{v.name}</span>
                        <span className="font-mono ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">{v.type}</span>
                      </div>
                      <span className="font-mono hidden text-[10px] text-white/40 md:block">{v.interests.slice(0, 2).join(" · ")}</span>
                      <span className="font-mono text-[11px] text-cyan-300">{v.code}</span>
                    </div>
                  ))}
                  {!visitors.length && <p className="py-8 text-center text-sm text-white/40">No visitors yet.</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "certs" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
              <div className="space-y-4">
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold">Issue certificates</h3>
                  <p className="mt-1 text-[13px] text-white/50">Every certificate gets a unique code + QR verification page.</p>
                  <button onClick={() => setShowCertModal(true)} className="mt-4 w-full rounded-xl bg-[#c8f31d] px-4 py-3 text-sm font-bold text-black hover:bg-white">+ Issue single certificate</button>
                  <button onClick={bulkCertifyTop3} className="glass mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/10">🏆 Auto-certify Top 3 winners</button>
                </div>
                <div className="glass rounded-2xl p-6">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Issued so far</div>
                  <div className="font-display mt-1 text-4xl font-bold">{certs.length}</div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold">Issued credentials</h3>
                <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
                  {certs.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <Award className={`h-5 w-5 shrink-0 ${c.role === "winner" ? "text-amber-300" : "text-cyan-300"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{c.recipientName}</div>
                        <div className="truncate text-xs text-white/45">{c.title} · {c.role}</div>
                      </div>
                      <span className="font-mono text-[11px] text-[#c8f31d]">{c.code}</span>
                      <Link href={`/verify/${c.code}`} target="_blank" className="rounded-lg bg-white/10 p-2 hover:bg-white/20"><Printer className="h-4 w-4" /></Link>
                    </div>
                  ))}
                  {!certs.length && <p className="py-8 text-center text-sm text-white/40">No certificates yet — issue the first one.</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "feedback" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <div className="glass h-fit rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-fuchsia-300" />
                  <h3 className="font-display text-lg font-bold">AI insight report</h3>
                </div>
                {aiSummary && (
                  <div className="mt-4">
                    <div className="font-display text-5xl font-bold text-[#c8f31d]">{aiSummary.score}<span className="text-lg text-white/40">/100</span></div>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{aiSummary.headline}</p>
                    <div className="mt-4 space-y-2 text-[13px]">
                      <div className="flex justify-between rounded-lg bg-emerald-400/10 px-3 py-2"><span>Positive signals</span><b className="text-emerald-300">{aiSummary.positive}</b></div>
                      <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2"><span>Neutral</span><b>{aiSummary.neutral}</b></div>
                      <div className="flex justify-between rounded-lg bg-rose-400/10 px-3 py-2"><span>Needs attention</span><b className="text-rose-300">{aiSummary.negative}</b></div>
                    </div>
                    <div className="mt-4">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Trending themes</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {aiSummary.keywords.map((k) => (
                          <span key={k.word} className="font-mono rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-[11px] text-fuchsia-200">#{k.word} ×{k.count}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">Raw feedback ({feedback.length})</h3>
                  {ev && <Link href={`/feedback/${ev.id}`} className="text-[13px] text-cyan-300 hover:text-white">Public wall →</Link>}
                </div>
                <div className="mt-4 max-h-[560px] space-y-2.5 overflow-y-auto">
                  {feedback.map((f) => (
                    <div key={f.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{f.authorName}</span>
                        <span className="font-mono rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">{f.authorRole}</span>
                        <span className={`font-mono ml-auto rounded px-2 py-0.5 text-[10px] ${f.sentiment === "positive" ? "bg-emerald-400/15 text-emerald-300" : f.sentiment === "negative" ? "bg-rose-400/15 text-rose-300" : "bg-white/10 text-white/50"}`}>
                          {f.sentiment} · ★{f.rating}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/70">{f.message}</p>
                    </div>
                  ))}
                  {!feedback.length && <p className="py-8 text-center text-sm text-white/40">No feedback yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR modal */}
      {qrProject && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setQrProject(null)}>
          <div className="glass-strong w-full max-w-sm rounded-3xl p-7 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Booth identity</span>
              <button onClick={() => setQrProject(null)} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <h3 className="font-display mt-2 text-xl font-bold">{qrProject.title}</h3>
            <p className="font-mono mt-1 text-xs text-white/50">{qrProject.boothNo} · {qrProject.code}</p>
            <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4">
              <QrCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${qrProject.code}`} size={200} />
            </div>
            <p className="mt-4 text-xs text-white/45">Print & stick on the booth. Scans open the live project story.</p>
            <Link href={`/p/${qrProject.code}`} target="_blank" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#c8f31d] px-4 py-3 text-sm font-bold text-black hover:bg-white">
              Open project page <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Event modal */}
      {showEventModal && (
        <Modal onClose={() => setShowEventModal(false)} title="Boot a new event kernel">
          <form onSubmit={createEvent} className="space-y-3">
            <Field label="Event name"><input name="name" required placeholder="e.g. InnovateX Hackathon '26" className="inp" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="type" className="inp">
                  <option>hackathon</option><option>expo</option><option>conference</option>
                  <option>techfest</option><option>tradefair</option><option>cultural</option>
                </select>
              </Field>
              <Field label="City"><input name="city" placeholder="Bengaluru" className="inp" /></Field>
            </div>
            <Field label="Tagline"><input name="tagline" placeholder="One line that sells the event" className="inp" /></Field>
            <Field label="Venue"><input name="venue" placeholder="Main Auditorium + Grounds" className="inp" /></Field>
            <button className="w-full rounded-xl bg-[#c8f31d] py-3.5 text-sm font-bold text-black hover:bg-white">Boot event →</button>
          </form>
        </Modal>
      )}

      {/* Judge modal */}
      {showJudgeModal && (
        <Modal onClose={() => setShowJudgeModal(false)} title="Onboard a judge">
          <form onSubmit={createJudge} className="space-y-3">
            <Field label="Full name"><input name="name" required placeholder="Dr. Jane Doe" className="inp" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Organisation"><input name="org" placeholder="Google · Sequoia · Bosch" className="inp" /></Field>
              <Field label="Email"><input name="email" type="email" placeholder="jane@org.com" className="inp" /></Field>
            </div>
            <Field label="Expertise (comma separated)"><input name="expertise" placeholder="AI/ML, FinTech, Product" className="inp" /></Field>
            <button className="w-full rounded-xl bg-[#c8f31d] py-3.5 text-sm font-bold text-black hover:bg-white">Generate judge login code →</button>
          </form>
        </Modal>
      )}

      {/* Cert modal */}
      {showCertModal && (
        <Modal onClose={() => setShowCertModal(false)} title="Issue certificate">
          <form onSubmit={issueCert} className="space-y-3">
            <Field label="Recipient name"><input name="name" required placeholder="Aarav Sharma" className="inp" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <select name="role" className="inp">
                  <option>participant</option><option>winner</option><option>judge</option>
                  <option>mentor</option><option>volunteer</option><option>organizer</option>
                </select>
              </Field>
              <Field label="Title"><input name="title" placeholder="National Finalist — Nexathon '26" className="inp" /></Field>
            </div>
            <button className="w-full rounded-xl bg-[#c8f31d] py-3.5 text-sm font-bold text-black hover:bg-white">Issue with QR verification →</button>
          </form>
        </Modal>
      )}

      <style>{`.inp{width:100%;border-radius:0.75rem;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.4);padding:0.75rem 1rem;font-size:0.875rem;outline:none;color:#fff}.inp:focus{border-color:#c8f31d}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
      {children}
    </label>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong w-full max-w-md rounded-3xl p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ConsolePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 pt-28">Loading console…</main>}>
      <ConsoleInner />
    </Suspense>
  );
}
