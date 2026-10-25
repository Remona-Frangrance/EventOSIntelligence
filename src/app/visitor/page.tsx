"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Sparkles,
  Heart,
  Eye,
  MapPin,
  Search,
  CheckCircle2,
  TrendingUp,
  Tag,
  ArrowRight,
  Send,
  X,
  Loader2,
  Calendar,
  Building2,
  Check,
  Layers,
} from "lucide-react";
import FloorPlanViewer from "@/components/FloorPlanViewer";

const AVAILABLE_INTERESTS = [
  "AI/ML",
  "HealthTech",
  "IoT",
  "FinTech",
  "GreenTech",
  "Robotics",
  "EdTech",
  "Cybersecurity",
  "Web3",
];

export default function VisitorPortal() {
  const { user, updateInterests } = useAuth();

  const [interests, setInterests] = useState<string[]>(
    user?.interests && user.interests.length > 0
      ? user.interests
      : ["AI/ML", "HealthTech", "Robotics"]
  );

  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<"projects" | "floor_plan">("projects");

  // Feedback modal
  const [feedbackProject, setFeedbackProject] = useState<any | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Real-time SSE Live Updates
  const [liveStreamConnected, setLiveStreamConnected] = useState(false);

  // 1. Load events list on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          // Keep deduplicated, prominent events with priority to those with projects
          const sorted = [...list].sort((a, b) => {
            const countA = a.stats?.projects || 0;
            const countB = b.stats?.projects || 0;
            if (countA > 0 && countB === 0) return -1;
            if (countB > 0 && countA === 0) return 1;
            return 0;
          });
          setEventsList(sorted);

          // Check if URL has eventId
          const params = new URLSearchParams(window.location.search);
          const urlEventId = params.get("eventId");
          if (urlEventId && sorted.some((e) => e.id === urlEventId || e.slug === urlEventId)) {
            const match = sorted.find((e) => e.id === urlEventId || e.slug === urlEventId);
            setSelectedEventId(match?.id || urlEventId);
          } else {
            // Default to event with projects
            const def = sorted.find((e) => (e.stats?.projects || 0) > 0) || sorted[0];
            setSelectedEventId(def.id);
          }
        }
      } catch (err) {
        console.error("Failed to load events", err);
      }
    }
    fetchEvents();
  }, []);

  // 2. Fetch projects strictly for the selected event and interests
  useEffect(() => {
    if (!selectedEventId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const interestParam = encodeURIComponent(interests.join(","));
        const [recRes, allRes] = await Promise.all([
          fetch(`/api/visitor/recommendations?eventId=${encodeURIComponent(selectedEventId)}&interests=${interestParam}`).then((r) => r.json()),
          fetch(`/api/projects?eventId=${encodeURIComponent(selectedEventId)}`).then((r) => r.json()),
        ]);

        const rawRecs = recRes.recommendations || [];
        const rawProjects = Array.isArray(allRes) ? allRes : [];

        // Guaranteed event scope filter
        const scopedRecs = rawRecs.filter((p: any) => !p.eventId || p.eventId === selectedEventId);
        const scopedProjects = rawProjects.filter((p: any) => !p.eventId || p.eventId === selectedEventId);

        setRecommendations(scopedRecs);
        setAllProjects(scopedProjects);
      } catch (err) {
        console.error("Failed to load visitor feed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedEventId, interests]);

  // 3. Dynamic SSE Live stream for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/realtime/${selectedEventId}`);
      es.onopen = () => setLiveStreamConnected(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.leaderboard && Array.isArray(data.leaderboard)) {
            setAllProjects((prev) =>
              prev.map((item) => {
                const found = data.leaderboard.find((l: any) => l.id === item.id);
                return found ? { ...item, votes: found.votes, avgScore: found.avgScore } : item;
              })
            );
          }
        } catch {}
      };
      es.onerror = () => setLiveStreamConnected(false);
    } catch {
      setLiveStreamConnected(false);
    }

    return () => {
      if (es) es.close();
      setLiveStreamConnected(false);
    };
  }, [selectedEventId]);

  function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("eventId", id);
    window.history.replaceState({}, "", newUrl.toString());
  }

  const selectedEvent = eventsList.find((e) => e.id === selectedEventId);

  async function toggleInterest(tag: string) {
    let next: string[];
    if (interests.includes(tag)) {
      if (interests.length <= 1) return; // keep at least 1
      next = interests.filter((t) => t !== tag);
    } else {
      next = [...interests, tag];
    }
    setInterests(next);
    await updateInterests(next);
  }

  async function handleVote(p: any) {
    if (votedIds[p.id]) return;
    setVotedIds((prev) => ({ ...prev, [p.id]: true }));

    // Increment in backend
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, votes: (p.votes || 0) + 1 }),
      });

      // Update state locally
      setRecommendations((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, votes: (item.votes || 0) + 1 } : item))
      );
      setAllProjects((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, votes: (item.votes || 0) + 1 } : item))
      );
    } catch {}
  }

  async function handleSendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackProject || !feedbackMessage.trim()) return;
    setFeedbackSending(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: feedbackProject.eventId || selectedEventId || "ev-nexathon-26",
          projectId: feedbackProject.id,
          authorName: user?.name || "Attendee",
          authorRole: "visitor",
          rating: feedbackRating,
          message: feedbackMessage.trim(),
        }),
      });
      setFeedbackSent(true);
      setTimeout(() => {
        setFeedbackSent(false);
        setFeedbackProject(null);
        setFeedbackMessage("");
      }, 1500);
    } catch {
      alert("Failed to submit feedback");
    } finally {
      setFeedbackSending(false);
    }
  }

  const filteredAll = allProjects.filter((p) => {
    if (selectedEventId && p.eventId && p.eventId !== selectedEventId) return false;
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <main className="relative min-h-screen bg-[#05070f] text-slate-100 px-4 pb-28 pt-28 selection:bg-fuchsia-500 selection:text-black">
      {/* Glow backgrounds */}
      <div className="pointer-events-none absolute left-1/4 top-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[150px]" />
      <div className="pointer-events-none absolute right-10 top-32 h-[350px] w-[500px] rounded-full bg-[#c8f31d]/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-fuchsia-300">
                🎟️ Visitor Discovery Portal
              </span>
              <span className="font-mono rounded-lg bg-slate-800/90 border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">
                AI Interest Matching
              </span>
              {liveStreamConnected && (
                <span className="inline-flex items-center gap-1.5 font-mono rounded-lg bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Floor Sync</span>
                </span>
              )}
            </div>
            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Discover Projects Tailored To Your <span className="text-fuchsia-400">Interests</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-300">
              Welcome, <span className="text-white font-semibold">{user?.name || "Attendee"}</span>.
              Explore personalized booths and projects specifically for your selected event.
            </p>
          </div>

          <Link
            href="/checkin"
            className="flex items-center gap-2 rounded-xl bg-[#c8f31d] hover:bg-[#b5e010] px-4 py-2.5 text-xs font-extrabold text-slate-950 transition shadow-[0_0_20px_rgba(200,243,29,0.25)] self-start md:self-auto"
          >
            <MapPin className="h-4 w-4" />
            <span>Digital Pass & Check-In</span>
          </Link>
        </div>

        {/* Event Scope Switcher */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Active Event Selection</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing project booths exclusively for the selected event below:
              </p>
            </div>
            {selectedEvent && (
              <div className="inline-flex items-center gap-2 text-xs font-mono font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-lg self-start sm:self-auto">
                <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>{selectedEvent.venue || selectedEvent.city || "Main Venue"}</span>
              </div>
            )}
          </div>

          {/* Event Selector Tabs */}
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            {eventsList.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              const projectCount = ev.stats?.projects ?? 0;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleSelectEvent(ev.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-medium transition text-left ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 border border-indigo-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-white/5"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${isSelected ? "bg-white" : "bg-slate-500"}`} />
                  <span className="truncate max-w-[240px] sm:max-w-[320px]">{ev.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/40 text-slate-400"
                  }`}>
                    {projectCount} {projectCount === 1 ? "Booth" : "Booths"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Switcher: Project Discovery vs Venue Floor Plan */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveView("projects")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeView === "projects"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Project Discovery &amp; Recommendations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("floor_plan")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeView === "floor_plan"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Interactive Venue Floor Plan</span>
          </button>
        </div>

        {activeView === "floor_plan" ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 md:p-8 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400">
                    <MapPin className="h-5 w-5" />
                    <h2 className="font-display text-xl font-bold text-white">
                      {selectedEvent?.name || "Event"} · Floor Navigation Map
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Locate exhibition bays, explore startup stalls, and inspect live scan activity across halls.
                  </p>
                </div>
              </div>
            </div>

            <FloorPlanViewer
              eventId={selectedEventId}
              isAdmin={false}
              onSelectProject={(pid) => {
                const proj = allProjects.find((p) => p.id === pid);
                if (proj) {
                  setActiveView("projects");
                  setSearchQuery(proj.title);
                }
              }}
            />
          </div>
        ) : (
          <div>
            {/* Interests Selector Box */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/90 p-6 md:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-fuchsia-400" />
                <h3 className="font-display text-base font-bold text-white">Your Declared Interests</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap tags to add or remove interests. Recommendations for this event update instantly.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 rounded-lg self-start sm:self-auto">
              {interests.length} Active Interests
            </span>
          </div>

          {/* Tag Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((tag) => {
              const active = interests.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? "border border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200 shadow-[0_0_15px_rgba(232,121,249,0.25)]"
                      : "border border-white/10 bg-slate-800/60 text-slate-300 hover:border-white/20 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{tag}</span>
                  {active && <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-300" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1: AI Recommended Projects Based on Interests */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="font-display text-2xl font-bold text-white">🎯 Top Matches For You</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Ranked by relevance for <span className="text-white font-semibold">{selectedEvent?.name || "Selected Event"}</span>:{" "}
                <span className="text-fuchsia-300 font-semibold">{interests.join(", ")}</span>
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#c8f31d] bg-[#c8f31d]/15 px-3 py-1 rounded-lg border border-[#c8f31d]/30 self-start sm:self-auto">
              {recommendations.length} {recommendations.length === 1 ? "Match" : "Matches"} Found
            </span>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-fuchsia-400" />
              <span className="text-xs font-medium">Filtering event booths & scoring interest affinity…</span>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.slice(0, 6).map((p) => {
                const hasVoted = votedIds[p.id];
                return (
                  <div
                    key={p.id}
                    className="group overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 transition hover:border-fuchsia-400/50 hover:shadow-[0_0_30px_rgba(232,121,249,0.18)] flex flex-col justify-between"
                  >
                    {/* Banner Image */}
                    <div>
                      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-violet-700 to-fuchsia-700">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-xs font-mono text-slate-200 bg-slate-900/40">
                            Live Project Showcase
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        {/* Match Badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[#c8f31d] px-2.5 py-1 font-mono text-[11px] font-extrabold text-slate-950 shadow-lg">
                          <TrendingUp className="h-3 w-3" />
                          <span>{p.matchPercent}% Match</span>
                        </div>

                        {/* Booth & Category */}
                        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                          <span className="font-mono rounded-md bg-slate-950/90 border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-200">
                            {p.category}
                          </span>
                          <span className="font-mono rounded-md bg-slate-950/90 border border-white/10 px-2.5 py-0.5 text-[10px] text-slate-300">
                            Booth {p.boothNo || "B-1"}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <h3 className="font-display text-lg font-bold text-white group-hover:text-fuchsia-300 transition line-clamp-1">
                          {p.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-400 font-medium">by {p.teamName}</p>

                        <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-2">
                          {p.description}
                        </p>

                        {/* Why matched badges */}
                        {p.matchedTags && p.matchedTags.length > 0 && (
                          <div className="mt-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-2 text-[10px] text-fuchsia-300 space-y-0.5">
                            {p.matchedTags.slice(0, 2).map((t: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-1 font-mono">
                                <span>✓</span> {t}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tech stack pills */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {Array.isArray(p.techStack) &&
                            p.techStack.slice(0, 4).map((tech: string, i: number) => (
                              <span
                                key={i}
                                className="font-mono text-[10px] rounded-md bg-slate-800 border border-white/10 px-2 py-0.5 text-slate-300"
                              >
                                {tech}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-5 pt-0">
                      <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVote(p)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              hasVoted
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-slate-800 border border-white/10 text-slate-200 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${hasVoted ? "fill-rose-400" : ""}`} />
                            <span>{p.votes || 0}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFeedbackProject(p)}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                          >
                            <span>Cheers</span>
                          </button>
                        </div>

                        <Link
                          href={`/p/${p.code}`}
                          className="flex items-center gap-1 text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 transition"
                        >
                          <span>Visit Booth</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center">
              <Compass className="mx-auto h-10 w-10 text-fuchsia-400 opacity-80" />
              <h3 className="font-display mt-3 text-lg font-bold text-white">No Matching Projects in Selected Event</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                Try selecting other interest tags above, or switch the active event filter to explore other conclaves.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Explore All Projects in Selected Event */}
        <div className="mt-14 border-t border-white/10 pt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <span>All Booths in {selectedEvent?.name || "Current Event"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Displaying all registered project stalls for this specific event ({filteredAll.length} total)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project or team…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-white/15 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 outline-none focus:border-fuchsia-400 w-52 sm:w-64"
                />
              </div>

              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="rounded-xl border border-white/15 bg-slate-900/90 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-400"
              >
                <option value="all">All Tracks</option>
                <option value="AI/ML">AI/ML</option>
                <option value="HealthTech">HealthTech</option>
                <option value="IoT">IoT</option>
                <option value="Robotics">Robotics</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="FinTech">FinTech</option>
                <option value="GreenTech">GreenTech</option>
                <option value="EdTech">EdTech</option>
              </select>
            </div>
          </div>

          {filteredAll.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAll.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 transition hover:border-white/25 hover:bg-slate-800/80 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-indigo-300 uppercase font-semibold">
                      {p.category}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-medium">Booth {p.boothNo}</span>
                  </div>
                  <h4 className="font-display mt-2.5 text-base font-bold text-white line-clamp-1">
                    {p.title}
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">{p.teamName}</div>
                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Eye className="h-3 w-3" /> {p.views || 0}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Heart className="h-3 w-3 text-rose-400" /> {p.votes || 0}
                      </span>
                    </div>
                    <Link
                      href={`/p/${p.code}`}
                      className="flex items-center gap-1 font-bold text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      <span>View Booth</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-xs text-slate-400">
              No project booths found for {selectedEvent?.name || "this event"} matching your search or category filter.
            </div>
          )}
        </div>
      </div>
    )}

        {/* Feedback / Cheers Modal */}
        {feedbackProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-6 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Cheer & Review Team</h3>
                  <p className="text-xs text-slate-400">{feedbackProject.title}</p>
                </div>
                <button
                  onClick={() => setFeedbackProject(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {feedbackSent ? (
                <div className="mt-6 rounded-2xl bg-emerald-500/20 p-6 text-center text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                  <div className="mt-2 text-sm font-bold">Feedback Sent to Team!</div>
                  <div className="text-xs text-slate-300 mt-1">Thank you for cheering the builders.</div>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Rating
                    </label>
                    <div className="mt-1 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            feedbackRating >= star
                              ? "bg-amber-400 text-slate-950 shadow-md font-extrabold"
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          ★ {star}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Your Message / Encouragement
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Loved the live demo! Great edge computing execution."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-fuchsia-400 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackSending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition shadow-[0_0_20px_rgba(232,121,249,0.3)] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{feedbackSending ? "Sending…" : "Post Cheers to Team"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
