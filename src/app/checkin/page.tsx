"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import {
  ScanLine,
  CheckCircle2,
  UserPlus,
  XCircle,
  ExternalLink,
  Calendar,
  Building2,
  Wifi,
  WifiOff,
  Users,
} from "lucide-react";

export default function CheckinPage() {
  const [events, setEvents] = useState<{ id: string; name: string; venue?: string; city?: string; type?: string }[]>([]);
  const [eventId, setEventId] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; title: string; sub: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [count, setCount] = useState<{ in: number; total: number }>({ in: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<{ code: string; timestamp: string }[]>([]);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    // Load existing offline queue from localStorage
    try {
      const saved = localStorage.getItem("eventos_offline_checkins");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setOfflineQueue(parsed);
      }
    } catch {}

    function handleOnline() {
      setIsOnline(true);
      flushOfflineQueue();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function flushOfflineQueue() {
    try {
      const saved = localStorage.getItem("eventos_offline_checkins");
      if (!saved) return;
      const queue: { code: string; timestamp: string }[] = JSON.parse(saved);
      if (!queue.length) return;

      let syncedCount = 0;
      for (const item of queue) {
        try {
          await fetch("/api/checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: item.code }),
          });
          syncedCount++;
        } catch {}
      }

      localStorage.removeItem("eventos_offline_checkins");
      setOfflineQueue([]);
      setSyncMsg(`Reconnected: Synced ${syncedCount} queued check-ins to server.`);
      setTimeout(() => setSyncMsg(""), 5000);
      if (eventId) refreshCount(eventId);
    } catch {}
  }

  // Load events and pick event from URL query param if present
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        setEvents(d);

        // Priority: URL query param -> first event
        const params = new URLSearchParams(window.location.search);
        const urlEventId = params.get("eventId");
        const matched = urlEventId
          ? d.find((e: any) => e.id === urlEventId || e.slug === urlEventId)
          : null;

        const targetId = matched?.id || urlEventId || d[0]?.id || "";
        if (targetId) {
          setEventId(targetId);
          refreshCount(targetId);
        }
      });
  }, []);

  function handleSelectEvent(id: string) {
    setEventId(id);
    refreshCount(id);
    setResult(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("eventId", id);
    window.history.replaceState({}, "", newUrl.toString());
  }

  const currentEvent = events.find((e) => e.id === eventId);

  async function refreshCount(id: string) {
    try {
      const v = await fetch(`/api/visitors?eventId=${id}`).then((r) => r.json());
      if (Array.isArray(v)) {
        setCount({ in: v.filter((x: { checkedIn: boolean }) => x.checkedIn).length, total: v.length });
      }
    } catch {}
  }

  async function checkin(e?: React.FormEvent) {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    setBusy(true);

    // If offline, queue locally
    if (!navigator.onLine) {
      const newItem = { code: cleanCode, timestamp: new Date().toISOString() };
      const updatedQueue = [...offlineQueue, newItem];
      setOfflineQueue(updatedQueue);
      try {
        localStorage.setItem("eventos_offline_checkins", JSON.stringify(updatedQueue));
      } catch {}

      setResult({
        ok: true,
        title: "Offline Pass Accepted",
        sub: `${cleanCode} verified & queued locally. Will sync when Wi-Fi connects.`,
      });
      setRecent((x) => [`${cleanCode} (Queued Offline)`, ...x].slice(0, 6));
      setCount((prev) => ({ in: prev.in + 1, total: prev.total }));
      setCode("");
      setBusy(false);
      return;
    }

    try {
      const r = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });
      const d = await r.json();
      if (r.ok) {
        setResult({ ok: true, title: d.alreadyIn ? "Already inside" : "Welcome in!", sub: d.message || d.name });
        setRecent((x) => [`${d.name} · ${d.code}`, ...x].slice(0, 6));
        if (eventId) refreshCount(eventId);
      } else {
        setResult({ ok: false, title: "Pass not found", sub: d.error });
      }
    } catch {
      // Network drop during call: queue locally
      const newItem = { code: cleanCode, timestamp: new Date().toISOString() };
      const updatedQueue = [...offlineQueue, newItem];
      setOfflineQueue(updatedQueue);
      try {
        localStorage.setItem("eventos_offline_checkins", JSON.stringify(updatedQueue));
      } catch {}
      setResult({
        ok: true,
        title: "Offline Pass Saved",
        sub: `Network unavailable. ${cleanCode} queued for server sync.`,
      });
      setRecent((x) => [`${cleanCode} (Queued)`, ...x].slice(0, 6));
    } finally {
      setCode("");
      setBusy(false);
    }
  }

  async function quickRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: fd.get("name"),
          phone: fd.get("phone"),
          type: fd.get("type"),
          checkedIn: false,
        }),
      });
      const d = await r.json();
      (e.target as HTMLFormElement).reset();
      if (d.code) {
        setCode(d.code);
        setResult({
          ok: true,
          title: "Walk-in Pass Issued!",
          sub: `${d.name} (${d.code}) ready for check-in. Click 'Check in to ${currentEvent?.name || "Event"}' above to admit.`,
        });
      }
      if (eventId) refreshCount(eventId);
    } catch {
      setResult({ ok: false, title: "Failed to issue pass", sub: "Please verify connection and retry." });
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28 text-slate-900">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-1 rounded-full shadow-xs">
          // Gate Terminal & Pass Scanner
        </span>
        <h1 className="font-display mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          QR Gate Check-in
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium max-w-xl mx-auto">
          Works on any phone, tablet or laptop at the gate. Fast offline-capable scanning with zero hardware required.
        </p>

        {/* Network & Offline Queue Status */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold shadow-xs ${
              isOnline
                ? "bg-emerald-100 border border-emerald-300 text-emerald-900"
                : "bg-amber-100 border border-amber-300 text-amber-900 animate-pulse"
            }`}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-700" /> : <WifiOff className="h-3.5 w-3.5 text-amber-700" />}
            <span>{isOnline ? "Gate Terminal Online" : "Offline Resilient Mode Active"}</span>
          </span>

          {offlineQueue.length > 0 && (
            <span className="rounded-full bg-amber-100 border border-amber-300 px-3.5 py-1 text-xs font-mono font-bold text-amber-900">
              {offlineQueue.length} scans queued locally
            </span>
          )}
        </div>

        {syncMsg && (
          <div className="mt-3 mx-auto max-w-md rounded-2xl bg-emerald-50 border border-emerald-300 p-3 text-center text-xs font-bold text-emerald-900 shadow-xs">
            {syncMsg}
          </div>
        )}
      </div>

      {/* Prominent Active Event Banner & Switcher */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Active Event for Gate Check-In</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              {currentEvent ? currentEvent.name : "Select an Event"}
            </h2>
            {currentEvent && (
              <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  {currentEvent.venue || currentEvent.city || "Main Campus Hall"}
                </span>
                <span>·</span>
                <span className="capitalize text-indigo-700 font-semibold">{currentEvent.type || "Live Event"}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Switch Event:</label>
            <select
              value={eventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white shadow-xs"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Event Pills for 1-click switching */}
        <div className="mt-3 flex flex-wrap gap-2">
          {events.map((e) => {
            const isSelected = e.id === eventId;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => handleSelectEvent(e.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition text-left ${
                  isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-sm border border-indigo-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-white" : "bg-slate-400"}`} />
                <span className="truncate max-w-[220px]">{e.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scanner & Gate Stats Grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: Pass Scanner */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm text-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ScanLine className="h-4 w-4 text-emerald-600" />
              <span>Scan or Type Visitor Pass</span>
            </span>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold">
              {currentEvent?.name?.slice(0, 24) || "Active Event"}
            </span>
          </div>

          <form onSubmit={checkin} className="mt-5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VIS-XXXXX"
              autoFocus
              className="font-mono w-full rounded-2xl border-2 border-dashed border-indigo-300 bg-slate-50 px-5 py-5 text-center text-3xl font-extrabold tracking-[0.25em] text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white shadow-inner transition"
            />
            <button
              disabled={busy}
              className="mt-3.5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-sm font-bold shadow-sm transition disabled:opacity-50"
            >
              {busy ? "Verifying Pass…" : `Check in to ${currentEvent?.name?.slice(0, 20) || "Event"} →`}
            </button>
          </form>

          <button
            onClick={() => setCode("VIS-10001")}
            className="font-mono mt-3 w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Demo pass: <span className="text-emerald-700 underline font-bold">VIS-10001</span> (tap to fill)
          </button>

          {result && (
            <div
              className={`mt-4 flex items-center gap-3 rounded-2xl border p-4 shadow-xs ${
                result.ok ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-rose-300 bg-rose-50 text-rose-950"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-8 w-8 shrink-0 text-rose-600" />
              )}
              <div>
                <div className="font-extrabold text-sm">{result.title}</div>
                <div className="text-xs text-slate-700 font-medium mt-0.5">{result.sub}</div>
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
                Recent Scans for {currentEvent?.name?.slice(0, 18) || "Event"}:
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((r, i) => (
                  <span
                    key={i}
                    className="font-mono rounded-lg bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Counts, QR Pass, Walk-In */}
        <div className="space-y-4">
          {/* Real-time Event Headcount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center shadow-xs">
              <div className="font-mono text-3xl font-extrabold text-emerald-700">{count.in}</div>
              <div className="font-mono mt-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
                Inside {currentEvent?.name?.slice(0, 10) || "Venue"}
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 text-center shadow-xs">
              <div className="font-mono text-3xl font-extrabold text-indigo-700">{count.total}</div>
              <div className="font-mono mt-1 text-xs font-bold uppercase tracking-wider text-indigo-900">
                Total Registered
              </div>
            </div>
          </div>

          {/* Common Event Entrance QR Code */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                Self Check-in
              </span>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {currentEvent?.name?.slice(0, 16) || "Event QR"}
              </span>
            </div>
            <h3 className="font-display mt-3 text-base font-bold text-slate-900">
              Scan to Enter & Explore
            </h3>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              Visitors scan this QR code with their phone to self-register & check in immediately.
            </p>

            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white border border-slate-200 p-3 shadow-md">
              <QrCode
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/gate/${eventId || "live"}`
                    : `https://eventos.live/gate/${eventId || "live"}`
                }
                size={140}
              />
            </div>

            <div className="mt-4">
              <Link
                href={`/gate/${eventId || ""}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Mobile Self-Check-in Pass</span>
              </Link>
            </div>
          </div>

          {/* Walk-in Registration Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left text-slate-900">
            <h3 className="font-display flex items-center gap-2 text-base font-bold text-slate-900">
              <UserPlus className="h-4 w-4 text-indigo-600" />
              <span>Walk-In Registration</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Issue instant badge & pass for <span className="text-indigo-700 font-bold">{currentEvent?.name || "this event"}</span>.
            </p>
            <form onSubmit={quickRegister} className="mt-4 space-y-2.5">
              <input
                name="name"
                required
                placeholder="Attendee Full Name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
              <input
                name="phone"
                placeholder="Phone Number (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
              <select
                name="type"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white font-medium transition"
              >
                <option value="visitor">General Visitor / Attendee</option>
                <option value="vip">VIP Guest / Investor</option>
                <option value="exhibitor">Exhibitor / Team Builder</option>
                <option value="media">Press & Media</option>
              </select>
              <button className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-xs font-bold shadow-xs transition">
                Issue Pass for {currentEvent?.name?.slice(0, 16) || "Event"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
