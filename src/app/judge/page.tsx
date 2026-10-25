"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Check,
  AlertCircle,
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

function JudgePage() {
  const { user, loginJudge, logout } = useAuth();
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get("unauthorized") === "true";

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
    } catch {
      setError("Failed to load judge workspace");
    }
  }

  useEffect(() => {
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
    setSaving(true);
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
      {/* Unauthorized Access Banner */}
      {isUnauthorized && (
        <div className="fixed top-20 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-xl">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-100">
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-rose-900">Access Denied — Wrong Account</p>
              <p className="mt-0.5 text-xs text-rose-700">
                You&apos;re currently signed in as a <strong>Judge</strong> ({user?.email}). The{" "}
                <strong>Admin Console</strong> requires an <strong>Admin</strong> account.
                Please log out and sign in with your admin credentials.
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="shrink-0 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
            >
              Log Out &amp; Switch
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        {/* Top Header & Judge Switcher */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                  ⚖️ Jury Evaluation Pad
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {allJudges.length} Active Jurors
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Jury Portal:{" "}
                <span className="text-indigo-600">{judge?.name || "Official Judge"}</span>
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                {eventName && <span className="font-semibold text-slate-800 mr-2">[{eventName}]</span>}
                {judge?.organization || "Jury Panel"} · Passcode:{" "}
                <span className="font-mono font-semibold text-slate-800">{judge?.code}</span> ·{" "}
                <span className="text-emerald-700 font-medium">
                  {Object.keys(myScores).length} of {projects.length} scored by you
                </span>
              </p>
            </div>

            <Link
              href="/certificates"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition self-start md:self-auto"
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Event Leaderboard</span>
            </Link>
          </div>

          {/* Quick Juror Switcher */}
          {allJudges.length > 1 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Switch Active Juror Profile:
                </span>
                <span className="text-[11px] font-mono text-indigo-600 font-medium">
                  {allJudges.length} Jurors in Panel
                </span>
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
                          ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate mr-1">{aj.name}</span>
                        <span className="font-mono text-[10px] text-indigo-600 shrink-0 font-medium">{aj.code}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate mt-0.5">
                        {aj.organization || (aj.expertise && aj.expertise[0]) || "Official Judge"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Evaluation Area */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Projects Roster (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Submitted Projects</h3>
                <p className="text-xs text-slate-500">Select any project to inspect and score</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {filteredProjects.length} Projects
              </span>
            </div>

            {/* Filter & Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project or team…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-600 transition"
              >
                <option value="all">All Tracks</option>
                <option value="AI/ML">AI/ML</option>
                <option value="HealthTech">HealthTech</option>
                <option value="IoT">IoT</option>
                <option value="FinTech">FinTech</option>
                <option value="GreenTech">GreenTech</option>
              </select>
            </div>

            {/* Project Cards */}
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-slate-900">No Projects Found</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    No submitted projects match your filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setFilterCat("all"); setSearchQuery(""); }}
                    className="mt-4 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredProjects.map((p) => {
                  const isSelected = selected?.id === p.id;
                  const myScore = myScores[p.id];
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50"
                          : "border-slate-200/90 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {p.category}
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                              Booth {p.boothNo}
                            </span>
                          </div>
                          <h4 className="mt-1.5 text-xs font-semibold text-slate-900 line-clamp-1">
                            {p.title}
                          </h4>
                          <div className="text-[11px] text-slate-500">{p.teamName}</div>
                        </div>

                        {myScore ? (
                          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-right shrink-0">
                            <div className="text-[10px] font-semibold text-emerald-700 uppercase">Scored</div>
                            <div className="font-mono text-xs font-bold text-slate-900">{myScore}/40</div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 px-2 py-1 text-[10px] font-mono text-slate-400 shrink-0">
                            Pending
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-3">
                          {p.demoUrl && (
                            <a
                              href={p.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 font-medium text-indigo-600 hover:underline"
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
                              className="flex items-center gap-1 font-medium text-slate-500 hover:underline"
                            >
                              <Code2 className="h-3 w-3" /> Code
                            </a>
                          )}
                        </div>
                        <span className="font-mono text-slate-400 text-[10px]">{p.code}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Scoring Sheet (7 cols) */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
                {/* Selected Project Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase">
                        {selected.category}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Booth {selected.boothNo}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                        {selected.code}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      {selected.title}
                    </h3>
                    <p className="text-xs text-slate-500">by {selected.teamName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selected.demoUrl && (
                      <a
                        href={selected.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                      >
                        <Globe className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Live Demo</span>
                      </a>
                    )}
                    {selected.repoUrl && (
                      <a
                        href={selected.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Repo</span>
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                  {selected.description}
                </p>

                {/* Jury Evaluation Panel Status */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Jury Consensus Status ({projectScores.length} / {allJudges.length} Evaluated)
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">Jury Panel</span>
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
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 truncate">{jItem.name}</span>
                              {isCurrentJudge && (
                                <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{jItem.organization || jItem.org}</div>
                          </div>
                          {sc ? (
                            <span className="font-mono text-xs font-bold text-emerald-700 shrink-0 ml-2">
                              ✓ {sc.total}/40
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0 ml-2">
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scoring Criteria Inputs */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Scoring Rubric (10 Points Each)
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      Current Score: <span className="text-indigo-600 font-bold text-sm">{currentTotal}</span> / 40
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeCriteria.map((c) => {
                      const val = vals[c.key] ?? 7;
                      return (
                        <div
                          key={c.key}
                          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{c.label}</div>
                              <div className="text-[11px] text-slate-500">
                                Weight: {c.weight}x · Maximum: {c.max} pts
                              </div>
                            </div>
                            <div className="font-mono text-xl font-bold text-indigo-600">
                              {val} <span className="text-xs font-normal text-slate-400">/ 10</span>
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
                            className="mt-3 w-full accent-indigo-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>1 (Needs Work)</span>
                            <span>5 (Average)</span>
                            <span>8 (Strong)</span>
                            <span>10 (Exceptional)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback Notes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Juror Constructive Feedback &amp; Recommendations
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share actionable feedback on technical implementation, pitch clarity, or potential next steps…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition resize-none"
                    />
                  </div>

                  {/* Fair-Score Notification */}
                  {result && (
                    <div
                      className={`rounded-2xl p-4 text-xs ${
                        result.flagged
                          ? "border border-amber-200 bg-amber-50 text-amber-900"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {result.flagged ? (
                          <>
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                            <span>FairScore AI Variance Notification</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>Evaluation Recorded Successfully</span>
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    <Gavel className="h-4 w-4" />
                    <span>
                      {saving
                        ? "Submitting Score…"
                        : `Submit Score as ${judge?.name ? judge.name.split(" ")[0] : "Judge"} (${currentTotal}/40)`}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
                Select a project from the left roster to begin scoring.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

import { Suspense } from "react";

const JudgePageInner = JudgePage;

export default function JudgePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Loading jury portal…</div>}>
      <JudgePageInner />
    </Suspense>
  );
}
