"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, ArrowRight, Plus, Users, QrCode, Trophy, Sparkles } from "lucide-react";

type Ev = {
  id: string; name: string; type: string; tagline: string; description: string;
  venue: string; city: string; status: string; bannerGradient: string;
  startsAt: string; endsAt: string;
  stats: { projects: number; visitors: number; scores: number; scans: number };
};

export default function EventsPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/events");
    const d = await r.json();
    setEvents(d);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function seed() {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    await load();
    setSeeding(false);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#c8f31d]">// Event registry</div>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-tight md:text-5xl">All events, one kernel</h1>
          <p className="mt-3 max-w-lg text-white/55">Every event below is fully operable — register a team, judge it, scan it, certify it.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seed} disabled={seeding} className="glass flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
            <Sparkles className="h-4 w-4 text-[#c8f31d]" /> {seeding ? "Seeding demo…" : "Load demo universe"}
          </button>
          <Link href="/console" className="flex items-center gap-2 rounded-xl bg-[#c8f31d] px-5 py-3 text-sm font-bold text-black hover:bg-white">
            <Plus className="h-4 w-4" /> New event
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-14 text-center">
          <div className="font-display text-2xl font-bold">No events yet — the stage is empty.</div>
          <p className="mt-2 text-white/55">Seed the demo universe or create your first event from the console.</p>
          <button onClick={seed} disabled={seeding} className="mt-6 rounded-xl bg-[#c8f31d] px-6 py-3 text-sm font-bold text-black hover:bg-white disabled:opacity-50">
            {seeding ? "Seeding…" : "Seed demo events"}
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {events.map((e) => (
            <div key={e.id} className="glass group overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:border-white/20">
              <div className={`relative bg-gradient-to-r ${e.bannerGradient} p-6`}>
                <div className="grid-bg absolute inset-0 opacity-40" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <span className="font-mono rounded-md bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
                      {e.type}
                    </span>
                    <h2 className="font-display mt-3 max-w-md text-2xl font-bold leading-tight text-white drop-shadow-lg">{e.name}</h2>
                    <p className="mt-1 text-sm text-white/85">{e.tagline}</p>
                  </div>
                  <span className={`font-mono flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    e.status === "live" ? "bg-emerald-400 text-black" : e.status === "upcoming" ? "bg-amber-300 text-black" : "bg-black/50 text-white"
                  }`}>
                    {e.status === "live" && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-black" />}
                    {e.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-white/55">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.venue} · {e.city}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(e.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(e.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { icon: QrCode, v: e.stats.projects, l: "Teams" },
                    { icon: Users, v: e.stats.visitors, l: "Visitors" },
                    { icon: Trophy, v: e.stats.scores, l: "Scores" },
                    { icon: Sparkles, v: e.stats.scans, l: "Scans" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2.5 text-center">
                      <div className="font-display text-lg font-bold tabular-nums">{s.v}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/register/${e.id}`} className="flex items-center gap-1.5 rounded-xl bg-[#c8f31d] px-4 py-2.5 text-[13px] font-bold text-black hover:bg-white">
                    Register team <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={`/console?event=${e.id}`} className="glass rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-white/10">Open console</Link>
                  <Link href={`/feedback/${e.id}`} className="glass rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-white/10">Feedback</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
