"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, UserRole } from "@/context/AuthContext";
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
  Users,
  Award,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginJudge, quickLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [judgeCode, setJudgeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoAccounts = {
    admin: [
      {
        name: "Alex Vance",
        title: "Chief Organizer & Platform Admin",
        email: "admin@nexathon.com",
        password: "admin123",
        badge: "Full Control",
        dest: "/console",
      },
    ],
    participant: [
      {
        name: "Aarav Mehta",
        title: "Team PulseCoders · MediQueue AI (HealthTech)",
        email: "pulse@nexathon.com",
        password: "part123",
        badge: "Booth B-1",
        dest: "/participant",
      },
      {
        name: "Kavya Iyer",
        title: "Team NeuralNest · SignBridge (AI/ML)",
        email: "neural@nexathon.com",
        password: "part123",
        badge: "Booth B-2",
        dest: "/participant",
      },
    ],
    judge: [
      {
        name: "Dr. Anjali Rao",
        title: "Judge 1 of 4 · ex-Google AI · AI/ML",
        email: "anjali@nexathon.com",
        password: "judge123",
        code: "JUDGE-A1B2",
        badge: "AI/ML Track",
        dest: "/judge",
      },
      {
        name: "Suresh Menon",
        title: "Judge 2 of 4 · Sequoia Scout · FinTech",
        email: "suresh@nexathon.com",
        password: "judge123",
        code: "JUDGE-C3D4",
        badge: "FinTech Track",
        dest: "/judge",
      },
      {
        name: "Fatima Khan",
        title: "Judge 3 of 4 · Bosch IoT Architecture Lead",
        email: "fatima@nexathon.com",
        password: "judge123",
        code: "JUDGE-E5F6",
        badge: "IoT Track",
        dest: "/judge",
      },
      {
        name: "Dr. Vikram Iyer",
        title: "Judge 4 of 4 · Apollo Hospitals HealthTech Director",
        email: "vikram@nexathon.com",
        password: "judge123",
        code: "JUDGE-G7H8",
        badge: "HealthTech Track",
        dest: "/judge",
      },
    ],
    visitor: [
      {
        name: "Devansh Patel",
        title: "Attendee & Angel Scout · Interests: AI, HealthTech",
        email: "visitor@nexathon.com",
        password: "visitor123",
        badge: "Interests Profile",
        dest: "/visitor",
      },
    ],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "judge" && judgeCode.trim()) {
        const res = await loginJudge(judgeCode.trim());
        if (res.success) {
          router.push("/judge");
          return;
        } else {
          setError(res.error || "Invalid judge code");
          setLoading(false);
          return;
        }
      }

      if (!email.trim() || !password.trim()) {
        setError("Please enter your email and password");
        setLoading(false);
        return;
      }

      const res = await login(email.trim(), password.trim());
      if (res.success) {
        if (activeTab === "admin") router.push("/console");
        else if (activeTab === "participant") router.push("/participant");
        else if (activeTab === "judge") router.push("/judge");
        else router.push("/visitor");
      } else {
        setError(res.error || "Invalid login credentials");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(account: { email: string; password: string; dest: string }) {
    setError("");
    setLoading(true);
    setEmail(account.email);
    setPassword(account.password);
    const ok = await quickLogin(account.email, account.password);
    setLoading(false);
    if (ok) {
      router.push(account.dest);
    } else {
      setError("Failed to auto-sign in");
    }
  }

  return (
    <main className="relative min-h-screen px-4 pb-24 pt-28">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute left-1/2 top-16 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 top-40 h-[350px] w-[500px] rounded-full bg-[#c8f31d]/10 blur-[130px]" />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#c8f31d]">
            <Sparkles className="h-3 w-3" /> Universal Authentication
          </div>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Choose Your Platform <span className="text-[#c8f31d]">Role</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
            Sign in as Organizer (Admin), Participant (manage project & links), Judge (evaluate all projects), or Visitor (interest matching feed).
          </p>
        </div>

        {/* Role Tabs */}
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError("");
            }}
            className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-left transition ${
              activeTab === "admin"
                ? "border-[#c8f31d] bg-[#c8f31d]/10 text-white shadow-[0_0_25px_rgba(200,243,29,0.2)]"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
            }`}
          >
            <ShieldCheck className={`h-5 w-5 ${activeTab === "admin" ? "text-[#c8f31d]" : "text-white/40"}`} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Admin</div>
              <div className="text-[10px] text-white/40">Full Management</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("participant");
              setError("");
            }}
            className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-left transition ${
              activeTab === "participant"
                ? "border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_25px_rgba(34,211,238,0.2)]"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
            }`}
          >
            <Zap className={`h-5 w-5 ${activeTab === "participant" ? "text-cyan-400" : "text-white/40"}`} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Participant</div>
              <div className="text-[10px] text-white/40">Projects & Links</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("judge");
              setError("");
            }}
            className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-left transition ${
              activeTab === "judge"
                ? "border-amber-400 bg-amber-400/10 text-white shadow-[0_0_25px_rgba(251,191,36,0.2)]"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
            }`}
          >
            <Gavel className={`h-5 w-5 ${activeTab === "judge" ? "text-amber-400" : "text-white/40"}`} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Judges (4)</div>
              <div className="text-[10px] text-white/40">Rate All Projects</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("visitor");
              setError("");
            }}
            className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-left transition ${
              activeTab === "visitor"
                ? "border-fuchsia-400 bg-fuchsia-400/10 text-white shadow-[0_0_25px_rgba(232,121,249,0.2)]"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
            }`}
          >
            <Compass className={`h-5 w-5 ${activeTab === "visitor" ? "text-fuchsia-400" : "text-white/40"}`} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">Visitor</div>
              <div className="text-[10px] text-white/40">Interests & Upvote</div>
            </div>
          </button>
        </div>

        {/* Main Card with 2 columns: Quick 1-Click Login vs Manual Login */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Column 1: 1-Click Fast Test Buttons */}
          <div className="lg:col-span-7">
            <div className="glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">1-Click Quick Demo Sign In</h3>
                  <p className="text-xs text-white/50">Instant testing without typing credentials</p>
                </div>
                <span className="font-mono rounded-lg bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#c8f31d]">
                  Ready to test
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {demoAccounts[activeTab].map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-[#c8f31d]/50 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 font-bold text-white group-hover:bg-[#c8f31d] group-hover:text-black transition">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-[#c8f31d] transition">
                            {acc.name}
                          </span>
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/70">
                            {acc.badge}
                          </span>
                        </div>
                        <div className="text-xs text-white/50">{acc.title}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-white/35">
                          {acc.email} · {acc.password}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs text-white/40 group-hover:translate-x-1 group-hover:text-[#c8f31d] transition">
                      <span>Log in</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/5 bg-black/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-[#c8f31d]" />
                  <span>Role Workflow Guarantee</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                  {activeTab === "admin" && "The Admin manages all 3 events, approves/rejects projects, onboards judges, configures scoring, and views real-time telemetry."}
                  {activeTab === "participant" && "Participants log in to their private portal to edit project title, description, team, upload banner images, and set live demo & GitHub repo URLs."}
                  {activeTab === "judge" && "All 4 judges log in with their assigned accounts or passcodes to independently score each project across 4 criteria. Scores sync live."}
                  {activeTab === "visitor" && "Visitors select their personal interests (e.g. AI/ML, HealthTech, FinTech) and receive an intelligent personalized project discovery feed."}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Standard Login Form */}
          <div className="lg:col-span-5">
            <div className="glass-strong rounded-3xl border border-white/10 p-6 md:p-8">
              <h3 className="font-display text-lg font-bold">Sign In With Credentials</h3>
              <p className="text-xs text-white/50">Enter your account details or judge code</p>

              {error && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {activeTab === "judge" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                      Judge Passcode (Optional)
                    </label>
                    <div className="relative mt-1">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        placeholder="e.g. JUDGE-A1B2"
                        value={judgeCode}
                        onChange={(e) => setJudgeCode(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-wider text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-white/40">Or use email & password below</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Email Address
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      required={!judgeCode}
                      placeholder={activeTab === "admin" ? "admin@nexathon.com" : "you@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-[#c8f31d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="password"
                      required={!judgeCode}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-[#c8f31d]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8f31d] py-3 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-white disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating…</span>
                  ) : (
                    <>
                      <span>Enter {activeTab.toUpperCase()} Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-4 text-center">
                <p className="text-xs text-white/50">
                  Don't have an account yet?{" "}
                  <Link href="/register" className="font-bold text-[#c8f31d] hover:underline">
                    Register as Participant or Visitor →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
