"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquareHeart, Star, Sparkles } from "lucide-react";

export default function FeedbackPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [ev, setEv] = useState<{ name: string } | null>(null);
  const [list, setList] = useState<{ id: string; authorName: string; authorRole: string; rating: number; message: string; sentiment: string }[]>([]);
  const [summary, setSummary] = useState<{ headline: string; score: number; keywords: { word: string; count: number }[] } | null>(null);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  async function load() {
    try {
      const [f, s, e] = await Promise.all([
        fetch(`/api/feedback?eventId=${eventId}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/ai/summary/${eventId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/events/${eventId}`).then((r) => r.json()).catch(() => null),
      ]);
      setList(Array.isArray(f) ? f : []);
      if (s && !s.error && Array.isArray(s.keywords) && s.count > 0) {
        setSummary(s);
      } else {
        setSummary(null);
      }
      if (e && !e.error) setEv(e);
    } catch {}
  }
  useEffect(() => { load(); }, [eventId]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        authorName: fd.get("name") || "Anonymous",
        authorRole: fd.get("role"),
        rating,
        message: fd.get("message"),
      }),
    });
    (e.target as HTMLFormElement).reset();
    setRating(5);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28">
      <div className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-fuchsia-300">// Voice of the crowd</div>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight">Feedback wall</h1>
        <p className="mt-2 text-white/55">{ev?.name} — every note is read by AI and routed to organisers.</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <form onSubmit={submit} className="glass-strong rounded-3xl p-6">
            <h3 className="font-display flex items-center gap-2 text-lg font-bold"><MessageSquareHeart className="h-5 w-5 text-fuchsia-300" /> Drop your take</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input name="name" placeholder="Your name" className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none focus:border-fuchsia-300" />
              <select name="role" className="rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none">
                <option value="visitor">Visitor</option>
                <option value="exhibitor">Exhibitor</option>
                <option value="mentor">Mentor</option>
                <option value="judge">Judge</option>
                <option value="industry">Industry guest</option>
              </select>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star className={`h-7 w-7 transition ${s <= rating ? "fill-amber-300 text-amber-300" : "text-white/20"}`} />
                </button>
              ))}
              <span className="font-mono ml-2 text-xs text-white/45">{rating}/5</span>
            </div>
            <textarea name="message" required rows={4} placeholder="What rocked? What should change? Be brutally honest…" className="mt-3 w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-fuchsia-300" />
            <button className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3.5 text-sm font-bold hover:opacity-90">
              {sent ? "Received — thank you! ✦" : "Post to the wall →"}
            </button>
          </form>
          {summary && Array.isArray(summary.keywords) && summary.keywords.length > 0 && (
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">AI pulse</span>
              </div>
              <div className="font-display mt-2 text-4xl font-bold text-fuchsia-300">{summary.score}<span className="text-base text-white/35">/100</span></div>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{summary.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {summary.keywords.map((k) => (
                  <span key={k.word} className="font-mono rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60">#{k.word}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-bold">Live wall ({list.length})</h3>
          <div className="mt-4 max-h-[640px] space-y-2.5 overflow-y-auto pr-1">
            {list.map((f) => (
              <div key={f.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{f.authorName}</span>
                  <span className="font-mono rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">{f.authorRole}</span>
                  <span className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < f.rating ? "fill-amber-300 text-amber-300" : "text-white/15"}`} />
                    ))}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{f.message}</p>
              </div>
            ))}
            {!list.length && <p className="py-10 text-center text-sm text-white/40">Be the first voice on this wall.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
