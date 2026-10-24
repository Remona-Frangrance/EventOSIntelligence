"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, UserRole } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import {
  ShieldCheck,
  Zap,
  Gavel,
  Compass,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "admin";

  const { login, loginJudge } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [judgeCode, setJudgeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailNotice("");
    setLoading(true);

    try {
      if (activeTab === "judge" && judgeCode.trim()) {
        const res = await loginJudge(judgeCode.trim());
        if (res.success) {
          setEmailNotice("Judge authenticated successfully. Redirecting to evaluation pad…");
          setTimeout(() => {
            router.push("/judge");
          }, 600);
          return;
        } else {
          setError(res.error || "Invalid judge access code.");
          setLoading(false);
          return;
        }
      }

      if (!email.trim() || !password.trim()) {
        setError("Please enter your email and password.");
        setLoading(false);
        return;
      }

      const res = await login(email.trim(), password.trim());
      if (res.success) {
        setEmailNotice(`Sign-in verified. Dispatching to workspace…`);
        setTimeout(() => {
          if (activeTab === "admin") router.push("/console");
          else if (activeTab === "participant") router.push("/participant");
          else if (activeTab === "judge") router.push("/judge");
          else router.push("/visitor");
        }, 600);
      } else {
        setError(res.error || "Invalid credentials. Please verify your email and password.");
        setLoading(false);
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen px-4 pb-20 pt-28 flex flex-col justify-center">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute left-1/2 top-20 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto w-full max-w-2xl">
        {/* Brand & Heading */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-3.5 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Universal Role Gateway</span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Sign in to your event workspace
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Select your platform role below and enter your credentials.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mt-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">
            Select role to sign in
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setError("");
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition ${
                activeTab === "admin"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className={`h-4 w-4 ${activeTab === "admin" ? "text-indigo-600" : "text-slate-400"}`} />
              <div>
                <div className="text-xs font-semibold">Organizer</div>
                <div className="text-[10px] text-slate-500">Admin Console</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("participant");
                setError("");
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition ${
                activeTab === "participant"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Zap className={`h-4 w-4 ${activeTab === "participant" ? "text-indigo-600" : "text-slate-400"}`} />
              <div>
                <div className="text-xs font-semibold">Participant</div>
                <div className="text-[10px] text-slate-500">Team Space</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("judge");
                setError("");
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition ${
                activeTab === "judge"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Gavel className={`h-4 w-4 ${activeTab === "judge" ? "text-indigo-600" : "text-slate-400"}`} />
              <div>
                <div className="text-xs font-semibold">Jury Judge</div>
                <div className="text-[10px] text-slate-500">Rubric Pad</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("visitor");
                setError("");
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition ${
                activeTab === "visitor"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Compass className={`h-4 w-4 ${activeTab === "visitor" ? "text-indigo-600" : "text-slate-400"}`} />
              <div>
                <div className="text-xs font-semibold">Visitor</div>
                <div className="text-[10px] text-slate-500">Discovery Pass</div>
              </div>
            </button>
          </div>
        </div>

        {/* Credentials Card */}
        <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 capitalize">
                {activeTab} Authentication
              </h3>
              <p className="text-xs text-slate-500">Enter your credentials to access the workspace</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 capitalize">
              {activeTab} Portal
            </span>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {emailNotice && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{emailNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {activeTab === "judge" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Judge Passcode (Quick Entry)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. JUDGE-A1B2"
                    value={judgeCode}
                    onChange={(e) => setJudgeCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-wider text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Or enter your registered jury email and password below
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required={!judgeCode}
                  placeholder={
                    activeTab === "admin"
                      ? "admin@nexathon.com"
                      : activeTab === "participant"
                      ? "pulse@nexathon.com"
                      : activeTab === "judge"
                      ? "anjali@nexathon.com"
                      : "visitor@nexathon.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required={!judgeCode}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-[11px] text-slate-600 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>Sign-in confirmation alerts are automatically dispatched to your registered address.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span className="capitalize">Enter {activeTab} Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Need a new attendee or team account?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
                Register here →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
          Loading authentication portal…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
