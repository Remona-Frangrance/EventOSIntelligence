"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquareHeart, Star, Sparkles, Filter, ChevronRight, CheckCircle2 } from "lucide-react";

type EventItem = {
  id: string;
  name: string;
  type: string;
  city: string;
  status: string;
};

type FeedbackItem = {
  id: string;
  authorName: string;
  authorRole: string;
  rating: number;
  message: string;
  sentiment: string;
  createdAt?: string;
};

type AiSummary = {
  headline: string;
  score: number;
  keywords: { word: string; count: number }[];
};

function FeedbackPageContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load events
  useEffect(() => {
    async function initEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          const paramEv = searchParams.get("event") || searchParams.get("eventId");
          const found = data.find((e) => e.id === paramEv || e.slug === paramEv) || data.find((e) => e.status === "live") || data[0];
          setSelectedEventId(found.id);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    }
    initEvents();
  }, [searchParams]);

  // Load feedback & AI pulse for selected event
  async function loadFeedback(evId: string) {
    if (!evId) return;
    try {
      const [fRes, sRes] = await Promise.all([
        fetch(`/api/feedback?eventId=${evId}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/ai/summary/${evId}`).then((r) => r.json()).catch(() => null),
      ]);
      setList(Array.isArray(fRes) ? fRes : []);
      setSummary(sRes && sRes.score ? sRes : null);
    } catch {}
  }

  useEffect(() => {
    if (selectedEventId) {
      loadFeedback(selectedEventId);
    }
  }, [selectedEventId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEventId) return;
    const fd = new FormData(e.currentTarget);
    const msg = String(fd.get("message") || "").trim();
    if (!msg) return;

    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEventId,
        authorName: fd.get("name") || "Attendee",
        authorRole: fd.get("role") || "visitor",
        rating,
        message: msg,
      }),
    });

    (e.target as HTMLFormElement).reset();
    setRating(5);
    setSent(true);
    setTimeout(() => setSent(false), 3500);
    loadFeedback(selectedEventId);
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <main className="relative min-h-screen px-4 pb-28 pt-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[150px]" />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-300">
            <Sparkles className="h-3 w-3" /> Voice of the Crowd · Feedback Engine
          </div>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Community <span className="text-fuchsia-400">Feedback Wall</span>
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
            Every review, praise, and critique is parsed in real-time by AI to generate organizers sentiment intelligence.
          </p>
        </div>

        {/* Event Selector */}
        {events.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-xs uppercase text-white/50 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Event:
            </span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="glass rounded-xl px-4 py-2 text-xs font-semibold text-white outline-none focus:border-fuchsia-400 max-w-xs"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-[#0b0f1d]">
                  {ev.name} ({ev.city || "Live"})
                </option>
              ))}
            </select>
            {selectedEvent && (
              <span className="font-mono rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/60 uppercase">
                {selectedEvent.type}
              </span>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* Submission Form + AI Pulse */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="glass-strong rounded-3xl border border-white/10 p-6 shadow-xl">
              <h3 className="font-display flex items-center gap-2 text-lg font-bold text-white">
                <MessageSquareHeart className="h-5 w-5 text-fuchsia-400" />
                <span>Drop Your Experience Take</span>
              </h3>
              <p className="mt-0.5 text-xs text-white/50">
                Share what impressed you or what could make the expo even better.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-white/50">Your Name</label>
                  <input
                    name="name"
                    placeholder="e.g. Alex Rivera"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-white/50">Your Role</label>
                  <select
                    name="role"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                  >
                    <option value="visitor">Visitor / Attendee</option>
                    <option value="exhibitor">Exhibitor / Builder</option>
                    <option value="mentor">Mentor</option>
                    <option value="judge">Judge / Jury</option>
                    <option value="industry">Industry Guest / VC</option>
                  </select>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mt-4">
                <label className="font-mono text-[10px] uppercase text-white/50 block mb-1">Overall Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 transition hover:scale-125"
                    >
                      <Star
                        className={`h-6 w-6 transition ${
                          s <= rating ? "fill-amber-400 text-amber-400" : "text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono ml-2 text-xs font-bold text-amber-300">{rating} / 5</span>
                </div>
              </div>

              {/* Message */}
              <div className="mt-4">
                <label className="font-mono text-[10px] uppercase text-white/50 block mb-1">Your Feedback Note *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="What was the standout highlight? Any suggestions for next time? Be brutally honest…"
                  className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-fuchsia-400 leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-95 shadow-[0_0_20px_rgba(232,121,249,0.3)]"
              >
                {sent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Received — Thank You!
                  </>
                ) : (
                  <>
                    Post to the Wall <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* AI Summary Widget */}
            {summary && (
              <div className="glass-strong rounded-3xl border border-fuchsia-500/20 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-fuchsia-400" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-fuchsia-300">
                      AI Sentiment Pulse
                    </span>
                  </div>
                  <div className="font-display text-2xl font-black text-fuchsia-300">
                    {summary.score}
                    <span className="text-xs text-white/40 font-normal">/100</span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  {summary.headline}
                </p>

                {summary.keywords && summary.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {summary.keywords.map((k) => (
                      <span
                        key={k.word}
                        className="font-mono rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] text-white/70"
                      >
                        #{k.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Feedback Feed */}
          <div className="glass-strong rounded-3xl border border-white/10 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display text-lg font-bold text-white">
                Live Feed ({list.length})
              </h3>
              <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Real-time
              </span>
            </div>

            <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto pr-1">
              {list.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{f.authorName}</span>
                      <span className="font-mono rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/60 uppercase">
                        {f.authorRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < f.rating ? "fill-amber-400 text-amber-400" : "text-white/15"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-white/80">
                    {f.message}
                  </p>

                  {f.sentiment && (
                    <div className="mt-2 flex justify-end">
                      <span className="font-mono text-[9px] uppercase text-white/40">
                        Sentiment: {f.sentiment}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {list.length === 0 && !loading && (
                <div className="py-16 text-center text-xs text-white/40">
                  <MessageSquareHeart className="mx-auto h-8 w-8 text-white/20 mb-2" />
                  Be the first to leave a feedback note for this event!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-5xl px-4 pt-32 text-center text-xs text-white/50">Loading feedback wall…</main>}>
      <FeedbackPageContent />
    </Suspense>
  );
}
