"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import {
  CheckCircle2,
  Plus,
  X,
  Ticket,
  Sparkles,
  Users,
  ShieldCheck,
  CreditCard,
  Loader2,
  ExternalLink,
  QrCode as QrIcon,
  Check,
} from "lucide-react";

type EventDetails = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categories: string[];
  venue: string;
  city: string;
  bannerGradient: string;
  brandColor?: string;
  ticketTiers?: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
  }>;
};

export default function RegisterPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [ev, setEv] = useState<EventDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"ticket" | "team">("ticket");

  // Ticket checkout state
  const [selectedTierId, setSelectedTierId] = useState("free");
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [ticketProcessing, setTicketProcessing] = useState(false);
  const [ticketDone, setTicketDone] = useState<{
    visitorCode: string;
    tierName: string;
    amount: number;
    name: string;
  } | null>(null);

  // Team registration state
  const [members, setMembers] = useState([""]);
  const [tech, setTech] = useState("");
  const [done, setDone] = useState<{ title: string; code: string; boothNo: string; teamName: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        setEv(data);
        if (data.ticketTiers && data.ticketTiers.length > 0) {
          setSelectedTierId(data.ticketTiers[0].id);
        }
      });
  }, [eventId]);

  async function handleTicketCheckout(e: React.FormEvent) {
    e.preventDefault();
    setTicketProcessing(true);

    try {
      // 1. Initiate checkout
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          tierId: selectedTierId,
          name: attendeeName,
          email: attendeeEmail,
          phone: attendeePhone,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        alert(orderData.error || "Failed to initiate ticket checkout");
        setTicketProcessing(false);
        return;
      }

      // If free ticket, it's immediately confirmed!
      if (!orderData.isPaid) {
        setTicketDone({
          visitorCode: orderData.visitorCode,
          tierName: orderData.tierName,
          amount: orderData.amount,
          name: attendeeName,
        });
        setTicketProcessing(false);
        return;
      }

      // If paid ticket, verify/confirm via gateway or instant sandbox confirmation
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          providerPaymentId: `pay_${Date.now()}`,
        }),
      });

      const verifyData = await verifyRes.json();
      setTicketDone({
        visitorCode: verifyData.visitorCode || orderData.visitorCode,
        tierName: orderData.tierName,
        amount: orderData.amount,
        name: attendeeName,
      });
    } catch {
      alert("Error processing ticket checkout. Please try again.");
    } finally {
      setTicketProcessing(false);
    }
  }

  async function submitTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        title: fd.get("title"),
        category: fd.get("category"),
        teamName: fd.get("team"),
        leaderName: fd.get("leader"),
        leaderEmail: fd.get("email"),
        leaderPhone: fd.get("phone"),
        members: members.filter(Boolean).map((m) => ({ name: m, role: "Member" })),
        description: fd.get("desc"),
        techStack: tech.split(",").map((s) => s.trim()).filter(Boolean),
        demoUrl: fd.get("demo"),
      }),
    });
    const d = await r.json();
    setDone(d);
    setSaving(false);
  }

  // TICKET CONFIRMATION VIEW
  if (ticketDone) {
    return (
      <main className="mx-auto max-w-lg px-4 pb-24 pt-32 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Pass Confirmed · {ticketDone.tierName}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            You&apos;re All Set, {ticketDone.name}!
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Present this QR pass at the security turnstile scanner for instant check-in.
          </p>

          <div className="mx-auto mt-6 w-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <QrCode
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/gate?code=${ticketDone.visitorCode}`}
              size={190}
            />
          </div>

          <div className="mt-3 font-mono text-sm font-bold tracking-wider text-indigo-600">
            {ticketDone.visitorCode}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={`/gate/${eventId}`}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs transition"
            >
              Open Full-Screen Gate Pass →
            </Link>
            <button
              onClick={() => {
                setTicketDone(null);
                setAttendeeName("");
                setAttendeeEmail("");
                setAttendeePhone("");
              }}
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Register Another Attendee
            </button>
          </div>
        </div>
      </main>
    );
  }

  // TEAM REGISTRATION CONFIRMATION VIEW
  if (done) {
    return (
      <main className="mx-auto max-w-lg px-4 pb-24 pt-32 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            You&apos;re in, {done.teamName}!
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Booth <b className="text-indigo-600 font-semibold">{done.boothNo}</b> is reserved for <b>{done.title}</b>. Your printable booth QR:
          </p>
          <div className="mx-auto mt-5 w-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <QrCode
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${done.code}`}
              size={190}
            />
          </div>
          <div className="mt-3 font-mono text-xs font-bold text-indigo-600">{done.code}</div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link
              href={`/p/${done.code}`}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-semibold transition"
            >
              View Live Profile
            </Link>
            <button
              onClick={() => setDone(null)}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-medium text-slate-700 transition"
            >
              Register Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  const tiers = ev?.ticketTiers || [
    {
      id: "free",
      name: "General Attendee Pass",
      price: 0,
      currency: "INR",
      description: "Full access to all project booths, open floor showcases & live crowd voting.",
    },
    {
      id: "vip",
      name: "VIP Delegate Pass",
      price: 999,
      currency: "INR",
      description: "Priority front-row seating, keynote sessions, VIP networking kit & dinner lounge.",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-28">
      {/* Event Header Banner */}
      {ev && (
        <div className={`overflow-hidden rounded-3xl bg-gradient-to-r ${ev.bannerGradient || "from-indigo-600 to-purple-600"} p-8 text-white shadow-sm`}>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Official Registration Portal · {ev.city}
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-xs">
            {ev.name}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-white/90">
            {ev.tagline} · {ev.venue}
          </p>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="mt-6 flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
        <button
          onClick={() => setActiveTab("ticket")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
            activeTab === "ticket" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>Attendee Gate Pass &amp; Ticketing</span>
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
            activeTab === "team" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Exhibit Team &amp; Stall Registration</span>
        </button>
      </div>

      {/* TAB 1: ATTENDEE PASS & TICKETING */}
      {activeTab === "ticket" && (
        <div className="mt-6 space-y-6">
          {/* Ticket Tier Cards */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">
              1. Select Admission Pass Tier
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              {tiers.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`cursor-pointer rounded-3xl border-2 p-5 transition relative flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{tier.name}</span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-slate-900">
                        {tier.price === 0 ? "FREE" : `₹${tier.price}`}
                      </div>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {tier.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Instant QR Badge Issued</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendee Details Form */}
          <form
            onSubmit={handleTicketCheckout}
            className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              2. Attendee Credentials
            </span>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-700">Full Name *</span>
                <input
                  required
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="inp"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-700">Email Address *</span>
                <input
                  type="email"
                  required
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="priya@domain.com"
                  className="inp"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Phone Number (optional)</span>
              <input
                value={attendeePhone}
                onChange={(e) => setAttendeePhone(e.target.value)}
                placeholder="+91 9876543210"
                className="inp"
              />
            </label>

            <button
              type="submit"
              disabled={ticketProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
            >
              {ticketProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Checkout &amp; Issuing Pass…</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>
                    Confirm Registration · {selectedTierId === "free" ? "Free Pass" : "Proceed to Checkout"} →
                  </span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Verified cryptographic badge generated instantly upon submission.
            </p>
          </form>
        </div>
      )}

      {/* TAB 2: TEAM & EXHIBIT REGISTRATION */}
      {activeTab === "team" && (
        <form
          onSubmit={submitTeam}
          className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Project title *</span>
              <input name="title" required placeholder="e.g. MediQueue AI" className="inp" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Track / category *</span>
              <select name="category" className="inp">
                {(ev?.categories || ["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech"]).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Team name *</span>
              <input name="team" required placeholder="e.g. PulseCoders" className="inp" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Demo / repo URL</span>
              <input name="demo" placeholder="https://github.com/…" className="inp" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">One-paragraph pitch *</span>
            <textarea
              name="desc"
              required
              rows={3}
              placeholder="What does it do, who is it for, and what makes it innovative?"
              className="inp resize-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Tech stack (comma-separated)</span>
            <input
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="Python, Next.js, PyTorch, Supabase"
              className="inp"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Team lead *</span>
              <input name="leader" required placeholder="Full name" className="inp" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Email *</span>
              <input name="email" type="email" required placeholder="lead@mail.com" className="inp" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-700">Phone</span>
              <input name="phone" placeholder="+91…" className="inp" />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-700">Team members</span>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={m}
                    onChange={(e) => setMembers(members.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Member ${i + 1} name`}
                    className="inp"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMembers(members.filter((_, j) => j !== i))}
                      className="rounded-xl border border-slate-200 px-3 hover:bg-slate-50 text-slate-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMembers([...members, ""])}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-4 w-4" /> Add member
              </button>
            </div>
          </div>

          <button
            disabled={saving}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 text-xs font-semibold shadow-xs disabled:opacity-50 transition"
          >
            {saving ? "Reserving booth…" : "Register team & generate booth QR →"}
          </button>
        </form>
      )}

      <style>{`.inp{width:100%;border-radius:0.75rem;border:1px solid #E2E8F0;background:#F8FAFC;padding:0.625rem 0.875rem;font-size:0.75rem;outline:none;color:#0F172A;transition:all 0.15s}.inp:focus{background:#fff;border-color:#4F46E5;box-shadow:0 0 0 2px rgba(79,70,229,0.12)}`}</style>
    </main>
  );
}
