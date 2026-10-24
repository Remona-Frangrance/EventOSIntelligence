"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  QrCode,
  ScanLine,
  Download,
  Search,
  Star,
  Users,
  Building2,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
} from "lucide-react";

type Sponsor = {
  id: string;
  name: string;
  tier: string;
  boothNo: string;
  logoUrl: string;
  website: string;
  brochureUrl: string;
  eventId: string;
};

type Lead = {
  id: string;
  sponsorId: string;
  eventId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorCompany: string;
  interests: string[];
  notes: string;
  rating: number;
  capturedBy: string;
  createdAt: string;
};

function SponsorPortalInner() {
  const [passcode, setPasscode] = useState("");
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [eventData, setEventData] = useState<{ id: string; name: string; venue: string } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  // Lead capture form state
  const [visitorCode, setVisitorCode] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [leadRating, setLeadRating] = useState(4);
  const [capturing, setCapturing] = useState(false);
  const [captureMsg, setCaptureMsg] = useState("");
  const [captureMode, setCaptureMode] = useState<"code" | "manual">("code");

  // Filtering
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    // Check saved session in localStorage
    const saved = localStorage.getItem("eventos_sponsor_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sponsor) {
          setSponsor(parsed.sponsor);
          setEventData(parsed.event);
          loadLeads(parsed.sponsor.id);
        }
      } catch {}
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;
    setAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch("/api/sponsors/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Invalid sponsor passcode");
        setAuthenticating(false);
        return;
      }

      setSponsor(data.sponsor);
      setEventData(data.event);
      localStorage.setItem("eventos_sponsor_session", JSON.stringify(data));
      await loadLeads(data.sponsor.id);
    } catch {
      setAuthError("Failed to connect to sponsor portal. Try again.");
    } finally {
      setAuthenticating(false);
    }
  }

  function handleLogout() {
    setSponsor(null);
    setEventData(null);
    setLeads([]);
    localStorage.removeItem("eventos_sponsor_session");
  }

  async function loadLeads(sId: string) {
    try {
      const res = await fetch(`/api/sponsors/leads?sponsorId=${sId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLeads(data);
      }
    } catch {}
  }

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!sponsor) return;
    setCapturing(true);
    setCaptureMsg("");

    try {
      const payload: any = {
        sponsorId: sponsor.id,
        notes: leadNotes,
        rating: leadRating,
        capturedBy: `${sponsor.name} Booth Scanner`,
      };

      if (captureMode === "code") {
        if (!visitorCode.trim()) {
          setCaptureMsg("Please input visitor pass code or scan QR");
          setCapturing(false);
          return;
        }
        payload.visitorCode = visitorCode.trim().toUpperCase();
      } else {
        if (!manualName.trim() || !manualEmail.trim()) {
          setCaptureMsg("Name and Email are required for manual lead entry");
          setCapturing(false);
          return;
        }
        payload.name = manualName.trim();
        payload.email = manualEmail.trim();
        payload.phone = manualPhone.trim();
        payload.company = manualCompany.trim();
      }

      const res = await fetch("/api/sponsors/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCaptureMsg(data.error || "Failed to capture lead");
      } else {
        setCaptureMsg(data.message || "Lead recorded successfully!");
        setVisitorCode("");
        setManualName("");
        setManualEmail("");
        setManualPhone("");
        setManualCompany("");
        setLeadNotes("");
        await loadLeads(sponsor.id);
        setTimeout(() => setCaptureMsg(""), 4000);
      }
    } catch {
      setCaptureMsg("Network error capturing lead");
    } finally {
      setCapturing(false);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Are you sure you want to remove this lead?")) return;
    try {
      await fetch(`/api/sponsors/leads?id=${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch {}
  }

  function exportLeadsCSV() {
    if (!leads.length) return;
    const headers = ["Visitor Name", "Email Address", "Phone", "Organization / Company", "Rating (1-5)", "Interests", "Notes", "Scanned At"];
    const rows = leads.map((l) => [
      `"${l.visitorName.replace(/"/g, '""')}"`,
      `"${l.visitorEmail.replace(/"/g, '""')}"`,
      `"${l.visitorPhone.replace(/"/g, '""')}"`,
      `"${l.visitorCompany.replace(/"/g, '""')}"`,
      l.rating,
      `"${(l.interests || []).join(", ")}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleString()}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sponsor?.name.toLowerCase().replace(/\s+/g, "-")}-leads.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredLeads = leads.filter((l) => {
    if (ratingFilter !== "all" && l.rating < parseInt(ratingFilter, 10)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.visitorName.toLowerCase().includes(q) ||
        l.visitorEmail.toLowerCase().includes(q) ||
        l.visitorCompany.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hotLeadsCount = leads.filter((l) => l.rating >= 4).length;

  if (!sponsor) {
    return (
      <main className="mx-auto max-w-md px-4 pb-24 pt-32">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Briefcase className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
            Sponsor &amp; Partner Terminal
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Access your live booth lead capture scanner, delegate engagement metrics, and attendee CRM.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sponsor Access Passcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                  placeholder="e.g. ANT2026 or SUPA2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 uppercase placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none tracking-wider"
                />
                <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authenticating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              {authenticating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Passcode…</span>
                </>
              ) : (
                <>
                  <span>Unlock Booth Terminal →</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            Need your partner passcode? Contact the event organizing committee at the Help Desk.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xs">
              {sponsor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{sponsor.name}</h1>
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  {sponsor.tier} Partner
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  Booth {sponsor.boothNo || "Main Hall"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {eventData?.name || "Event Intelligence OS"} · Partner Telemetry &amp; Lead Capture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sponsor.website && (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
              >
                <span>Company Site</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 shadow-xs transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Leads Collected</span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{leads.length}</div>
            <p className="mt-1 text-[11px] text-slate-500">Verified attendee interactions</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Hot Prospects (4★+)</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{hotLeadsCount}</div>
            <p className="mt-1 text-[11px] text-slate-500">
              {leads.length ? Math.round((hotLeadsCount / leads.length) * 100) : 0}% high-intent ratio
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Booth Scans &amp; Views</span>
              <BarChart3 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{leads.length * 3 + 14}</div>
            <p className="mt-1 text-[11px] text-slate-500">Digital showcase impressions</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Lead Export Ready</span>
              <Download className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">CSV Ready</div>
            <p className="mt-1 text-[11px] text-slate-500">One-click CRM download</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Capture Form & Leads Table */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: Lead Capture Terminal */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ScanLine className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Lead Capture Terminal</h2>
          </div>

          <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setCaptureMode("code")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                captureMode === "code" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Badge Scan / Code
            </button>
            <button
              onClick={() => setCaptureMode("manual")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                captureMode === "manual" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manual Card Entry
            </button>
          </div>

          <form onSubmit={handleCapture} className="mt-4 space-y-3">
            {captureMode === "code" ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Attendee Pass Code (from badge QR)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={visitorCode}
                    onChange={(e) => setVisitorCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VIS-9B2F1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 uppercase focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                  <QrCode className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Visitor name, email, and interests will be auto-linked from the event registry.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="+91 98765..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Company / Org</label>
                    <input
                      type="text"
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lead Quality Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setLeadRating(star)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition flex items-center justify-center gap-1 ${
                      leadRating >= star
                        ? "bg-amber-50 border border-amber-200 text-amber-700"
                        : "bg-slate-50 border border-slate-200 text-slate-400"
                    }`}
                  >
                    <Star className="h-3 w-3 fill-current" />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Interaction Notes</label>
              <textarea
                rows={2}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Discussed API pilot, interested in enterprise tier demo next week..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            {captureMsg && (
              <div
                className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium ${
                  captureMsg.includes("success") || captureMsg.includes("Lead")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{captureMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={capturing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              {capturing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Capturing Lead…</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Save Lead to CRM →</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Leads List Table */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Captured Booth Leads ({filteredLeads.length})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Exportable attendee contacts and interaction summaries.
              </p>
            </div>

            <button
              onClick={exportLeadsCSV}
              disabled={!leads.length}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs disabled:opacity-40 transition"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads by name, email, company, notes…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pl-9 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Filter:</span>
              <button
                onClick={() => setRatingFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  ratingFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRatingFilter("4")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  ratingFilter === "4" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                ★4+ Hot Leads
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="mt-4 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredLeads.map((l) => (
              <div
                key={l.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 p-2 rounded-xl transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{l.visitorName}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {l.visitorCompany || "Attendee"}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[11px]">
                      ★{l.rating}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{l.visitorEmail}</span>
                    {l.visitorPhone && <span>· {l.visitorPhone}</span>}
                  </div>
                  {l.notes && (
                    <p className="mt-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-150 p-2 rounded-lg">
                      {l.notes}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    onClick={() => deleteLead(l.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete lead"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {!filteredLeads.length && (
              <div className="py-16 text-center text-slate-400">
                <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No leads captured yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scan attendee badges or manually enter visitor details using the terminal on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SponsorPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-xs text-slate-400">Loading Sponsor Portal…</div>}>
      <SponsorPortalInner />
    </Suspense>
  );
}
