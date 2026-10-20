"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isParticipant, isJudge, isVisitor } = useAuth();
  const [open, setOpen] = useState(false);

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
      } catch {}
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
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <nav className="glass-strong flex items-center justify-between rounded-2xl px-4 py-3 shadow-2xl border border-white/10 backdrop-blur-2xl">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8f31d] text-black shadow-[0_0_28px_rgba(200,243,29,0.5)] transition group-hover:scale-105 group-hover:rotate-3">
                <Activity className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="leading-none">
                <span className="font-display block text-[15px] font-bold tracking-tight">
                  EVENT INTELLIGENCE <span className="text-[#c8f31d]">OS</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                  4-role multi-tenant
                </span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-1 md:flex">
              {roleNavItems.map((l) => {
                const active = pathname === l.href;
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-white/15 text-white shadow-inner border border-white/10"
                        : l.highlight
                        ? "text-amber-300 hover:bg-amber-400/10 hover:text-amber-200"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 opacity-70" />
                    <span>{l.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#c8f31d]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Action Bar: Database Indicator & User Status */}
            <div className="hidden items-center gap-2.5 md:flex">
              {/* Cloud DB Status Indicator */}
              <button
                type="button"
                onClick={() => setShowDbModal(true)}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-[11px] font-bold border transition ${
                  dbStatus?.connected && dbStatus?.isCloud
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                }`}
                title="Click to view database setup and status"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    dbStatus?.connected && dbStatus?.isCloud
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-amber-400 animate-ping"
                  }`}
                />
                <Database className="h-3 w-3" />
                <span>
                  {dbStatus?.connected && dbStatus?.isCloud
                    ? "Cloud DB Active"
                    : "Cloud DB Setup"}
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
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        user.role === "admin"
                          ? "bg-[#c8f31d]"
                          : user.role === "participant"
                          ? "bg-cyan-400"
                          : user.role === "judge"
                          ? "bg-amber-400"
                          : "bg-fuchsia-400"
                      }`}
                    />
                    <span className="font-mono text-[10px] uppercase font-bold text-white/50">
                      {user.role}:
                    </span>
                    <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                  </Link>

                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:bg-rose-500/20 hover:text-rose-300 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    href="/register"
                    className="flex items-center gap-1 rounded-xl bg-[#c8f31d] px-3.5 py-2 text-xs font-extrabold text-black hover:bg-white transition shadow-[0_0_20px_rgba(200,243,29,0.3)]"
                  >
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(!open)}
              className="rounded-lg p-2 text-white/70 hover:bg-white/5 md:hidden"
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>

          {/* Mobile Dropdown */}
          {open && (
            <div className="glass-strong mt-2 rounded-2xl p-4 md:hidden border border-white/10 animate-fade-in shadow-2xl">
              <div className="space-y-1">
                {roleNavItems.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/5 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 opacity-70" />
                        {l.label}
                      </span>
                      {l.badge && (
                        <span className="font-mono text-[10px] text-white/40">{l.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setShowDbModal(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 py-2.5 text-xs font-bold text-amber-300"
                >
                  <Database className="h-4 w-4" /> Cloud DB Status & Setup
                </button>

                {user ? (
                  <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                    <div className="text-xs">
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="font-mono text-[10px] text-[#c8f31d] uppercase">
                        {user.role} role
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-xl bg-white/10 py-2.5 text-xs font-bold text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-xl bg-[#c8f31d] py-2.5 text-xs font-bold text-black"
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

      {/* Cloud Database Setup Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-strong w-full max-w-xl rounded-3xl border border-white/15 p-6 md:p-8 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Cloud Database Connection</h3>
                  <p className="text-xs text-white/50">Remote Global Storage (Neon / Supabase PostgreSQL)</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Current DB Connection:</span>
                <span
                  className={`flex items-center gap-1.5 font-mono text-xs font-bold ${
                    dbStatus?.connected
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
