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
  ExternalLink,
  Globe,
  Search,
  CheckCircle2,
  Filter,
  MessageSquareHeart,
  TrendingUp,
  Tag,
  ArrowRight,
  Send,
  X,
} from "lucide-react";

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

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});

  // Feedback modal
  const [feedbackProject, setFeedbackProject] = useState<any | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const interestParam = encodeURIComponent(interests.join(","));
        const [recRes, allRes] = await Promise.all([
          fetch(`/api/visitor/recommendations?interests=${interestParam}`).then((r) => r.json()),
          fetch(`/api/projects`).then((r) => r.json()),
        ]);

        setRecommendations(recRes.recommendations || []);
        setAllProjects(Array.isArray(allRes) ? allRes : []);
      } catch (err) {
        console.error("Failed to load visitor feed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [interests]);

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
          eventId: feedbackProject.eventId || "ev-nexathon-26",
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
    <main className="relative min-h-screen px-4 pb-28 pt-28">
      {/* Glow backgrounds */}
      <div className="pointer-events-none absolute left-1/4 top-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[150px]" />
      <div className="pointer-events-none absolute right-10 top-32 h-[350px] w-[500px] rounded-full bg-[#c8f31d]/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono rounded-lg bg-fuchsia-400/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fuchsia-300">
                🎟️ Visitor Discovery Portal
              </span>
              <span className="font-mono rounded-lg bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70">
                AI Interest Matching
              </span>
            </div>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Discover Projects Tailored To Your <span className="text-fuchsia-400">Interests</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Welcome, <span className="text-white font-semibold">{user?.name || "Attendee"}</span>.
              Select topics you care about to see personalized booth recommendations.
            </p>
          </div>

          <Link
            href="/checkin"
            className="flex items-center gap-2 rounded-xl bg-[#c8f31d] px-4 py-2.5 text-xs font-extrabold text-black transition hover:bg-white shadow-[0_0_20px_rgba(200,243,29,0.3)] self-start md:self-auto"
          >
            <MapPin className="h-4 w-4" />
            <span>Digital Pass & Check-In</span>
          </Link>
        </div>

        {/* Interests Selector Box */}
        <div className="mt-8 glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-fuchsia-400" />
                <h3 className="font-display text-base font-bold">Your Declared Interests</h3>
              </div>
              <p className="text-xs text-white/50">
                Tap tags to add or remove interests. The project feed updates instantly.
              </p>
            </div>
            <span className="font-mono text-xs text-fuchsia-300">
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
                      ? "border border-fuchsia-400 bg-fuchsia-400/20 text-fuchsia-200 shadow-[0_0_15px_rgba(232,121,249,0.25)]"
                      : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <h2 className="font-display text-2xl font-bold">🎯 Top Matches For You</h2>
              </div>
              <p className="text-xs text-white/50">
                Ranked by relevance to your interests:{" "}
                <span className="text-fuchsia-300 font-semibold">{interests.join(", ")}</span>
              </p>
            </div>
            <span className="font-mono text-xs text-[#c8f31d]">
              {recommendations.length} Matches Found
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((p) => {
              const hasVoted = votedIds[p.id];
              return (
                <div
                  key={p.id}
                  className="glass-strong group overflow-hidden rounded-3xl border border-white/10 transition hover:border-fuchsia-400/50 hover:shadow-[0_0_30px_rgba(232,121,249,0.15)] flex flex-col justify-between"
                >
                  {/* Banner Image */}
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-mono text-white/50">
                          Live Hackathon Project
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Match Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[#c8f31d] px-2.5 py-1 font-mono text-[11px] font-extrabold text-black shadow-lg">
                        <TrendingUp className="h-3 w-3" />
                        <span>{p.matchPercent}% Match</span>
                      </div>

                      {/* Booth & Category */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                        <span className="font-mono rounded-md bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                          {p.category}
                        </span>
                        <span className="font-mono rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white/80">
                          Booth {p.boothNo || "B-1"}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-fuchsia-300 transition line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-white/50">by {p.teamName}</p>

                      <p className="mt-2 text-xs leading-relaxed text-white/70 line-clamp-2">
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
                              className="font-mono text-[9px] rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-white/50"
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
                          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            hasVoted
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-300"
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${hasVoted ? "fill-rose-400" : ""}`} />
                          <span>{p.votes || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFeedbackProject(p)}
                          className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20 transition"
                        >
                          <MessageSquareHeart className="h-3.5 w-3.5 text-cyan-300" />
                          <span>Cheers</span>
                        </button>
                      </div>

                      <Link
                        href={`/p/${p.code}`}
                        className="flex items-center gap-1 text-xs font-bold text-fuchsia-300 hover:text-white transition"
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
        </div>

        {/* Section 2: Explore All Projects with Search & Filter */}
        <div className="mt-14 border-t border-white/10 pt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">🌟 Explore All Expo Projects</h2>
              <p className="text-xs text-white/50">
                Browse through all registered projects across all categories
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search project or team…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/40 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-fuchsia-400 w-52 sm:w-64"
                />
              </div>

              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-400"
              >
                <option value="all">All Tracks</option>
                <option value="AI/ML">AI/ML</option>
                <option value="HealthTech">HealthTech</option>
                <option value="IoT">IoT</option>
                <option value="FinTech">FinTech</option>
                <option value="GreenTech">GreenTech</option>
                <option value="EdTech">EdTech</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAll.map((p) => (
              <div
                key={p.id}
                className="glass rounded-2xl border border-white/10 p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] rounded-md bg-white/10 px-2 py-0.5 text-white/70 uppercase">
                    {p.category}
                  </span>
                  <span className="font-mono text-[10px] text-white/40">Booth {p.boothNo}</span>
                </div>
                <h4 className="font-display mt-2 text-base font-bold text-white line-clamp-1">
                  {p.title}
                </h4>
                <div className="text-xs text-white/50">{p.teamName}</div>
                <p className="mt-2 text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Eye className="h-3 w-3" /> {p.views || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Heart className="h-3 w-3 text-rose-400" /> {p.votes || 0}
                    </span>
                  </div>
                  <Link
                    href={`/p/${p.code}`}
                    className="flex items-center gap-1 font-bold text-xs text-cyan-300 hover:underline"
                  >
                    <span>View Booth</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback / Cheers Modal */}
        {feedbackProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="glass-strong w-full max-w-lg rounded-3xl border border-white/15 p-6 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">Cheer & Review Team</h3>
                  <p className="text-xs text-white/50">{feedbackProject.title}</p>
                </div>
                <button
                  onClick={() => setFeedbackProject(null)}
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {feedbackSent ? (
                <div className="mt-6 rounded-2xl bg-emerald-500/20 p-6 text-center text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                  <div className="mt-2 text-sm font-bold">Feedback Sent to Team!</div>
                  <div className="text-xs text-white/60">Thank you for cheering the builders.</div>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                      Rating
                    </label>
                    <div className="mt-1 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            feedbackRating >= star
                              ? "bg-amber-400 text-black shadow-md"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          ★ {star}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                      Your Message / Encouragement
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Loved the live demo! Great edge computing execution."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white outline-none focus:border-fuchsia-400 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackSending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-400 py-3 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-white shadow-[0_0_20px_rgba(232,121,249,0.3)] disabled:opacity-50"
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
