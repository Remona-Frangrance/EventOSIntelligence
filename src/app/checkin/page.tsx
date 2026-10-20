"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import { ScanLine, CheckCircle2, UserPlus, XCircle, ExternalLink } from "lucide-react";

export default function CheckinPage() {
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [eventId, setEventId] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; title: string; sub: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [count, setCount] = useState<{ in: number; total: number }>({ in: 0, total: 0 });

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => {
      setEvents(d);
      if (d[0]) {
        setEventId(d[0].id);
        refreshCount(d[0].id);
      }
    });
  }, []);

  async function refreshCount(id: string) {
    const v = await fetch(`/api/visitors?eventId=${id}`).then((r) => r.json());
    setCount({ in: v.filter((x: { checkedIn: boolean }) => x.checkedIn).length, total: v.length });
  }

  async function checkin(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const r = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const d = await r.json();
    if (r.ok) {
      setResult({ ok: true, title: d.alreadyIn ? "Already inside" : "Welcome in!", sub: d.message || d.name });
      setRecent((x) => [`${d.name} · ${d.code}`, ...x].slice(0, 6));
      if (eventId) refreshCount(eventId);
    } else {
      setResult({ ok: false, title: "Pass not found", sub: d.error });
    }
    setCode("");
    setBusy(false);
  }

  async function quickRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, name: fd.get("name"), phone: fd.get("phone"), type: fd.get("type") }),
    });
    const d = await r.json();
    (e.target as HTMLFormElement).reset();
    setResult({ ok: true, title: "Pass issued on the spot", sub: `${d.name} · ${d.code} — now scan to check in` });
    if (eventId) refreshCount(eventId);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28">
      <div className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300">// Gate terminal</div>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight">QR Check-in</h1>
        <p className="mt-2 text-white/55">Works on any phone, tablet or laptop at the gate. No hardware needed.</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-7">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px animate-[scanline_3s_linear_infinite] bg-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold"><ScanLine className="h-4 w-4 text-emerald-300" /> Scan / type visitor pass</span>
            <select value={eventId} onChange={(e) => { setEventId(e.target.value); refreshCount(e.target.value); }} className="glass max-w-[200px] rounded-lg px-3 py-2 text-xs outline-none">
              {events.map((e) => (
                <option key={e.id} value={e.id} className="bg-[#0b0f1d]">{e.name.slice(0, 28)}</option>
              ))}
            </select>
          </div>
          <form onSubmit={checkin} className="mt-5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VIS-XXXXX"
              autoFocus
              className="font-mono w-full rounded-2xl border-2 border-dashed border-white/20 bg-black/50 px-5 py-5 text-center text-2xl font-bold tracking-[0.2em] outline-none placeholder:text-white/15 focus:border-emerald-400"
            />
            <button disabled={busy} className="mt-3 w-full rounded-xl bg-emerald-400 py-4 text-sm font-bold text-black hover:bg-white disabled:opacity-50">
              {busy ? "Verifying…" : "Check in →"}
            </button>
          </form>
          <button onClick={() => setCode("VIS-10001")} className="font-mono mt-3 w-full text-center text-[11px] text-white/35 hover:text-white">
            Demo pass: <span className="text-emerald-300">VIS-10001</span> (tap to fill)
          </button>

          {result && (
            <div className={`mt-4 flex items-center gap-3 rounded-2xl border p-4 ${result.ok ? "border-emerald-400/40 bg-emerald-400/10" : "border-rose-400/40 bg-rose-400/10"}`}>
              {result.ok ? <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-300" /> : <XCircle className="h-8 w-8 shrink-0 text-rose-300" />}
              <div>
                <div className="font-bold">{result.title}</div>
                <div className="text-sm text-white/60">{result.sub}</div>
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="mt-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/35">Just checked in</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((r, i) => (
                  <span key={i} className="font-mono rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-white/65">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 text-center">
              <div className="font-display text-3xl font-bold text-emerald-300">{count.in}</div>
              <div className="font-mono mt-1 text-[10px] uppercase tracking-widest text-white/40">Inside</div>
            </div>
            <div className="glass rounded-2xl p-5 text-center">
              <div className="font-display text-3xl font-bold">{count.total}</div>
              <div className="font-mono mt-1 text-[10px] uppercase tracking-widest text-white/40">Registered</div>
            </div>
          </div>

          {/* Common Event Entrance QR Code */}
          <div className="glass rounded-2xl p-6 text-center">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                Self Check-in
              </span>
              <span className="font-mono text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded">
                Common Event QR
              </span>
            </div>
            <h3 className="font-display mt-2 text-base font-bold text-white">
              Scan to Enter & Explore
            </h3>
            <p className="mt-1 text-xs text-white/50">
              Visitors scan this screen to self-register & check in immediately.
            </p>

            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow-xl">
              <QrCode
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/gate/${eventId || "live"}`
                    : `https://nexathon.live/gate/${eventId || "live"}`
                }
                size={140}
              />
            </div>

            <div className="mt-3">
              <Link
                href={`/gate/${eventId || ""}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-black hover:bg-white transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Mobile Self-Check-in</span>
              </Link>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display flex items-center gap-2 text-base font-bold"><UserPlus className="h-4 w-4 text-[#c8f31d]" /> Walk-in registration</h3>
            <p className="mt-1 text-xs text-white/45">Manual gatekeeper pass issuance.</p>
            <form onSubmit={quickRegister} className="mt-4 space-y-2.5">
              <input name="name" required placeholder="Full name" className="w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
              <input name="phone" placeholder="Phone (optional)" className="w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
              <select name="type" className="w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none">
                <option value="visitor">Visitor</option>
                <option value="vip">VIP</option>
                <option value="exhibitor">Exhibitor</option>
                <option value="media">Media</option>
              </select>
              <button className="w-full rounded-xl bg-white/10 py-3 text-sm font-bold hover:bg-white/20">Issue pass</button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
