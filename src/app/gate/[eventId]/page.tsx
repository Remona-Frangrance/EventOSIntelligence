"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ScanLine,
  ArrowRight,
  Compass,
  MapPin,
  Tag,
  Zap,
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

export default function GateCheckinPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const [eventData, setEventData] = useState<{
    id: string;
    name: string;
    tagline: string;
    venue: string;
    city: string;
    categories: string[];
    bannerGradient?: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "AI/ML",
    "HealthTech",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [checkedInPass, setCheckedInPass] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setEventData(data);
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setSelectedInterests(data.categories.slice(0, 2));
          }
        } else {
          // fallback to first event
          const allRes = await fetch("/api/events");
          const all = await allRes.json();
          if (Array.isArray(all) && all.length > 0) {
            setEventData(all[0]);
          }
        }
      } catch {
        // fallback
      }
    }
    if (eventId) loadEvent();
  }, [eventId]);

  function toggleInterest(tag: string) {
    if (selectedInterests.includes(tag)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((t) => t !== tag));
      }
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  }

  async function handleInstantCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const isEmail = contact.includes("@");
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventData?.id || eventId,
          name: name.trim(),
          email: isEmail ? contact.trim() : "",
          phone: !isEmail ? contact.trim() : "",
          interests: selectedInterests,
          checkedIn: true,
          type: "visitor",
        }),
      });

      const visitor = await res.json();
      if (!res.ok) throw new Error(visitor.error || "Check-in failed");

      // Auto login as visitor session
      const sessionUser = {
        id: visitor.id || "vis-" + Math.random().toString(36).substring(2, 8),
        name: visitor.name,
        email: visitor.email || `${visitor.code.toLowerCase()}@nexathon.live`,
        role: "visitor",
        interests: selectedInterests,
        code: visitor.code,
      };

      try {
        localStorage.setItem("eventos_session_user", JSON.stringify(sessionUser));
      } catch {}

      setCheckedInPass({ name: visitor.name, code: visitor.code });

      // Fast redirect to personalized interest feed
      setTimeout(() => {
        router.push("/visitor");
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to check in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkedInPass) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4 py-20 text-center text-white">
        <div className="glass-strong mx-auto w-full max-w-md rounded-3xl border border-emerald-400/40 bg-emerald-500/[0.08] p-8 shadow-[0_0_50px_rgba(52,211,153,0.2)]">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400 text-black shadow-[0_0_30px_rgba(52,211,153,0.6)]">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <h2 className="font-display mt-5 text-3xl font-extrabold text-white">
            You&apos;re Checked In!
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Welcome to the event, <b className="text-emerald-300">{checkedInPass.name}</b>.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-4 font-mono">
            <span className="text-[10px] uppercase tracking-widest text-white/40 block">
              Admission Pass Code
            </span>
            <span className="text-xl font-bold text-[#c8f31d]">
              {checkedInPass.code}
            </span>
          </div>

          <p className="mt-5 text-xs text-white/50 animate-pulse">
            Loading your personalized expo booth feed…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 pb-24 pt-24 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[140px]" />

      <div className="mx-auto max-w-lg">
        {/* Event Header Banner */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c8f31d]">
            <ScanLine className="h-3 w-3" /> Gate Entrance Self-Check-in
          </div>
          <h1 className="font-display mt-3 text-2xl font-black drop-shadow-md md:text-3xl">
            {eventData?.name || "NEXATHON '26"}
          </h1>
          <p className="mt-1 text-xs text-white/90 font-medium">
            {eventData?.tagline || "Scan & Enter in 10 seconds"}
          </p>
          {eventData?.venue && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-white/80 font-mono">
              <MapPin className="h-3.5 w-3.5 text-[#c8f31d]" />
              <span>{eventData.venue} · {eventData.city}</span>
            </div>
          )}
        </div>

        {/* Quick Check-in Card */}
        <div className="mt-5 glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
          <div className="text-center">
            <h2 className="font-display text-xl font-bold">Quick Admission Pass</h2>
            <p className="mt-1 text-xs text-white/60">
              No long forms or ticket queues. Enter your name and pick tracks you want to explore!
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleInstantCheckin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80">
                Phone Number or Email (Optional)
              </label>
              <input
                type="text"
                placeholder="For instant certificate & booth updates"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 placeholder:text-white/30"
              />
            </div>

            {/* Interest Tags */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-emerald-300">
                Pick Your Tech Interests (AI Match Engine)
              </label>
              <p className="text-[11px] text-white/50">
                We will highlight matching project stalls inside the expo hall:
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(eventData?.categories || AVAILABLE_INTERESTS).map((tag) => {
                  const active = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        active
                          ? "border border-emerald-400 bg-emerald-400/20 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                          : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span>{tag}</span>
                      {active && <CheckCircle2 className="h-3 w-3 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-4 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-white shadow-[0_0_25px_rgba(52,211,153,0.4)] disabled:opacity-50"
            >
              <span>{submitting ? "Admitting You…" : "Instant Check In & Enter Expo"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 border-t border-white/10 pt-4 text-center">
            <Link
              href="/visitor"
              className="text-xs text-white/45 hover:text-white transition"
            >
              Already checked in? Continue to Visitor Feed →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
