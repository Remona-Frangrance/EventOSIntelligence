"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Activity,
  Menu,
  X,
  Zap,
  Award,
  Sparkles,
  Trophy,
  QrCode,
  ShieldCheck,
  Gavel,
  Compass,
  LogOut,
  LogIn,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Globe,
  ChevronDown,
  LayoutDashboard,
  ScanLine,
  Users,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isParticipant, isJudge, isVisitor } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showPortalsMenu, setShowPortalsMenu] = useState(false);

  // Cloud DB status check
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    isCloud: boolean;
    host: string;
    error?: string;
    suggestion?: string;
  } | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function checkDb() {
      try {
        const res = await fetch("/api/db-status");
        if (res.ok) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch { }
    }
    checkDb();
  }, []);

  const roleNavItems = [
    {
      href: "/console",
      label: "Admin OS",
      icon: ShieldCheck,
      badge: "Admin",
      show: user?.role === "admin",
    },
    {
      href: "/participant",
      label: "My Project",
      icon: Zap,
      badge: "Team",
      show: user?.role === "participant" || user?.role === "admin",
    },
    {
      href: "/judge",
      label: "Jury Pad",
      icon: Gavel,
      badge: user?.role === "judge" ? (user.judgeCode || "Jury") : "Jury",
      show: user?.role === "judge" || user?.role === "admin",
    },
    {
      href: "/visitor",
      label: "Explore Feed",
      icon: Compass,
      badge: "Projects",
      show: true,
    },
    {
      href: "/gate",
      label: "Gate QR",
      icon: QrCode,
      badge: "Pass",
      show: user?.role === "visitor" || !user,
    },
    {
      href: "/certificates",
      label: "Cert Studio",
      icon: Award,
      highlight: true,
      show: user?.role === "admin" || user?.role === "participant",
    },
  ].filter((item) => item.show);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#FAFAF9]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Product Logo - Big & Prominent */}
            <Logo withLink size="md" />

            {/* Desktop Navigation - Spacious & Uncluttered */}
            <div className="hidden items-center gap-6 lg:gap-8 md:flex">
              <Link
                href="/#features"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                {t("navFeatures")}
              </Link>
              <Link
                href="/#ai"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                {t("navAiEngine")}
              </Link>
              <Link
                href="/#pricing"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                {t("navPricing")}
              </Link>

              {/* Elegant Portals & Roles Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPortalsMenu(!showPortalsMenu)}
                  onMouseEnter={() => setShowPortalsMenu(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <span>Portals &amp; Hubs</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showPortalsMenu ? "rotate-180 text-indigo-600" : "text-slate-400"}`} />
                </button>

                {showPortalsMenu && (
                  <div
                    onMouseLeave={() => setShowPortalsMenu(false)}
                    className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-fade-in z-50 text-xs"
                  >
                    <Link
                      href="/console"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <LayoutDashboard className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Admin Console</div>
                        <div className="text-[10px] text-slate-500">Mission Control &amp; Telemetry</div>
                      </div>
                    </Link>

                    <Link
                      href="/participant"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Team Workspace</div>
                        <div className="text-[10px] text-slate-500">Booth details &amp; submissions</div>
                      </div>
                    </Link>

                    <Link
                      href="/judge"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shrink-0">
                        <Gavel className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Jury Evaluation Pad</div>
                        <div className="text-[10px] text-slate-500">Live scorecards &amp; rubrics</div>
                      </div>
                    </Link>

                    <Link
                      href="/visitor"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-700 shrink-0">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Visitor Discovery Feed</div>
                        <div className="text-[10px] text-slate-500">Stalls, demos &amp; crowd voting</div>
                      </div>
                    </Link>

                    <div className="my-1 border-t border-slate-100" />

                    <Link
                      href="/certificates"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Certificate Studio</div>
                        <div className="text-[10px] text-slate-500">HMAC-SHA256 verified badges</div>
                      </div>
                    </Link>

                    <Link
                      href="/checkin"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 shrink-0">
                        <ScanLine className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Check-in Terminal</div>
                        <div className="text-[10px] text-slate-500">Offline PWA turnstile scanner</div>
                      </div>
                    </Link>

                    <Link
                      href="/sponsor"
                      onClick={() => setShowPortalsMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition text-slate-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Sponsor Lead Hub</div>
                        <div className="text-[10px] text-slate-500">Badge scanner &amp; CSV export</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Bar: Language Switcher, Database Indicator & User Status */}
            <div className="hidden items-center gap-3 md:flex">
              {/* Language Switcher */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-[10px] font-bold text-slate-600 shadow-xs">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded px-1.5 py-0.5 transition ${language === "en" ? "bg-indigo-600 text-white" : "hover:text-slate-900"}`}
                  title="English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`rounded px-1.5 py-0.5 transition ${language === "hi" ? "bg-indigo-600 text-white" : "hover:text-slate-900"}`}
                  title="हिन्दी (Hindi)"
                >
                  हिं
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("gu")}
                  className={`rounded px-1.5 py-0.5 transition ${language === "gu" ? "bg-indigo-600 text-white" : "hover:text-slate-900"}`}
                  title="ગુજરાતી (Gujarati)"
                >
                  ગુ
                </button>
              </div>

              {/* Cloud DB Status Indicator */}
              <button
                type="button"
                onClick={() => setShowDbModal(true)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition shadow-xs ${dbStatus?.connected && dbStatus?.isCloud
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                title="Click to view database setup and status"
              >
                <span
                  className={`h-2 w-2 rounded-full ${dbStatus?.connected && dbStatus?.isCloud
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-400"
                    }`}
                />
                <span>
                  {dbStatus?.connected && dbStatus?.isCloud ? "Cloud DB Active" : "DB Status"}
                </span>
              </button>

              {/* User Logged In / Out Badge */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={
                      user.role === "admin"
                        ? "/console"
                        : user.role === "participant"
                          ? "/participant"
                          : user.role === "judge"
                            ? "/judge"
                            : "/visitor"
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 shadow-xs transition"
                  >
                    <span className="font-mono text-[10px] uppercase font-bold text-indigo-600">
                      {user.role}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                  </Link>

                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/login"
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/console"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                  >
                    Explore Platform
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(!open)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Dropdown - Clean & High Contrast */}
          {open && (
            <div className="mx-4 mt-2 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 md:hidden animate-fade-in-up">
              <div className="space-y-1">
                <Link
                  href="/console"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>Admin Mission Control</span>
                </Link>
                <Link
                  href="/#features"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>Features</span>
                </Link>
                <Link
                  href="/#ai"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>AI Engine</span>
                </Link>
                <Link
                  href="/#pricing"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 font-semibold"
                >
                  <span>Pricing &amp; Packages</span>
                </Link>
                {/* <Link
                  href="/docs"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>API Docs</span>
                </Link> */}
                <Link
                  href="/participant"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>Participant Portal</span>
                </Link>
                <Link
                  href="/judge"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>Jury Portal</span>
                </Link>
                <Link
                  href="/visitor"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>Visitor Feed</span>
                </Link>
                <Link
                  href="/certificates"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  <span>Certificate Studio</span>
                </Link>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setShowDbModal(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-900"
                >
                  <Database className="h-4 w-4 text-amber-600" /> Cloud DB Status &amp; Setup
                </button>

                {user ? (
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="font-mono text-[10px] text-indigo-700 uppercase font-semibold">
                        {user.role} role
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Cloud Database Setup Modal - Explicit Deep Onyx High-Contrast Dark Card */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-[#0a0e1a] text-white p-6 md:p-8 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Cloud Database Connection</h3>
                  <p className="text-xs text-slate-400">Remote Global Storage (Neon / Supabase PostgreSQL)</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Current DB Connection:</span>
                <span
                  className={`flex items-center gap-1.5 font-mono text-xs font-bold ${dbStatus?.connected
                      ? "text-emerald-400"
                      : "text-amber-300"
                    }`}
                >
                  {dbStatus?.connected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected ({dbStatus.isCloud ? "Live Cloud" : "Local"})
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" /> Offline (In-Memory Fallback Active)
                    </>
                  )}
                </span>
              </div>
              <div className="mt-2 font-mono text-[11px] text-white/40 break-all">
                Host: {dbStatus?.host || "127.0.0.1"}
              </div>
              {dbStatus?.error && (
                <div className="mt-2 text-[11px] text-rose-300 font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 leading-relaxed">
                  <div className="font-bold">Underlying PostgreSQL Error:</div>
                  {dbStatus.error}
                </div>
              )}
              {dbStatus?.suggestion && (
                <div className="mt-2 text-[11px] text-amber-200 bg-amber-500/15 p-2.5 rounded-lg border border-amber-500/30 leading-relaxed">
                  <div className="font-bold text-amber-300">💡 How to fix:</div>
                  {dbStatus.suggestion}
                </div>
              )}
            </div>

            {/* How to Connect Neon in 30 Seconds */}
            <div className="mt-5 space-y-3">
              <h4 className="font-display text-sm font-bold text-white">
                How to Connect a Free Global Cloud Database (30 seconds):
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-white/75">
                <li>
                  Go to{" "}
                  <a
                    href="https://neon.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-cyan-300 hover:underline"
                  >
                    Neon.tech <ExternalLink className="inline h-3 w-3" />
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-cyan-300 hover:underline"
                  >
                    Supabase.com <ExternalLink className="inline h-3 w-3" />
                  </a>{" "}
                  and create a free PostgreSQL database.
                </li>
                <li>
                  Copy your cloud connection string (it looks like:{" "}
                  <span className="font-mono text-[11px] text-[#c8f31d]">
                    postgresql://alex:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
                  </span>
                  ).
                </li>
                <li>
                  Open <span className="font-mono text-amber-300">.env.local</span> in this project and paste:
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-white/15 bg-black/60 p-2.5 font-mono text-[11px] text-white/90">
                    <span className="truncate pr-2">
                      DATABASE_URL="postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require"
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          'DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"'
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="shrink-0 text-white/60 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copied && <span className="text-[10px] text-[#c8f31d]">Copied template!</span>}
                </li>
                <li>
                  Push the schema with:{" "}
                  <span className="font-mono font-bold text-[#c8f31d]">npm run db:push</span>
                </li>
              </ol>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/db-status");
                  const d = await res.json();
                  setDbStatus(d);
                }}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
              >
                Retest Connection Now
              </button>
              <button
                type="button"
                onClick={() => setShowDbModal(false)}
                className="rounded-xl bg-[#c8f31d] px-4 py-2 text-xs font-extrabold text-black hover:bg-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
