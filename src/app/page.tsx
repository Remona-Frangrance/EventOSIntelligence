"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import LivePulse from "@/components/LivePulse";
import ThreeDCard from "@/components/ThreeDCard";
import {
  Activity,
  ArrowRight,
  Award,
  BrainCircuit,
  CalendarCheck,
  ClipboardList,
  Fingerprint,
  MessageSquareHeart,
  QrCode as QrIcon,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
  ChevronRight,
  Play,
  BadgeCheck,
  BarChart3,
  BellRing,
  Wand2,
  CheckCircle2,
  ExternalLink,
  Flame,
  Layers,
  Printer,
  Copy,
  ThumbsUp,
  Cpu,
  Gavel,
  Compass,
} from "lucide-react";

const eventTypes = [
  "GLOBAL HACKATHONS",
  "STARTUP EXPOS",
  "COLLEGE TECH FESTS",
  "AI SUMMITS",
  "DEVCON CONFERENCES",
  "ROBOTICS COMPETITIONS",
  "DESIGN WEEKS",
  "INNOVATION NIGHTS",
];

export default function LandingPage() {
  // Hero interactive showcase tab state
  const [heroTab, setHeroTab] = useState<"leaderboard" | "certificate" | "judgematch" | "booth">("leaderboard");

  // Interactive Live Certificate Generator on Homepage
  const [certName, setCertName] = useState("Aarav Mehta");
  const [certRole, setCertRole] = useState("winner");
  const [certTheme, setCertTheme] = useState<"gold" | "cyber">("gold");
  const [certCode, setCertCode] = useState("CERT-NX9421");

  // Project upvote interaction
  const [votes, setVotes] = useState({ mediqueue: 94, swarm: 81, carbon: 68 });
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  function handleVote(key: "mediqueue" | "swarm" | "carbon") {
    if (voted[key]) return;
    setVotes((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setVoted((prev) => ({ ...prev, [key]: true }));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070f] text-white">
      {/* Dynamic Cosmic Aurora Backdrops */}
      <div className="aurora-bg top-0 h-[700px] opacity-70" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[650px] w-[1000px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[150px]" />
      <div className="pointer-events-none absolute right-[-150px] top-60 h-[450px] w-[450px] rounded-full bg-[#c8f31d]/12 blur-[130px]" />
      <div className="pointer-events-none absolute left-[-150px] top-[900px] h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[140px]" />

      {/* HERO SECTION */}
      <section className="grid-bg noise relative pb-20 pt-32 md:pt-40">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            {/* High-tech Badge */}
            <div className="glass-card flex items-center gap-2.5 rounded-full px-4 py-2 shadow-[0_0_25px_rgba(200,243,29,0.2)]">
              <span className="h-2 w-2 animate-blink rounded-full bg-[#c8f31d]" />
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#c8f31d] font-bold">
                EVENT INTELLIGENCE OS 3.4 · LIVE KERNEL
              </span>
            </div>

            {/* Hero Heading with Animated Gradient Typography */}
            <h1 className="font-display mt-7 max-w-5xl text-[clamp(2.7rem,7.5vw,5.8rem)] font-extrabold leading-[0.93] tracking-tight">
              THE OPERATING SYSTEM FOR{" "}
              <br />
              <span className="bg-gradient-to-r from-[#c8f31d] via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                HIGH-STAKES TECH EVENTS
              </span>
              <span className="text-[#c8f31d]">.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base text-white/65 md:text-lg leading-relaxed">
              Registration in 90s, AI judge matching, live leaderboard with fair-score bias detection,
              real-time footfall telemetry, and <strong className="text-white">instant cryptographic certificates</strong>.
            </p>

            {/* Action Buttons */}
            <div className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row">
              <Link
                href="/login"
                className="shimmer-sweep group flex items-center gap-2.5 rounded-2xl bg-[#c8f31d] px-8 py-4 text-sm font-extrabold text-black transition hover:bg-white shadow-[0_0_35px_rgba(200,243,29,0.4)]"
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={3} />
                <span>CHOOSE PORTAL ROLE</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/participant"
                className="glass-card group flex items-center gap-2.5 rounded-2xl px-6 py-4 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10 border border-cyan-400/30"
              >
                <Zap className="h-4 w-4" />
                <span>Participant Studio</span>
              </Link>

              <Link
                href="/judge"
                className="glass-card group flex items-center gap-2.5 rounded-2xl px-6 py-4 text-sm font-bold text-amber-300 transition hover:bg-amber-400/10 border border-amber-400/30"
              >
                <Gavel className="h-4 w-4" />
                <span>4 Judges Panel</span>
              </Link>

              <Link
                href="/visitor"
                className="glass group flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-400/10 border border-fuchsia-400/30"
              >
                <Compass className="h-4 w-4" />
                <span>Visitor Feed</span>
              </Link>
            </div>

            {/* 4 Roles Quick Access Cards */}
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4 max-w-4xl w-full">
              <Link
                href="/console"
                className="glass-strong rounded-2xl border border-[#c8f31d]/30 bg-[#c8f31d]/5 p-3.5 text-left transition hover:scale-105 hover:border-[#c8f31d]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#c8f31d]">Role 1</span>
                  <span className="text-xs">👑</span>
                </div>
                <div className="mt-1 text-sm font-bold text-white">Chief Admin</div>
                <div className="text-[11px] text-white/50">Manage all events, booths & judges</div>
              </Link>

              <Link
                href="/participant"
                className="glass-strong rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-3.5 text-left transition hover:scale-105 hover:border-cyan-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-cyan-300">Role 2</span>
                  <span className="text-xs">🚀</span>
                </div>
                <div className="mt-1 text-sm font-bold text-white">2 Participants</div>
                <div className="text-[11px] text-white/50">Project details, banner & demo links</div>
              </Link>

              <Link
                href="/judge"
                className="glass-strong rounded-2xl border border-amber-400/30 bg-amber-400/5 p-3.5 text-left transition hover:scale-105 hover:border-amber-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-300">Role 3</span>
                  <span className="text-xs">⚖️</span>
                </div>
                <div className="mt-1 text-sm font-bold text-white">4 Judges Panel</div>
                <div className="text-[11px] text-white/50">View all projects & rate on criteria</div>
              </Link>

              <Link
                href="/visitor"
                className="glass-strong rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/5 p-3.5 text-left transition hover:scale-105 hover:border-fuchsia-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-fuchsia-300">Role 4</span>
                  <span className="text-xs">🎟️</span>
                </div>
                <div className="mt-1 text-sm font-bold text-white">Visitor / Scout</div>
                <div className="text-[11px] text-white/50">Say interests & explore matched projects</div>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="font-mono mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-white/50">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-400" /> Cloud PostgreSQL & Neon Ready
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-300" /> Live Multi-Judge Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <QrIcon className="h-4 w-4 text-cyan-300" /> Booth QR & Digital Passes
              </span>
            </div>
          </div>

          {/* INTERACTIVE 3D HERO SHOWCASE */}
          <div className="mt-14 lg:mt-16">
            <ThreeDCard glowColor="lime" maxTilt={7}>
              <div className="glass-card overflow-hidden rounded-3xl border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
              {/* Top Window Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#090d1a] px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span className="font-mono ml-3 text-xs text-white/50">event-kernel.os — nexathon-26 · live runtime</span>
                </div>

                {/* Showcase Interactive Tab Switcher */}
                <div className="flex items-center gap-1 rounded-xl bg-black/50 p-1 border border-white/10">
                  <button
                    onClick={() => setHeroTab("leaderboard")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      heroTab === "leaderboard"
                        ? "bg-[#c8f31d] text-black font-extrabold shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🏆 Live Scoring
                  </button>
                  <button
                    onClick={() => setHeroTab("certificate")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      heroTab === "certificate"
                        ? "bg-amber-300 text-black font-extrabold shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    📜 Smart Certs
                  </button>
                  <button
                    onClick={() => setHeroTab("judgematch")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      heroTab === "judgematch"
                        ? "bg-purple-300 text-black font-extrabold shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    ⚖️ JudgeMatch AI
                  </button>
                  <button
                    onClick={() => setHeroTab("booth")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      heroTab === "booth"
                        ? "bg-cyan-300 text-black font-extrabold shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    📡 Booth Intel
                  </button>
                </div>
              </div>

              {/* Showcase Body */}
              <div className="grid gap-6 p-6 lg:grid-cols-12 lg:p-8 bg-gradient-to-b from-[#090d1a] to-[#05070f]">
                {/* Left Content Area (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {heroTab === "leaderboard" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-xs uppercase tracking-wider text-[#c8f31d]">
                            LIVE TELEMETRY · NEXATHON FINALS
                          </div>
                          <h3 className="font-display text-xl font-bold mt-1">Real-time Leaderboard & Bias Guard</h3>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-blink rounded-full bg-emerald-400" />
                          Streaming Active
                        </span>
                      </div>

                      {/* Score Rows */}
                      <div className="space-y-2.5 mt-4">
                        {[
                          { r: "01", t: "MediQueue AI", team: "NeuralPulse", cat: "HealthTech", score: "38.6", w: "96%", hot: true },
                          { r: "02", t: "SwarmGuard Drones", team: "AeroByte", cat: "IoT / Robotics", score: "37.2", w: "90%", hot: false },
                          { r: "03", t: "CarbonLedger Protocol", team: "EcoBlock", cat: "GreenTech", score: "36.4", w: "84%", hot: false },
                          { r: "04", t: "NeuroSense BCI", team: "Synapse", cat: "AI/ML", score: "35.1", w: "78%", hot: false },
                        ].map((row) => (
                          <div
                            key={row.r}
                            className={`flex items-center gap-4 rounded-2xl border p-3.5 transition ${
                              row.hot
                                ? "border-[#c8f31d]/40 bg-[#c8f31d]/[0.07] shadow-[0_0_20px_rgba(200,243,29,0.15)]"
                                : "border-white/5 bg-white/[0.02]"
                            }`}
                          >
                            <span className={`font-mono text-xs font-bold ${row.hot ? "text-[#c8f31d]" : "text-white/40"}`}>
                              {row.r}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{row.t}</span>
                                <span className="text-xs text-white/50">· {row.team}</span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    row.hot ? "bg-[#c8f31d]" : "bg-gradient-to-r from-violet-500 to-cyan-400"
                                  }`}
                                  style={{ width: row.w }}
                                />
                              </div>
                            </div>
                            <span className="font-mono text-xs text-white/40">{row.cat}</span>
                            <span className="font-display text-lg font-extrabold tabular-nums">{row.score}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-300">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-amber-400" />
                          FairScore Engine active: 0 outlier bias anomalies detected in latest round.
                        </span>
                        <Link href="/console" className="font-bold underline hover:text-white">
                          View details
                        </Link>
                      </div>
                    </div>
                  )}

                  {heroTab === "certificate" && (
                    <div className="space-y-4">
                      <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-amber-300">
                          TAMPER-PROOF CREDENTIALS
                        </div>
                        <h3 className="font-display text-xl font-bold mt-1">Instant Verification & QR Badges</h3>
                        <p className="text-xs text-white/60 mt-1">
                          Certificates are cryptographically signed with unique hashes, verifiable by anyone with a smartphone camera.
                        </p>
                      </div>

                      <div className="cert-gold rounded-2xl border border-amber-400/40 p-6 text-center shadow-xl">
                        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300 font-bold">
                          NATIONAL HACKATHON CHAMPION
                        </div>
                        <h4 className="font-luxury mt-2 text-2xl font-bold gold-foil">
                          Aarav Mehta & Team NeuralPulse
                        </h4>
                        <p className="mt-1 text-xs opacity-80">
                          1st Place Grand Winner · Nexathon &apos;26 National Finals
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-amber-400/20 pt-3">
                          <span className="font-mono text-xs text-[#c8f31d]">CERT-NX9421</span>
                          <span className="text-[10px] opacity-60">Verified via Event Intelligence Protocol</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href="/certificates"
                          className="flex-1 rounded-xl bg-amber-400 py-2.5 text-center text-xs font-bold text-black hover:bg-white transition"
                        >
                          Open Certificate Studio
                        </Link>
                        <Link
                          href="/verify/CERT-NX9421"
                          target="_blank"
                          className="glass rounded-xl px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                        >
                          Test Verifier
                        </Link>
                      </div>
                    </div>
                  )}

                  {heroTab === "judgematch" && (
                    <div className="space-y-4">
                      <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-purple-300">
                          HEURISTIC AI EVALUATION
                        </div>
                        <h3 className="font-display text-xl font-bold mt-1">Affinity-Based Panel Allocation</h3>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          { judge: "Dr. Anjali Rao", spec: "Computer Vision & Edge AI", match: "96%", prj: "MediQueue AI", color: "text-[#c8f31d]" },
                          { judge: "Suresh Nair", spec: "Embedded Systems & ROS2", match: "92%", prj: "SwarmGuard Drones", color: "text-cyan-300" },
                          { judge: "Kavita Reddy", spec: "Smart Contracts & Climate Tech", match: "89%", prj: "CarbonLedger", color: "text-purple-300" },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                            <div>
                              <div className="text-sm font-bold text-white">{m.judge}</div>
                              <div className="text-xs text-white/50">{m.spec} → <span className="text-white font-medium">{m.prj}</span></div>
                            </div>
                            <span className={`font-mono text-sm font-bold ${m.color}`}>{m.match} match</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl bg-white/[0.03] p-3 text-xs text-white/60">
                        ⚡ Explainable matching matrix: assigns evaluating panels automatically without human bias or scheduling bottlenecks.
                      </div>
                    </div>
                  )}

                  {heroTab === "booth" && (
                    <div className="space-y-4">
                      <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                          FOOTFALL INTEL & QR PASSPORTS
                        </div>
                        <h3 className="font-display text-xl font-bold mt-1">Live Crowd Heatmap & Scans</h3>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
                          <div className="font-display text-2xl font-bold text-cyan-300">1,420</div>
                          <div className="font-mono text-[10px] text-white/50 uppercase">Booth Scans</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
                          <div className="font-display text-2xl font-bold text-[#c8f31d]">4m 12s</div>
                          <div className="font-mono text-[10px] text-white/50 uppercase">Avg Dwell Time</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
                          <div className="font-display text-2xl font-bold text-emerald-300">98.4%</div>
                          <div className="font-mono text-[10px] text-white/50 uppercase">Hype Index</div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/70">
                        Every team booth receives a unique scannable identity card. Visitors scan to view pitch decks, live demo URLs, and cast audience choice votes in 1 tap.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Interactive Sidebar (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <LivePulse />

                  <div className="glass-card rounded-2xl p-4.5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md">
                        <BellRing className="h-5 w-5 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">Autonomous Event Assistant</div>
                        <div className="font-mono text-[11px] text-[#c8f31d] truncate">
                          30 panels assigned · 0 scheduling conflicts
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </ThreeDCard>
          </div>
        </div>
      </section>

      {/* MARQUEE OF EVENT TYPES */}
      <div className="border-y border-white/10 bg-black/50 py-4.5 backdrop-blur-md">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...eventTypes, ...eventTypes].map((t, i) => (
              <span
                key={i}
                className="font-display flex items-center gap-10 whitespace-nowrap text-xs md:text-sm font-bold tracking-[0.25em] text-white/40"
              >
                {t} <span className="text-[#c8f31d]">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* INTERACTIVE CERTIFICATE STUDIO TEASER (Directly on Homepage) */}
      <section className="relative mx-auto max-w-7xl px-4 py-24">
        <div className="aurora-bg top-10 h-72 opacity-50" />

        <div className="relative glass-card rounded-3xl p-8 md:p-12 border border-amber-400/30 overflow-hidden shadow-[0_20px_80px_rgba(251,191,36,0.15)]">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            {/* Left Info & Live Controls (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>INTERACTIVE CERTIFICATE ENGINE</span>
                </span>
                <h2 className="font-display mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
                  Design & Issue <span className="gold-foil">Accredited Certificates</span> in Seconds
                </h2>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">
                  Type any name below to see the live vector certificate update in real time.
                  Every certificate includes dynamic QR verification, custom signatories, and luxury styling.
                </p>
              </div>

              {/* Interactive Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                    Type Recipient Name
                  </label>
                  <input
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="Enter recipient name…"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-sm font-medium text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                      Award Role
                    </label>
                    <select
                      value={certRole}
                      onChange={(e) => setCertRole(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="winner">🏆 1st Place Winner</option>
                      <option value="runner_up">🥈 1st Runner Up</option>
                      <option value="judge">⚖️ Grand Jury Member</option>
                      <option value="participant">📜 Participant</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                      Aesthetic Theme
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCertTheme("gold")}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                          certTheme === "gold"
                            ? "border-amber-400 bg-amber-400/20 text-amber-300"
                            : "border-white/10 bg-white/5 text-white/60"
                        }`}
                      >
                        🌟 Gold
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertTheme("cyber")}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                          certTheme === "cyber"
                            ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                            : "border-white/10 bg-white/5 text-white/60"
                        }`}
                      >
                        ⚡ Cyber
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/certificates"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#c8f31d] px-6 py-3 text-sm font-extrabold text-black transition hover:opacity-90 shadow-md"
                >
                  <Award className="h-4 w-4" />
                  <span>Open Full Certificate Studio</span>
                </Link>
                <Link
                  href={`/verify/${certCode}`}
                  target="_blank"
                  className="glass flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
                >
                  <span>Verify Hash ({certCode})</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Live Certificate Card (6 Cols) */}
            <div className="lg:col-span-6">
              <ThreeDCard glowColor={certTheme === "gold" ? "gold" : "cyan"} maxTilt={14}>
                <div
                  className={`relative overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 p-7 md:p-9 text-center ${
                    certTheme === "gold"
                      ? "cert-gold border-amber-400/40"
                      : "cert-cyber border-cyan-400/40"
                  }`}
                >
                  <div className="guilloche-border absolute inset-2.5 rounded-2xl pointer-events-none opacity-40 border border-current" />

                  <div className="relative">
                    <div className="flex items-center justify-between border-b border-current/20 pb-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
                        OFFICIAL CREDENTIAL
                      </span>
                      <span className="font-mono text-xs font-bold text-[#c8f31d]">{certCode}</span>
                    </div>

                    <div className="my-6">
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-80 mb-2">
                        CERTIFICATE OF {certRole.toUpperCase()}
                      </div>
                      <div
                        className={`font-luxury text-2xl md:text-3xl font-extrabold tracking-tight ${
                          certTheme === "gold" ? "gold-foil" : "text-cyan-300"
                        }`}
                      >
                        {certName || "Recipient Name"}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed opacity-80">
                        in recognition of exemplary performance and high-impact innovation at Nexathon &apos;26.
                      </p>
                    </div>

                    <div className="flex items-end justify-between border-t border-current/20 pt-4 text-left">
                      <div>
                        <div className="font-editorial text-sm italic opacity-90 border-b border-current/40 pb-0.5">
                          Dr. Elena Vance
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-wider opacity-60 mt-0.5">
                          Head of Jury
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-1">
                        <QrCode
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${certCode}`}
                          size={56}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </ThreeDCard>
            </div>
          </div>
        </div>
      </section>

      {/* THE 6 CORE CAPABILITIES (Bento Grid) */}
      <section className="relative mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#c8f31d]">
              // 01 — THE UNIFIED PLATFORM
            </div>
            <h2 className="font-display mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
              Engineered for Maximum Fairness & Zero Chaos
            </h2>
          </div>
          <p className="max-w-md text-sm text-white/60">
            Replaces disjointed spreadsheets, forms, and WhatsApp groups with a single real-time collaborative operating system.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              tag: "01 / REGISTER",
              title: "Project Onboarding in 90s",
              desc: "Automated team profiles, tech stack tags, demo links, and auto-assigned booth IDs with QR codes.",
              accent: "text-[#c8f31d]",
              href: "/register",
            },
            {
              icon: Trophy,
              tag: "02 / LIVE SCORING",
              title: "Judge Allocation & Scoring",
              desc: "Multi-criteria rubric with live score updates streaming to real-time project leaderboards.",
              accent: "text-amber-300",
              href: "/judge",
            },
            {
              icon: Award,
              tag: "03 / CERTIFICATES",
              title: "Cryptographic Certificate Studio",
              desc: "Tamper-proof digital credentials with embedded QR verification, ready to print or share instantly.",
              accent: "text-fuchsia-300",
              href: "/certificates",
            },
            {
              icon: ScanLine,
              tag: "04 / QR CHECK-IN",
              title: "Rapid Attendee Check-In",
              desc: "One-tap gate pass validation with VIP tiers, real-time headcounts, and duplicate entry blocking.",
              accent: "text-emerald-300",
              href: "/checkin",
            },
            {
              icon: ShieldCheck,
              tag: "05 / AI BIAS GUARD",
              title: "FairScore™ Z-Score Engine",
              desc: "Statistical outlier detection flags judge harshness or generosity bias before prizes are locked in.",
              accent: "text-cyan-300",
              href: "/console",
            },
            {
              icon: MessageSquareHeart,
              tag: "06 / AUDIENCE PULSE",
              title: "Sentiment & Feedback Radar",
              desc: "Audience feedback compressed into sentiment clusters, trending themes, and actionable organizer summaries.",
              accent: "text-rose-300",
              href: "/feedback",
            },
          ].map((m) => (
            <Link
              key={m.tag}
              href={m.href}
              className="glass-card group flex flex-col justify-between rounded-3xl p-7 transition duration-300 hover:-translate-y-1.5 hover:border-white/25"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/60 ${m.accent}`}>
                    <m.icon className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">{m.tag}</span>
                </div>
                <h3 className="font-display mt-5 text-xl font-bold group-hover:text-[#c8f31d] transition">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{m.desc}</p>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-white/70 group-hover:text-[#c8f31d] transition">
                <span>Explore module</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* INTERACTIVE PROJECT SHOWCASE */}
      <section className="relative border-y border-white/10 bg-gradient-to-b from-[#090e1f] to-[#05070f] py-24">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#c8f31d]">
                // 02 — LIVE SHOWCASE
              </div>
              <h2 className="font-display mt-2 text-3xl md:text-5xl font-extrabold tracking-tight">
                Featured Innovation Projects
              </h2>
            </div>
            <p className="text-sm text-white/60 max-w-sm">
              Cast your vote directly on live project cards or scan booth passes to inspect code repositories.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-white/10 hover:border-[#c8f31d]/30 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-cyan-300">
                    HealthTech · Booth A-12
                  </span>
                  <span className="font-mono text-xs text-white/40">NX-201</span>
                </div>
                <h3 className="font-display mt-4 text-xl font-bold">MediQueue AI</h3>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  Real-time autonomous hospital triage system using computer vision to route patient ambulances and allocate ICU beds dynamically.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Next.js", "Python", "FastAPI", "YOLOv8"].map((t) => (
                    <span key={t} className="font-mono rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  onClick={() => handleVote("mediqueue")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    voted.mediqueue
                      ? "bg-emerald-400 text-black"
                      : "bg-white/10 text-white hover:bg-[#c8f31d] hover:text-black"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{voted.mediqueue ? "Voted!" : "Vote"} ({votes.mediqueue})</span>
                </button>
                <Link
                  href="/p/NX-201"
                  className="font-mono text-xs text-[#c8f31d] hover:underline flex items-center gap-1"
                >
                  <span>Booth Pass</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-white/10 hover:border-cyan-400/30 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-amber-300">
                    IoT &amp; Robotics · Booth B-04
                  </span>
                  <span className="font-mono text-xs text-white/40">NX-202</span>
                </div>
                <h3 className="font-display mt-4 text-xl font-bold">SwarmGuard Drones</h3>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  Mesh-networked autonomous micro-drones for thermal crop disease mapping and precision fertilizer micro-dosing.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Rust", "ESP32", "ROS2", "Next.js"].map((t) => (
                    <span key={t} className="font-mono rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  onClick={() => handleVote("swarm")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    voted.swarm
                      ? "bg-emerald-400 text-black"
                      : "bg-white/10 text-white hover:bg-cyan-400 hover:text-black"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{voted.swarm ? "Voted!" : "Vote"} ({votes.swarm})</span>
                </button>
                <Link
                  href="/p/NX-202"
                  className="font-mono text-xs text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>Booth Pass</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-white/10 hover:border-emerald-400/30 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    GreenTech · Booth C-07
                  </span>
                  <span className="font-mono text-xs text-white/40">NX-203</span>
                </div>
                <h3 className="font-display mt-4 text-xl font-bold">CarbonLedger Protocol</h3>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  Satellite imagery verified automated carbon offset tracking protocol for renewable power installations.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Solidity", "TypeScript", "PostgreSQL"].map((t) => (
                    <span key={t} className="font-mono rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  onClick={() => handleVote("carbon")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    voted.carbon
                      ? "bg-emerald-400 text-black"
                      : "bg-white/10 text-white hover:bg-emerald-400 hover:text-black"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{voted.carbon ? "Voted!" : "Vote"} ({votes.carbon})</span>
                </button>
                <Link
                  href="/p/NX-203"
                  className="font-mono text-xs text-emerald-300 hover:underline flex items-center gap-1"
                >
                  <span>Booth Pass</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="relative glass-card rounded-3xl p-10 md:p-16 border border-[#c8f31d]/30 overflow-hidden shadow-[0_0_80px_rgba(200,243,29,0.15)]">
          <div className="aurora-bg top-0 opacity-60" />

          <div className="relative max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c8f31d]/40 bg-[#c8f31d]/10 px-4 py-1.5 text-xs font-bold text-[#c8f31d]">
              <Zap className="h-3.5 w-3.5" />
              READY FOR PRODUCTION
            </span>

            <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Host Your Next Event on the <br />
              <span className="bg-gradient-to-r from-[#c8f31d] via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Intelligence Kernel
              </span>
            </h2>

            <p className="text-base text-white/65 max-w-xl mx-auto">
              Empower your judges, attendees, and sponsors with an experience they will talk about for years.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
              <Link
                href="/console"
                className="shimmer-sweep flex items-center gap-2 rounded-2xl bg-[#c8f31d] px-8 py-4 text-sm font-extrabold text-black transition hover:bg-white shadow-[0_0_30px_rgba(200,243,29,0.4)]"
              >
                <Zap className="h-4 w-4" strokeWidth={3} />
                <span>Launch Organizer OS</span>
              </Link>
              <Link
                href="/certificates"
                className="glass-card flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-amber-300 border border-amber-400/30 hover:bg-amber-400/10 transition"
              >
                <Award className="h-4 w-4" />
                <span>Certificate Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#04060d] py-12 text-xs text-white/50">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c8f31d] text-black font-bold">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display font-bold text-white text-sm">EVENT INTELLIGENCE OS</div>
              <div className="font-mono text-[10px] text-white/40">Open event infrastructure protocol</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link href="/events" className="hover:text-white transition">Events</Link>
            <Link href="/certificates" className="hover:text-amber-300 transition">Certificates</Link>
            <Link href="/console" className="hover:text-white transition">Organizer OS</Link>
            <Link href="/judge" className="hover:text-white transition">Judge Portal</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <Link href="/checkin" className="hover:text-white transition">Check-in</Link>
          </div>

          <div className="font-mono text-[11px] text-white/40">
            © 2026 Event Intelligence OS · All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
