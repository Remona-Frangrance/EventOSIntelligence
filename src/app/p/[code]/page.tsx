"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, ScanLine, Heart, ExternalLink, MapPin, Sparkles, MessageSquareHeart, Star, Gavel, Video } from "lucide-react";

export default function ProjectProfile() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const [p, setP] = useState<{
    id: string; eventId: string; title: string; category: string; teamName: string; leaderName: string;
    description: string; techStack: string[]; members: { name: string }[]; boothNo: string; code: string;
    views: number; checkins: number; votes: number; demoUrl: string; imageUrl?: string; repoUrl?: string;
    videoUrl?: string;
  } | null>(null);
  const [recs, setRecs] = useState<{ id: string; title: string; category: string; score: number; full: { code: string; teamName: string } }[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [avg, setAvg] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [fb, setFb] = useState("");
  const [fbAuthor, setFbAuthor] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbList, setFbList] = useState<{ id: string; authorName: string; rating: number; message: string; createdAt: string }[]>([]);
  const [fbDone, setFbDone] = useState(false);

  useEffect(() => {
    if (user?.name && !fbAuthor) {
      setFbAuthor(user.name);
    }
  }, [user]);

  async function loadFeedbacks(projectId: string) {
    try {
      const res = await fetch(`/api/feedback?projectId=${projectId}`);
      const data = await res.json();
      setFbList(Array.isArray(data) ? data : []);
    } catch {}
  }

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/projects?code=${code}`);
      if (!r.ok) return;
      const d = await r.json();
      setP(d);
      loadFeedbacks(d.id);
      // record scan
      fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: d.eventId, projectId: d.id, source: "qr" }),
      }).catch(() => {});
      // leaderboard rank
      const b = await fetch(`/api/leaderboard/${d.eventId}`).then((x) => x.json());
      const idx = b.findIndex((x: { id: string }) => x.id === d.id);
      if (idx >= 0) {
        setRank(idx + 1);
        setAvg(b[idx].avgScore);
      }
      // recommendations
      const rec = await fetch(`/api/ai/recommend?eventId=${d.eventId}&interests=${encodeURIComponent(d.category)}`).then((x) => x.json());
      setRecs((rec.recommendations || []).filter((x: { id: string }) => x.id !== d.id).slice(0, 3));
    })();
  }, [code]);

  async function vote() {
    if (!p || voted || user?.role === "participant") return;
    await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, votes: p.votes + 1 }),
    });
    setP({ ...p, votes: p.votes + 1 });
    setVoted(true);
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!p || !fb.trim()) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: p.eventId,
        projectId: p.id,
        authorName: fbAuthor.trim() || user?.name || "Visitor",
        authorRole: user?.role || "visitor",
        rating: fbRating,
        message: fb.trim(),
      }),
    });
    setFb("");
    setFbDone(true);
    loadFeedbacks(p.id);
    setTimeout(() => setFbDone(false), 3000);
  }

  if (!p) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-32">
        <div className="glass animate-pulse rounded-3xl p-10 text-center">Scanning booth identity…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-28">
      <div className="glass-strong overflow-hidden rounded-3xl">
        {/* Banner with Image or Gradient */}
        {p.imageUrl ? (
          <div className="relative h-64 w-full overflow-hidden bg-black">
            <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono rounded-md bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#c8f31d] border border-white/10">{p.category}</span>
                <span className="font-mono flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] text-white border border-white/10"><MapPin className="h-3 w-3" /> {p.boothNo}</span>
                {rank && (
                  <span className="font-mono rounded-md bg-[#c8f31d] px-2.5 py-1 text-[10px] font-bold text-black">RANK #{rank}{avg ? ` · ${avg.toFixed(1)}` : ""}</span>
                )}
              </div>
              <h1 className="font-display mt-2 text-3xl font-bold text-white drop-shadow-lg md:text-4xl">{p.title}</h1>
              <p className="mt-1 font-medium text-white/90">by {p.teamName}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono rounded-md bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white">{p.category}</span>
                  <span className="font-mono flex items-center gap-1 rounded-md bg-black/50 px-2.5 py-1 text-[10px] text-white"><MapPin className="h-3 w-3" /> {p.boothNo}</span>
                  {rank && (
                    <span className="font-mono rounded-md bg-[#c8f31d] px-2.5 py-1 text-[10px] font-bold text-black">RANK #{rank}{avg ? ` · ${avg.toFixed(1)}` : ""}</span>
                  )}
                </div>
                <h1 className="font-display mt-3 text-3xl font-bold text-white drop-shadow-lg md:text-4xl">{p.title}</h1>
                <p className="mt-1 font-medium text-white/90">by {p.teamName}</p>
              </div>
            </div>
          </div>
        )}
        <div className="p-6">
          <div className="font-mono flex items-center gap-4 text-[11px] text-white/45">
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {p.views} views</span>
            <span className="flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5" /> {p.checkins} booth scans</span>
            <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> {p.votes} crowd votes</span>
          </div>
          <p className="mt-4 leading-relaxed text-white/75">{p.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.techStack.map((t) => (
              <span key={t} className="font-mono rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">{t}</span>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-white/[0.03] p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">The crew</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-[#c8f31d]/15 px-3 py-1.5 text-[13px] font-semibold text-[#c8f31d]">{p.leaderName || "Project Lead"} · Lead</span>
              {p.members.map((m, i) => (
                <span key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-[13px] text-white/70">{m.name}</span>
              ))}
            </div>
          </div>

          {/* Project Demo / Pitch Video */}
          {p.videoUrl && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="font-mono flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                <Video className="h-3.5 w-3.5" /> Project Pitch & Demo Video
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black aspect-video flex items-center justify-center">
                {p.videoUrl.includes("youtube.com") || p.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={
                      p.videoUrl.includes("watch?v=")
                        ? p.videoUrl.replace("watch?v=", "embed/")
                        : p.videoUrl.replace("youtu.be/", "www.youtube.com/embed/")
                    }
                    title="Project pitch video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={p.videoUrl}
                    controls
                    className="h-full w-full object-contain"
                    preload="metadata"
                  />
                )}
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {user?.role === "participant" ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Crowd Prize: {p.votes} Votes</span>
                </div>
                <p className="mt-0.5 text-[10px] text-white/50">
                  Participants cannot vote (reserved for visitors)
                </p>
              </div>
            ) : user?.role === "judge" ? (
              <Link
                href="/judge"
                className="flex flex-col items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-center hover:bg-amber-400/20 transition"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                  <Gavel className="h-3.5 w-3.5" />
                  <span>Jury Pad Evaluation</span>
                </div>
                <p className="mt-0.5 text-[10px] text-white/50">
                  Score in official judge panel
                </p>
              </Link>
            ) : (
              <button
                type="button"
                onClick={vote}
                disabled={voted}
                className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition ${
                  voted
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                }`}
              >
                <Heart className={`h-4 w-4 ${voted ? "fill-current" : ""}`} />
                <span>{voted ? `Voted · ${p.votes}` : "Vote for crowd prize"}</span>
              </button>
            )}
            {p.demoUrl ? (
              <a href={p.demoUrl} target="_blank" rel="noreferrer" className="glass flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold hover:bg-white/10 text-cyan-300">
                Live demo <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Link href={`/feedback/${p.eventId}`} className="glass flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold hover:bg-white/10">
                <MessageSquareHeart className="h-4 w-4" /> Event feedback
              </Link>
            )}
          </div>
          {p.repoUrl && (
            <div className="mt-2">
              <a href={p.repoUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition">
                <span>View GitHub / Source Code</span>
                <ExternalLink className="h-3.5 w-3.5 text-white/50" />
              </a>
            </div>
          )}
          {/* Visitor Reviews & Star Ratings Form */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="font-display flex items-center gap-2 text-sm font-bold text-white">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>Leave a Review & Star Rating</span>
            </h3>
            <p className="mt-0.5 text-xs text-white/50">Your rating & comment will be visible to the team and organisers</p>

            <form onSubmit={sendFeedback} className="mt-4 space-y-3">
              {/* Star selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFbRating(star)}
                      className="p-1 transition hover:scale-125"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= fbRating
                            ? "fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            : "text-white/20 hover:text-white/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {fbRating === 5 ? "5/5 (Excellent!)" : fbRating === 4 ? "4/5 (Great)" : fbRating === 3 ? "3/5 (Good)" : `${fbRating}/5`}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Your Name (e.g. Priya Sharma)"
                  value={fbAuthor}
                  onChange={(e) => setFbAuthor(e.target.value)}
                  className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#c8f31d]"
                />
                <input
                  type="text"
                  required
                  placeholder="Share your thoughts, suggestions, or cheer…"
                  value={fb}
                  onChange={(e) => setFb(e.target.value)}
                  className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#c8f31d] sm:col-span-2"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#c8f31d] px-5 py-2 text-xs font-bold text-black transition hover:bg-white"
                >
                  <Star className="h-3.5 w-3.5 fill-black" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
            {fbDone && <p className="mt-2 text-center text-[13px] text-emerald-300">Review delivered to the team & organizers! ✦</p>}

            {/* Displaying Live Reviews List */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-white/70">
                  Visitor Reviews ({fbList.length})
                </h4>
                {fbList.length > 0 && (
                  <span className="font-mono text-xs text-amber-300 font-bold">
                    ★ {(fbList.reduce((acc, cur) => acc + (cur.rating || 5), 0) / fbList.length).toFixed(1)} avg
                  </span>
                )}
              </div>

              <div className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {fbList.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{rev.authorName || "Visitor"}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= (rev.rating || 5) ? "fill-amber-300 text-amber-300" : "text-white/15"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/75">{rev.message}</p>
                  </div>
                ))}
                {fbList.length === 0 && (
                  <p className="py-3 text-center text-xs text-white/40">No reviews yet. Be the first to leave feedback!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {recs.length > 0 && (
        <div className="glass mt-4 rounded-3xl p-6">
          <h3 className="font-display flex items-center gap-2 text-base font-bold"><Sparkles className="h-4 w-4 text-fuchsia-300" /> AI picks for you next</h3>
          <div className="mt-3 space-y-2">
            {recs.map((r) => (
              <Link key={r.id} href={`/p/${r.full.code}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-fuchsia-400/30">
                <span className="font-mono rounded bg-fuchsia-400/15 px-2 py-1 text-[10px] font-bold text-fuchsia-200">{r.score} pts</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{r.title}</span>
                  <span className="block text-xs text-white/45">{r.full.teamName} · {r.category}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <p className="font-mono mt-5 text-center text-[10px] uppercase tracking-[0.25em] text-white/25">Powered by Event Intelligence OS · {p.code}</p>
    </main>
  );
}
