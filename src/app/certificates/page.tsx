"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import ThreeDCard from "@/components/ThreeDCard";
import {
  Award,
  Sparkles,
  Printer,
  Share2,
  CheckCircle2,
  Search,
  Filter,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trophy,
  Flame,
  FileCheck2,
  Layers,
  Palette,
  Users,
} from "lucide-react";

type Cert = {
  id: string;
  eventId: string;
  projectId?: string | null;
  recipientName: string;
  recipientEmail?: string;
  role: string;
  title: string;
  code: string;
  issuedAt: string;
  signatory1?: string;
  signatory2?: string;
  theme?: string;
};

const THEMES = [
  { id: "gold", name: "Imperial Gold", icon: "🌟", desc: "Dark onyx with golden guilloche & metallic foil" },
  { id: "cyber", name: "Cyberpunk Neon", icon: "⚡", desc: "Deep space void with neon laser highlights" },
  { id: "classic", name: "Royal Ivory", icon: "🏛️", desc: "Prestige cream parchment with classic typography" },
  { id: "hologram", name: "Prismatic Astral", icon: "🔮", desc: "Holographic gradient with cosmic shimmer" },
];

const ROLES = [
  { id: "winner", label: "Grand Winner (1st)", badge: "🏆 Winner", defaultTitle: "1st Place Grand Champion — National Finals" },
  { id: "runner_up", label: "1st Runner Up (2nd)", badge: "🥈 1st Runner Up", defaultTitle: "1st Runner Up & Best Innovation" },
  { id: "second_runner_up", label: "2nd Runner Up (3rd)", badge: "🥉 2nd Runner Up", defaultTitle: "2nd Runner Up & Tech Excellence" },
  { id: "special", label: "Special Track Award", badge: "🎖️ Special Award", defaultTitle: "Excellence in AI/ML & Impact" },
  { id: "participant", label: "Participant", badge: "📜 Participant", defaultTitle: "Certificate of Active Participation" },
  { id: "judge", label: "Distinguished Judge", badge: "⚖️ Grand Jury", defaultTitle: "Distinguished Grand Jury Evaluator" },
  { id: "mentor", label: "Mentor / Organizer", badge: "🤝 Recognition", defaultTitle: "Outstanding Mentorship & Leadership" },
];

