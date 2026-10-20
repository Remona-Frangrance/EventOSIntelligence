"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Gavel,
  Trophy,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Star,
  ExternalLink,
  Code2,
  Globe,
  Sliders,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FolderKanban,
} from "lucide-react";

type Judge = {
  id: string;
  name: string;
  organization: string;
  eventId: string;
  expertise: string[];
  code: string;
  assignedCategories?: string[];
};

type Project = {
  id: string;
  title: string;
  teamName: string;
  category: string;
  description: string;
  techStack: string[];
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  boothNo: string;
  code: string;
};

type Criterion = { key: string; label: string; max: number; weight: number };

export default function JudgePage() {
  const { user, loginJudge } = useAuth();

  const [code, setCode] = useState("");
  const [judge, setJudge] = useState<Judge | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [board, setBoard] = useState<{ id: string; title: string; avgScore: number; judgeCount: number }[]>([]);
  const [myScores, setMyScores] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Project | null>(null);
  const [vals, setVals] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<{ flagged: boolean; reason: string } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [allJudges, setAllJudges] = useState<any[]>([]);
  const [eventName, setEventName] = useState("");
  const [projectScores, setProjectScores] = useState<any[]>([]);
  const [filterCat, setFilterCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Default criteria fallback
  const defaultCriteria: Criterion[] = [
    { key: "innovation", label: "Innovation & Novelty", max: 10, weight: 1.2 },
    { key: "execution", label: "Technical Execution", max: 10, weight: 1.0 },
    { key: "impact", label: "Market Impact & Scale", max: 10, weight: 1.0 },
    { key: "pitch", label: "Product Demo & Pitch", max: 10, weight: 0.8 },
  ];

  async function loadJudgeData(judgeCode: string) {
    setError("");
    const cleanCode = judgeCode.trim().toUpperCase();
    try {
      const r = await fetch(`/api/judges?code=${cleanCode}`);
      if (!r.ok) {
        setError("Invalid judge code.");
        return;
      }
      const j = await r.json();
      setJudge(j);

      const targetEventId = j.eventId || "ev-nexathon-26";
      const [pRes, evRes, bRes, msRes, allJRes] = await Promise.all([
        fetch(`/api/projects?eventId=${targetEventId}`).then((x) => x.json()),
        fetch(`/api/events/${targetEventId}`).then((x) => x.json()).catch(() => ({})),
        fetch(`/api/leaderboard/${targetEventId}`).then((x) => x.json()).catch(() => []),
        fetch(`/api/scores?judgeId=${j.id}`).then((x) => x.json()).catch(() => []),
        fetch(`/api/judges?eventId=${targetEventId}`).then((x) => x.json()).catch(() => []),
      ]);

      const loadedProjects = Array.isArray(pRes) ? pRes : [];
      setProjects(loadedProjects);
      setEventName(evRes?.name || "");
      setCriteria(evRes.scoringCriteria && evRes.scoringCriteria.length > 0 ? evRes.scoringCriteria : defaultCriteria);
      setBoard(Array.isArray(bRes) ? bRes : []);
      
      // Real judges assigned to this specific event (at least current judge)
      const eventJudges = Array.isArray(allJRes) && allJRes.length > 0 ? allJRes : [j];
      setAllJudges(eventJudges);

      const map: Record<string, number> = {};
      (Array.isArray(msRes) ? msRes : []).forEach((s: { projectId: string; total: number }) => {
        map[s.projectId] = s.total;
      });
      setMyScores(map);

      if (loadedProjects.length > 0) {
        setSelected(loadedProjects[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      setError("Failed to load judge workspace");
    }
  }

  useEffect(() => {
    // Check if a specific code was passed in the query string
    const codeParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("code") : null;
    if (codeParam) {
      loadJudgeData(codeParam);
    } else if (user?.role === "judge" && user.judgeCode) {
      loadJudgeData(user.judgeCode);
    } else {
      loadJudgeData("JUDGE-A1B2");
    }
  }, [user]);

  useEffect(() => {
    if (selected) {
      const activeCriteria = criteria.length > 0 ? criteria : defaultCriteria;
      const init: Record<string, number> = {};
      activeCriteria.forEach((c) => (init[c.key] = 8));
      setVals(init);
      setComment("");
      setResult(null);

      fetch(`/api/scores?projectId=${selected.id}`)
        .then((r) => r.json())
        .then((d) => setProjectScores(Array.isArray(d) ? d : []))
        .catch(() => setProjectScores([]));
    }
  }, [selected, criteria]);

  async function submit() {
    if (!judge || !selected) return;
    try {
      const r = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: judge.eventId || "ev-nexathon-26",
          projectId: selected.id,
          judgeId: judge.id,
          criteriaScores: vals,
          comment,
        }),
      });
      const d = await r.json();
      setResult({ flagged: d.ai?.flagged || d.flagged, reason: d.ai?.reason || d.flagReason });
      setMyScores((m) => ({ ...m, [selected.id]: d.total }));

      fetch(`/api/scores?projectId=${selected.id}`)
        .then((rx) => rx.json())
        .then((dx) => setProjectScores(Array.isArray(dx) ? dx : []))
        .catch(() => {});
      setMyScores((m) => ({ ...m, [selected.id]: d.total }));

      const b = await fetch(`/api/leaderboard/${judge.eventId || "ev-nexathon-26"}`).then((x) => x.json());
      setBoard(Array.isArray(b) ? b : []);
    } catch {
      alert("Failed to submit score");
    } finally {
      setSaving(false);
    }
  }

  const activeCriteria = criteria.length > 0 ? criteria : defaultCriteria;
  const currentTotal = Object.values(vals).reduce((a, b) => a + b, 0);

  const filteredProjects = projects.filter((p) => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <main className="relative min-h-screen px-4 pb-28 pt-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/3 top-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/15 blur-[150px]" />

      <div className="mx-auto max-w-7xl">
        {/* Top Header & 4-Judge Switcher Bar */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono rounded-lg bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  ⚖️ Official Grand Jury Pad
                </span>
                <span className="font-mono rounded-lg bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70">
                  {allJudges.length} {allJudges.length === 1 ? "Judge" : "Judges"} Active
                </span>
              </div>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                Jury Portal:{" "}
                <span className="text-amber-300">{judge?.name || "Official Judge"}</span>
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {eventName && <span className="font-bold text-white/90 mr-2">[{eventName}]</span>}
                {judge?.organization || "Jury Panel"} · Code:{" "}
                <span className="font-mono font-bold text-white">{judge?.code}</span> ·{" "}
                <span className="text-[#c8f31d] font-semibold">
                  {Object.keys(myScores).length} of {projects.length} projects scored by you
                </span>
              </p>
            </div>

            <Link
              href="/certificates"
              className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition self-start md:self-auto"
            >
              <Trophy className="h-4 w-4" />
              <span>View Live Event Leaderboard</span>
            </Link>
          </div>

          {/* Event Judges Switcher Bar */}
          {allJudges.length > 1 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                  Switch Between Onboarded Judges ({allJudges.length}):
                </span>
                <span className="text-[10px] font-mono text-amber-300">{allJudges.length} Judges in Panel</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {allJudges.map((aj) => {
                  const isActive = judge?.code === aj.code;
                  return (
                    <button
                      key={aj.code}
                      type="button"
                      onClick={() => loadJudgeData(aj.code)}
                      className={`flex flex-col rounded-xl border p-2.5 text-left transition ${
                        isActive
                          ? "border-amber-400 bg-amber-400/15 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate mr-1">{aj.name}</span>
                        <span className="font-mono text-[10px] text-amber-300 shrink-0">{aj.code}</span>
                      </div>
                      <span className="text-[10px] text-white/50 truncate">
                        {aj.organization || (aj.expertise && aj.expertise[0]) || "Official Judge"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-white/60">Official Event Judge:</span>
                <span className="text-xs font-bold text-amber-300">{judge?.name}</span>
                <span className="font-mono text-[10px] text-white/50">({judge?.code})</span>
              </div>
              <span className="text-[11px] text-[#c8f31d]">1 Judge Assigned</span>
            </div>
          )}
        </div>

        {/* Workspace: Left Projects List, Right Scoring Sheet */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: All Projects Grid/List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">All Submitted Projects</h3>
                <p className="text-xs text-white/50">Select any project to inspect details & score</p>
              </div>
              <span className="font-mono text-xs rounded-lg bg-white/10 px-2 py-0.5 text-white/70">
                {filteredProjects.length} Projects
              </span>
            </div>

            {/* Filter & Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search project or team…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              >
                <option value="all">All Tracks</option>
                <option value="AI/ML">AI/ML</option>
                <option value="HealthTech">HealthTech</option>
                <option value="IoT">IoT</option>
                <option value="FinTech">FinTech</option>
                <option value="GreenTech">GreenTech</option>
              </select>
            </div>

            {/* Project Cards List */}
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <h4 className="font-display mt-4 text-base font-bold text-white">No Projects Registered Yet</h4>
                  <p className="mt-1 text-xs text-white/50 max-w-xs mx-auto">
                    {eventName ? `"${eventName}"` : "This event"} does not have any projects registered yet, or no projects match your track filter.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Link
                      href={`/register${judge?.eventId ? `?eventId=${judge.eventId}` : ""}`}
                      className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-white transition"
                    >
                      + Submit Project to this Event
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setFilterCat("all"); setSearchQuery(""); }}
                      className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
              ) : (
                filteredProjects.map((p) => {
                const isSelected = selected?.id === p.id;
                const myScore = myScores[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono rounded-md bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                            {p.category}
                          </span>
                          <span className="font-mono rounded-md bg-black/40 px-2 py-0.5 text-[10px] text-white/60">
                            Booth {p.boothNo}
                          </span>
                        </div>
                        <h4 className="font-display mt-1.5 text-sm font-bold text-white line-clamp-1">
                          {p.title}
                        </h4>
                        <div className="text-xs text-white/50">{p.teamName}</div>
                      </div>

                      {myScore ? (
                        <div className="rounded-xl bg-[#c8f31d]/20 px-2.5 py-1 text-right">
                          <div className="text-[10px] font-mono text-[#c8f31d] uppercase font-bold">Scored</div>
                          <div className="font-mono text-xs font-extrabold text-white">{myScore}/40</div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/20 px-2 py-1 text-[10px] font-mono text-white/40">
                          Pending
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Links row */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {p.demoUrl && (
                          <a
                            href={p.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 font-mono text-[10px] text-cyan-300 hover:underline"
                          >
                            <Globe className="h-3 w-3" /> Demo
                          </a>
                        )}
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 font-mono text-[10px] text-white/60 hover:underline"
                          >
                            <Code2 className="h-3 w-3" /> Code
                          </a>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-white/40">{p.code}</span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Right Column: Scoring Sheet & Details of Selected Project (7 cols) */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="glass-strong rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
                {/* Selected Project Overview Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                        {selected.category}
                      </span>
                      <span className="font-mono rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                        Booth {selected.boothNo}
                      </span>
                      <span className="font-mono rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                        {selected.code}
                      </span>
                    </div>
                    <h3 className="font-display mt-2 text-2xl font-bold text-white">
                      {selected.title}
                    </h3>
                    <p className="text-xs text-white/60">by {selected.teamName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selected.demoUrl && (
                      <a
                        href={selected.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                    {selected.repoUrl && (
                      <a
                        href={selected.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Repo</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Project Image Banner if available */}
                {selected.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={selected.imageUrl}
                      alt={selected.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-[11px] text-white/80 line-clamp-1">
                      {selected.description}
                    </div>
                  </div>
                )}

                <p className="text-xs leading-relaxed text-white/75 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  {selected.description}
                </p>

                {/* Jury Evaluation Status Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                      // Event Jury Status ({projectScores.length} / {allJudges.length} Evaluated)
                    </span>
                    <span className="font-mono text-[11px] text-white/50">Jury Panel</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {allJudges.map((jItem) => {
                      const sc = projectScores.find((s) => s.judgeId === jItem.id || s.judgeId === jItem.code);
                      const isCurrentJudge = jItem.code === judge?.code || jItem.id === judge?.id;
                      return (
                        <div
                          key={jItem.code || jItem.id}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition ${
                            sc
                              ? "border-[#c8f31d]/30 bg-[#c8f31d]/[0.05]"
                              : "border-white/10 bg-white/[0.02]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate">{jItem.name}</span>
                              {isCurrentJudge && (
                                <span className="font-mono text-[9px] bg-[#c8f31d]/20 text-[#c8f31d] px-1.5 py-0.5 rounded font-extrabold">YOU</span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/40 truncate">{jItem.organization || jItem.org}</div>
                          </div>
                          {sc ? (
                            <span className="font-mono text-xs font-extrabold text-[#c8f31d] shrink-0 ml-2">
                              ✓ {sc.total}/40
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-rose-300/80 bg-rose-500/10 px-2 py-0.5 rounded shrink-0 ml-2">
                              ⏳ Not Scored Yet
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scoring Criteria Inputs */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                      // Criteria Evaluation (Out of 10)
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white">
                      Current Total: <span className="text-amber-300">{currentTotal}</span> / 40
                    </span>
                  </div>

                  <div className="space-y-4">
                    {activeCriteria.map((c) => {
                      const val = vals[c.key] ?? 7;
                      return (
                        <div
                          key={c.key}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white">{c.label}</div>
                              <div className="font-mono text-[10px] text-white/40">
                                Weight: {c.weight}x · Max: {c.max} pts
                              </div>
                            </div>
                            <div className="font-mono text-xl font-extrabold text-amber-300">
                              {val} <span className="text-xs text-white/40">/ 10</span>
                            </div>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={val}
                            onChange={(e) =>
                              setVals({ ...vals, [c.key]: Number(e.target.value) })
                            }
                            className="mt-3 w-full accent-amber-400 cursor-pointer"
                          />
                          <div className="flex justify-between font-mono text-[9px] text-white/30">
                            <span>1 (Poor)</span>
                            <span>5 (Average)</span>
                            <span>8 (Strong)</span>
                            <span>10 (Exceptional)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comment & Constructive Feedback */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                      Jury Feedback & Evaluation Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share constructive feedback on technical execution, innovation, or pitch delivery…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* AI Outlier detection result */}
                  {result && (
                    <div
                      className={`rounded-2xl p-4 text-xs ${
                        result.flagged
                          ? "border border-amber-500/40 bg-amber-500/10 text-amber-200"
                          : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {result.flagged ? (
                          <>
                            <ShieldAlert className="h-4 w-4 text-amber-400" />
                            <span>Fair-Score AI Variance Notice</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Score Successfully Verified</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                        {result.reason || "Score recorded and aligned with fair-scoring distribution."}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={submit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 py-3.5 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-white shadow-[0_0_25px_rgba(251,191,36,0.35)] disabled:opacity-50"
                  >
                    <Gavel className="h-4 w-4" />
                    <span>
                      {saving
                        ? "Recording Score…"
                        : `Submit Score as ${judge?.name ? judge.name.split(" ")[0] : "Judge"} (${currentTotal}/40)`}
                    </span>
                  </button>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="glass-strong rounded-3xl border border-white/10 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                  <FolderKanban className="h-7 w-7" />
                </div>
                <h3 className="font-display mt-4 text-lg font-bold text-white">No Projects to Evaluate</h3>
                <p className="mt-1.5 text-xs text-white/60 max-w-sm mx-auto">
                  {eventName ? `"${eventName}"` : "This event"} currently has no submitted projects. Once teams register projects for this event, they will appear on the left column for evaluation.
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    href={`/register${judge?.eventId ? `?eventId=${judge.eventId}` : ""}`}
                    className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-white transition"
                  >
                    <span>Register a Project for this Event</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="glass-strong rounded-3xl border border-white/10 p-12 text-center text-white/50 text-xs">
                Select a project from the left column to begin evaluation.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
