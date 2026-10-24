"use client";

import { useState } from "react";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import Logo from "@/components/Logo";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  Cpu,
  ExternalLink,
  Gavel,
  Layers,
  LineChart,
  Lock,
  MessageSquare,
  QrCode as QrIcon,
  RefreshCw,
  Rocket,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const { t } = useLanguage();

  // Interactive Dashboard Preview State
  const [activeTab, setActiveTab] = useState<"scoring" | "checkin" | "ai" | "certs">("scoring");
  const [simulatedScore, setSimulatedScore] = useState(38.6);
  const [liveBiasNormalized, setLiveBiasNormalized] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"per_event" | "annual">("per_event");

  return (
    <main className="bg-[#FAFAF9] text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-xs mb-8 transition hover:border-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            <span>Event Intelligence OS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Universal Event Management</span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.2rem] font-bold tracking-tight text-slate-900 leading-[1.08]">
            {t("heroTitle1")} <br />
            <span className="text-indigo-600">{t("heroTitle2")}</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>

          {/* Two CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/console"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span>{t("ctaExplore")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#dashboard-preview"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span>{t("ctaDemo")}</span>
            </a>
          </div>

          {/* Quiet Trust / Format Indicator */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Free to adopt
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> University Fests &amp; Hackathons
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Startup Expos &amp; Conferences
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. REALISTIC PRODUCT DASHBOARD PREVIEW                                    */}
        {/* ========================================================================= */}
        <div id="dashboard-preview" className="mt-14 scroll-mt-24">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
            {/* Dashboard Browser Frame Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="font-mono ml-2 text-xs text-slate-500">
                  console.eventos.app / nexathon-26
                </span>
              </div>

              {/* Functional Dashboard Tab Switcher */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("scoring")}
                  className={`rounded-md px-3 py-1 transition ${
                    activeTab === "scoring"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Live Scoring
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("checkin")}
                  className={`rounded-md px-3 py-1 transition ${
                    activeTab === "checkin"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  QR &amp; Check-ins
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`rounded-md px-3 py-1 transition ${
                    activeTab === "ai"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  AI Match &amp; Bias
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("certs")}
                  className={`rounded-md px-3 py-1 transition ${
                    activeTab === "certs"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Certificates
                </button>
              </div>
            </div>

            {/* Metric Summary Strip */}
            <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 sm:grid-cols-4 divide-slate-100 border-b border-slate-200 bg-white">
              <div className="p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Registered Projects</div>
                <div className="font-display mt-1 text-2xl font-bold text-slate-900">240</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">↑ 100% Onboarded</div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Jury Panels Assigned</div>
                <div className="font-display mt-1 text-2xl font-bold text-slate-900">32</div>
                <div className="text-[11px] text-indigo-600 font-medium mt-0.5">AI Matched (0 Conflicts)</div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Gate &amp; Booth Scans</div>
                <div className="font-display mt-1 text-2xl font-bold text-slate-900">1,420</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Avg dwell: 4m 12s</div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Scoring Progress</div>
                <div className="font-display mt-1 text-2xl font-bold text-slate-900">98.4%</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">FairScore Active</div>
              </div>
            </div>

            {/* Dashboard Main Visual Body */}
            <div className="p-5 sm:p-8 bg-[#FAFAF9]/60">
              {activeTab === "scoring" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        Live Rubric Scoring &amp; Leaderboard
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evaluated across Innovation (40%), Technical Depth (30%), UX (15%), and Pitch (15%).
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live Stream Active
                    </span>
                  </div>

                  {/* Table Component */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-600">
                        <tr>
                          <th className="py-3 px-4">Rank</th>
                          <th className="py-3 px-4">Project &amp; Team</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Rubric Progress</th>
                          <th className="py-3 px-4 text-right">Total Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr className="bg-indigo-50/30">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">#01</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">MediQueue AI</div>
                            <div className="text-[11px] text-slate-500">Team NeuralPulse · Booth A-12</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">HealthTech</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-36 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: "96%" }} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold text-slate-900 text-sm">
                            {simulatedScore.toFixed(1)} / 40
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">#02</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">SwarmGuard Robotics</div>
                            <div className="text-[11px] text-slate-500">Team AeroByte · Booth B-04</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">IoT &amp; Robotics</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-36 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-slate-700 rounded-full" style={{ width: "91%" }} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold text-slate-900 text-sm">
                            37.2 / 40
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">#03</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">CarbonLedger Protocol</div>
                            <div className="text-[11px] text-slate-500">Team EcoBlock · Booth C-07</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">CleanTech</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-36 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-slate-700 rounded-full" style={{ width: "86%" }} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold text-slate-900 text-sm">
                            36.4 / 40
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bias Alert Notice */}
                  <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-indigo-900">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                      FairScore™ Z-Score Engine active: 0 outlier bias anomalies detected across 4 evaluation panels.
                    </span>
                    <Link href="/console" className="font-semibold text-indigo-700 hover:text-indigo-900 underline">
                      Console Details
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "checkin" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Rapid Attendee &amp; Stall QR Check-In
                    </h3>
                    <p className="text-xs text-slate-500">
                      Validates registered passes in under 5ms using device camera or handheld scanners.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-900">Gate Pass #NX-1420</div>
                          <div className="text-[11px] text-slate-500">Aarav Mehta · VIP Attendee</div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-center p-3 bg-slate-50 rounded-lg">
                        <QrCode value="https://eventos.app/verify/NX-1420" size={100} />
                      </div>
                      <div className="mt-3 font-mono text-[10px] text-center text-slate-400">
                        HASH: e7f4b892a01d... · Verified 1m ago
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Live Gate Stream</div>
                        <div className="text-[11px] text-slate-500">Real-time attendance throughput</div>

                        <div className="mt-3 space-y-2">
                          {[
                            { name: "Priya Sharma", role: "Participant", time: "Just now", status: "Gate A" },
                            { name: "Dr. Elena Vance", role: "Grand Jury", time: "2m ago", status: "VIP Gate" },
                            { name: "Rajesh Kumar", role: "Investor / Scout", time: "4m ago", status: "Gate B" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs">
                              <div>
                                <span className="font-medium text-slate-900">{item.name}</span>
                                <span className="text-slate-400"> ({item.role})</span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">{item.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link
                        href="/checkin"
                        className="mt-4 rounded-lg bg-slate-900 text-center py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                      >
                        Open Full Check-in Kiosk
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      AI Judge Allocation &amp; Fair-Score Guard
                    </h3>
                    <p className="text-xs text-slate-500">
                      Heuristic domain matching pairs judge expertise to projects while flagging statistical score outliers.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { judge: "Dr. Anjali Rao", domain: "Computer Vision", matched: "MediQueue AI", fit: "96%" },
                      { judge: "Suresh Nair", domain: "Robotics & Micro-controllers", matched: "SwarmGuard", fit: "92%" },
                      { judge: "Kavita Reddy", domain: "Smart Grids & CleanTech", matched: "CarbonLedger", fit: "89%" },
                    ].map((j, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{j.judge}</span>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 text-[10px]">
                            {j.fit} fit
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1">{j.domain}</div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Assigned:</span>
                          <span className="font-medium text-slate-800">{j.matched}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">Outlier Bias Detection Simulation</div>
                      <div className="text-slate-500">
                        {liveBiasNormalized
                          ? "Outlier detected (Z = -2.48). Judge score normalized to sample cohort curve."
                          : "Simulate a severe scoring deviation to observe the automated FairScore algorithm."}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLiveBiasNormalized(!liveBiasNormalized)}
                      className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      {liveBiasNormalized ? "Reset Anomaly" : "Simulate Outlier Bias"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "certs" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        Instant Cryptographic Certificate Generation
                      </h3>
                      <p className="text-xs text-slate-500">
                        Permanently verifiable with dynamic QR codes and SHA-256 signatures.
                      </p>
                    </div>
                    <Link
                      href="/certificates"
                      className="self-start sm:self-auto rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                    >
                      Open Cert Studio
                    </Link>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-xl mx-auto shadow-xs">
                    <div className="border border-slate-200 rounded-lg p-5 text-center bg-[#FCFCFA]">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
                        OFFICIAL ACCREDITED CREDENTIAL
                      </div>
                      <div className="font-display text-xl font-bold text-slate-900 mt-2">
                        Aarav Mehta &amp; Team NeuralPulse
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        1st Place Grand Winner · Nexathon National Finals
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-left">
                        <div>
                          <div className="font-mono text-[10px] font-bold text-indigo-700">CERT-NX9421</div>
                          <div className="text-[10px] text-slate-400">SHA-256 Verifiable Hash</div>
                        </div>
                        <QrCode value="https://eventos.app/verify/CERT-NX9421" size={42} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR CONCISE FEATURE SECTIONS                                          */}
      {/* ========================================================================= */}
      <section id="features" className="border-t border-slate-200/80 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mb-16">
            <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-semibold">
              {t("featuresPill")}
            </span>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t("featuresHeading")}
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              {t("featuresSubheading")}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition shadow-xs">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-slate-900">
                  {t("feat1Title")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t("feat1Desc")}
                </p>
              </div>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>{t("ctaRegister")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition shadow-xs">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Trophy className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-slate-900">
                  {t("feat2Title")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t("feat2Desc")}
                </p>
              </div>
              <Link
                href="/judge"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>{t("navJudge")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition shadow-xs">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <LineChart className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-slate-900">
                  {t("feat3Title")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t("feat3Desc")}
                </p>
              </div>
              <Link
                href="/visitor"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>{t("navVisitor")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition shadow-xs">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Award className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-slate-900">
                  {t("feat4Title")}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t("feat4Desc")}
                </p>
              </div>
              <Link
                href="/certificates"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>{t("navCert")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DISTINCT AI SECTION                                                    */}
      {/* ========================================================================= */}
      <section id="ai" className="border-t border-slate-200/80 bg-[#FAFAF9] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-semibold">
              {t("aiPill")}
            </span>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t("aiHeading")}
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              {t("aiSubheading")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* AI 1: Judge Matching */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                01 / HEURISTIC MATCHING
              </span>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("ai1Title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("ai1Desc")}
              </p>
            </div>

            {/* AI 2: Fair-Score Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                02 / STATISTICAL ENGINE
              </span>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("ai2Title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("ai2Desc")}
              </p>
            </div>

            {/* AI 3: Feedback Summaries */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                03 / NATURAL LANGUAGE
              </span>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("ai3Title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("ai3Desc")}
              </p>
            </div>

            {/* AI 4: Personalized Recommendations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                04 / GROWTH MATRIX
              </span>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("ai4Title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("ai4Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COMPACT WORKFLOW SECTION                                               */}
      {/* ========================================================================= */}
      <section id="workflow" className="border-t border-slate-200/80 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl mb-16">
            <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-semibold">
              {t("workflowPill")}
            </span>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t("workflowHeading")}
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative">
              <div className="font-mono text-2xl font-extrabold text-indigo-600/30">01</div>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("step1")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("step1Desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="font-mono text-2xl font-extrabold text-indigo-600/30">02</div>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("step2")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("step2Desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="font-mono text-2xl font-extrabold text-indigo-600/30">03</div>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("step3")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("step3Desc")}
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="font-mono text-2xl font-extrabold text-indigo-600/30">04</div>
              <h3 className="font-display mt-2 text-base font-bold text-slate-900">
                {t("step4")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t("step4Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CLEAN FINAL CALL TO ACTION                                             */}
      {/* ========================================================================= */}
      <section className="border-t border-slate-200/80 bg-[#FAFAF9] py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {t("readyHeading")}
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
            {t("readySubtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/console"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <span>{t("ctaExplore")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <span>{t("ctaRegister")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PACKAGES & PRICING SECTION (#pricing)                                     */}
      {/* ========================================================================= */}
      <section id="pricing" className="border-t border-slate-200/90 bg-white py-24 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-xs mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("pricingTitle")}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
              {t("pricingTitle")}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              {t("pricingSubtitle")}
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs font-semibold text-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle("per_event")}
                className={`rounded-lg px-4 py-2 transition ${billingCycle === "per_event" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"}`}
              >
                {t("perEvent")}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${billingCycle === "annual" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"}`}
              >
                <span>{t("annualUnlimited")}</span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">{t("save25")}</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-16 grid gap-8 lg:grid-cols-3 items-stretch">
            {/* Free Tier */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-[#FAFAF9] p-8 shadow-xs transition hover:shadow-md">
              <div>
                <div className="inline-block rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700">
                  Campus &amp; Hackathon
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{t("starterTierName")}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {t("starterTierDesc")}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                  <span className="text-xs text-slate-500">/ forever free</span>
                </div>

                <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>500 attendees</strong> &amp; 50 project stalls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dynamic QR Gate Pass &amp; Check-in Scanner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>4 Core Portals (Admin, Judge, Participant, Visitor)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Deterministic AI Scoring &amp; FairScore (1.8σ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>HMAC-SHA256 Digital Verified Certificates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Crowd voting &amp; 5-star visitor reviews</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/console"
                  className="block w-full text-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50"
                >
                  {t("ctaStartFree")}
                </Link>
              </div>
            </div>

            {/* Growth Pro Tier (Popular) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-indigo-600 bg-white p-8 shadow-xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-[11px] font-bold text-white shadow-md">
                {t("popularTier")} · ORGANIZER CHOICE
              </div>

              <div>
                <div className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Flagship Fests &amp; Summits
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{t("growthTierName")}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {t("growthTierDesc")}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {billingCycle === "per_event" ? "₹4,999" : "₹3,749"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {billingCycle === "per_event" ? "/ per event" : "/ month (billed annually)"}
                  </span>
                </div>

                <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Up to <strong>2,500 attendees</strong> &amp; unlimited projects</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Multi-Tier Paid Ticketing (Razorpay + instant passes)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Autonomous Claude 3.5 Sonnet Executive Reports</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Real-Time SSE Live Scoring Stream (4s reactive pulse)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Offline-Capable Scanner PWA with auto-sync queue</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Sponsor Lead Retrieval Terminal &amp; CRM CSV export</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-indigo-950">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Universal Bulk CSV Import (Jury &amp; Teams) &amp; Export</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/register"
                  className="block w-full text-center rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-700"
                >
                  {t("ctaLaunchGrowth")}
                </Link>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-[#FAFAF9] p-8 shadow-xs transition hover:shadow-md">
              <div>
                <div className="inline-block rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700">
                  Global Expos &amp; Conferences
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{t("enterpriseTierName")}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {t("enterpriseTierDesc")}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {billingCycle === "per_event" ? "₹14,999" : "₹11,999"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {billingCycle === "per_event" ? "/ per event" : "/ month (annual SLA)"}
                  </span>
                </div>

                <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span><strong>Unlimited attendees</strong>, stalls, and jury members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Multi-Tenant Custom Domain &amp; Brand Whitelabeling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Public REST API with API Keys &amp; Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Multilingual Interface (English, Hindi, Gujarati)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Sentry Error Monitoring &amp; 99.99% Uptime Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Technical Account Manager on floor</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/console"
                  className="block w-full text-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50"
                >
                  {t("ctaDeployEnterprise")}
                </Link>
              </div>
            </div>
          </div>

          {/* Pricing Guarantee / Trust Signals */}
          <div className="mt-16 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 text-center text-xs text-slate-600 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Zero Vendor Lock-in · Full RFC 4180 CSV Data Export</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Instant Pass Activation · Razorpay &amp; Sandbox Ready</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-4 w-4 text-indigo-600" />
              <span>HMAC-SHA256 Cryptographic Credential Tamper Protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CLEAN FOOTER                                                           */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="md" withLink />
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="hidden sm:inline text-slate-500">Universal Event SaaS Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-slate-600 font-medium">
            <Link href="/console" className="hover:text-slate-900 transition">Console OS</Link>
            <Link href="/participant" className="hover:text-slate-900 transition">Participant</Link>
            <Link href="/judge" className="hover:text-slate-900 transition">Jury Pad</Link>
            <Link href="/visitor" className="hover:text-slate-900 transition">Visitor Feed</Link>
            <Link href="/certificates" className="hover:text-slate-900 transition">Certificates</Link>
            <Link href="/checkin" className="hover:text-slate-900 transition">Check-in</Link>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            © 2026 EventOS. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