export default function CertificatesStudioPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form customizer states
  const [recipientName, setRecipientName] = useState("Aarav Mehta & Team NeuralPulse");
  const [role, setRole] = useState("winner");
  const [title, setTitle] = useState("1st Place Grand Champion — Nexathon '26");
  const [eventName, setEventName] = useState("NEXATHON '26 — National Hackathon Finals");
  const [theme, setTheme] = useState("gold");
  const [signatory1, setSignatory1] = useState("Dr. Elena Vance (Head Jury)");
  const [signatory2, setSignatory2] = useState("Vikram Malhotra (Director)");
  const [previewCode, setPreviewCode] = useState("CERT-NX9421");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  async function loadCerts() {
    setLoading(true);
    try {
      const res = await fetch("/api/certificates");
      const data = await res.json();
      if (Array.isArray(data)) setCerts(data);
    } catch {
      // fallback
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCerts();
  }, []);

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    const r = ROLES.find((x) => x.id === newRole);
    if (r) {
      setTitle(`${r.defaultTitle} · ${eventName.split("—")[0].trim()}`);
    }
  }

  async function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const newCode = "CERT-" + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(10 + Math.random() * 89);
    setPreviewCode(newCode);

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName,
          role,
          title,
          signatory1,
          signatory2,
          theme,
          code: newCode,
        }),
      });
      const created = await res.json();
      setCerts((prev) => [created, ...prev]);
    } catch {
      // fallback
    }
    setSaving(false);
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  const filteredCerts = useMemo(() => {
    return certs.filter((c) => {
      const matchesSearch =
        c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === "all" || c.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [certs, search, filterRole]);

  return (
    <main className="min-h-screen bg-[#05070f] pb-24 pt-28">
      {/* Header Banner */}
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="aurora-bg -top-24 h-96 opacity-60" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CERTIFICATION STUDIO & VERIFIER</span>
            </div>
            <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Designer Certificates & <span className="gold-foil">Tamper-Proof QR Seals</span>
            </h1>
            <p className="mt-2.5 max-w-2xl text-base text-white/60">
              Generate pixel-perfect, verifiable credentials for hackathon champions, runners-up, grand juries, and attendees.
              Print in high-res A4 or verify instantly with cryptographic QR signatures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.print()}
              className="group flex items-center gap-2 rounded-xl bg-[#c8f31d] px-5 py-3 text-sm font-bold text-black transition hover:bg-white shadow-[0_0_25px_rgba(200,243,29,0.3)]"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              href={`/verify/${previewCode}`}
              target="_blank"
              className="glass flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 text-cyan-300" />
              <span>Live Verifier</span>
            </Link>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* Customizer Panel (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 md:p-7">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <Palette className="h-5 w-5 text-[#c8f31d]" />
                <h2 className="font-display text-lg font-bold">Certificate Customizer</h2>
                <span className="font-mono ml-auto rounded bg-white/10 px-2 py-0.5 text-[11px] text-[#c8f31d]">
                  LIVE ENGINE
                </span>
              </div>

              <form onSubmit={handleIssueCertificate} className="mt-5 space-y-4">
                {/* Theme Selector */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                    Aesthetic Theme
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-xs transition ${
                          theme === t.id
                            ? "border-[#c8f31d] bg-[#c8f31d]/10 text-white font-bold shadow-[0_0_15px_rgba(200,243,29,0.2)]"
                            : "border-white/10 bg-white/[0.02] text-white/65 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <div>
                          <div>{t.name}</div>
                          <div className="text-[10px] text-white/40">{t.desc.split(" ")[0]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                    Recipient / Team Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    placeholder="e.g. Elena Rostova or Team CyberPulse"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#c8f31d] focus:outline-none"
                  />
                </div>

                {/* Award Role */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                    Award Credential Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/70 px-4 py-2.5 text-sm text-white focus:border-[#c8f31d] focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id} className="bg-[#0b0f1d] text-white">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Citation Title */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                    Citation / Citation Title
                  </label>
                  <textarea
                    rows={2}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-[#c8f31d] focus:outline-none"
                  />
                </div>

                {/* Event Name */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-white/60">
                    Event / Festival Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:border-[#c8f31d] focus:outline-none"
                  />
                </div>

                {/* Signatories */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                      Signatory 1
                    </label>
                    <input
                      type="text"
                      value={signatory1}
                      onChange={(e) => setSignatory1(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-[#c8f31d] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                      Signatory 2
                    </label>
                    <input
                      type="text"
                      value={signatory2}
                      onChange={(e) => setSignatory2(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-[#c8f31d] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Issue Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c8f31d] via-emerald-300 to-cyan-300 py-3.5 text-sm font-extrabold text-black transition hover:opacity-95 disabled:opacity-50"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>{saving ? "Signing & Encrypting…" : "Issue & Save Certificate"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Live Certificate Preview Canvas (Right 7 Cols) */}
          <div className="lg:col-span-7">
            <div className="sticky top-28 space-y-4">
              <div className="flex items-center justify-between text-xs text-white/60 px-1">
                <span className="font-mono uppercase tracking-widest text-[#c8f31d] flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-blink rounded-full bg-[#c8f31d]" />
                  Real-Time High-Resolution Vector Canvas
                </span>
                <span className="font-mono">ID: {previewCode}</span>
              </div>

              {/* The Certificate Canvas */}
              <ThreeDCard glowColor={theme === "gold" ? "gold" : "cyan"} maxTilt={14}>
                <div
                  className={`print-cert relative overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 ${
                  theme === "gold"
                    ? "cert-gold border-amber-400/40"
                    : theme === "cyber"
                    ? "cert-cyber border-cyan-400/40"
                    : theme === "classic"
                    ? "cert-classic border-slate-700/30 text-slate-900"
                    : "cert-hologram border-purple-400/40"
                }`}
              >
                {/* Guilloche Security Border */}
                <div className="guilloche-border absolute inset-2.5 rounded-2xl pointer-events-none opacity-40 border border-current" />

                <div className="relative p-7 md:p-11 text-center flex flex-col justify-between min-h-[480px]">
                  {/* Top Seal & Crest */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          <Trophy className="h-5 w-5" />
                        </span>
                        <div className="text-left">
                          <div className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-60">
                            OFFICIAL VERIFIED ACCREDITATION
                          </div>
                          <div className="font-display text-xs font-bold tracking-tight">
                            EVENT INTELLIGENCE PROTOCOL
                          </div>
                        </div>
                      </div>

                      {/* Holographic Security Pill */}
                      <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>CRYPTOGRAPHIC SEAL</span>
                      </div>
                    </div>

                    <div className="font-mono mt-8 text-[11px] uppercase tracking-[0.35em] opacity-75">
                      CERTIFICATE OF {ROLES.find((r) => r.id === role)?.badge.toUpperCase() || "AWARD"}
                    </div>
                  </div>

                  {/* Main Citation */}
                  <div className="my-6">
                    <p className="font-editorial text-sm italic opacity-70">This distinguished honor is proudly presented to</p>
                    <h2
                      className={`font-luxury mt-2 text-3xl md:text-5xl font-extrabold tracking-tight ${
                        theme === "gold"
                          ? "gold-foil"
                          : theme === "cyber"
                          ? "text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                          : theme === "classic"
                          ? "text-slate-900"
                          : "text-white"
                      }`}
                    >
                      {recipientName || "Honored Recipient"}
                    </h2>

                    <p className="mx-auto mt-4 max-w-xl text-sm md:text-base leading-relaxed opacity-85">
                      {title || "for outstanding technical innovation, execution, and exemplary contribution."}
                    </p>

                    <div className="font-display mt-3 text-lg font-bold tracking-tight opacity-95">
                      {eventName}
                    </div>
                  </div>

                  {/* Footer: Signatures & Authenticity QR */}
                  <div className="mt-6 border-t border-current/20 pt-5 flex items-end justify-between text-left">
                    {/* Signatures */}
                    <div className="flex gap-8">
                      <div>
                        <div className="font-editorial text-lg italic tracking-wider opacity-90 border-b border-current/40 pb-1">
                          {signatory1}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-wider opacity-60 mt-1">
                          Grand Jury Co-Chair
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <div className="font-editorial text-lg italic tracking-wider opacity-90 border-b border-current/40 pb-1">
                          {signatory2}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-wider opacity-60 mt-1">
                          Director of Innovation
                        </div>
                      </div>
                    </div>

                    {/* QR Code & Credential Stamp */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                          CREDENTIAL HASH
                        </div>
                        <div className="font-mono text-xs font-bold text-[#c8f31d]">{previewCode}</div>
                        <div className="text-[10px] opacity-60">Scan to verify authenticity</div>
                      </div>
                      <div className="rounded-xl border border-white/20 bg-white p-1.5 shadow-md">
                        <QrCode
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${previewCode}`}
                          size={72}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </ThreeDCard>

              {/* Action Ribbon below Preview */}
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Permanent link: <span className="font-mono text-white">/verify/{previewCode}</span></span>
                </div>
                <button
                  onClick={() => copyLink(previewCode)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedCode === previewCode ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Issued Credentials Archive Gallery */}
        <div className="mt-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-[#c8f31d]" />
                <h3 className="font-display text-2xl font-bold">Issued Credentials Archive</h3>
              </div>
              <p className="text-sm text-white/50 mt-1">
                Browse and verify certificates issued during active sessions.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search name, code, title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-xs text-white placeholder-white/40 focus:border-[#c8f31d] focus:outline-none"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-[#c8f31d] focus:outline-none"
              >
                <option value="all" className="bg-[#0b0f1d]">All Roles</option>
                <option value="winner" className="bg-[#0b0f1d]">Winners</option>
                <option value="runner_up" className="bg-[#0b0f1d]">Runners Up</option>
                <option value="judge" className="bg-[#0b0f1d]">Judges</option>
                <option value="participant" className="bg-[#0b0f1d]">Participants</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCerts.map((c) => (
              <div
                key={c.id || c.code}
                className="glass-card group flex flex-col justify-between rounded-2xl p-5 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span
                      className={`font-mono inline-block rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                        c.role === "winner"
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          : c.role === "runner_up"
                          ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40"
                          : c.role === "judge"
                          ? "bg-purple-400/20 text-purple-300 border border-purple-400/40"
                          : "bg-white/10 text-white/70 border border-white/10"
                      }`}
                    >
                      {c.role}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#c8f31d]">{c.code}</span>
                  </div>

                  <h4 className="font-display mt-3 text-base font-bold text-white group-hover:text-[#c8f31d] transition">
                    {c.recipientName}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs text-white/60">{c.title}</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-[11px] text-white/40">
                    {new Date(c.issuedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyLink(c.code)}
                      className="rounded-lg bg-white/5 p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                      title="Copy verify link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/verify/${c.code}`}
                      target="_blank"
                      className="flex items-center gap-1 rounded-lg bg-[#c8f31d]/15 px-2.5 py-1 text-xs font-bold text-[#c8f31d] hover:bg-[#c8f31d] hover:text-black transition"
                    >
                      <span>Verify</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
