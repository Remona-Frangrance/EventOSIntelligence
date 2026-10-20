"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import { CheckCircle2, Plus, X } from "lucide-react";

export default function RegisterPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [ev, setEv] = useState<{ name: string; tagline: string; categories: string[]; venue: string; bannerGradient: string; status: string } | null>(null);
  const [members, setMembers] = useState([""]);
  const [tech, setTech] = useState("");
  const [done, setDone] = useState<{ title: string; code: string; boothNo: string; teamName: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}`).then((r) => r.json()).then(setEv);
  }, [eventId]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
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

  if (done) {
    return (
      <main className="mx-auto max-w-lg px-4 pb-24 pt-32 text-center">
        <div className="glass-strong rounded-3xl p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h1 className="font-display mt-4 text-3xl font-bold">You&apos;re in, {done.teamName}!</h1>
          <p className="mt-2 text-sm text-white/55">Booth <b className="text-[#c8f31d]">{done.boothNo}</b> is reserved for <b>{done.title}</b>. Your QR identity:</p>
          <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4">
            <QrCode value={`${window.location.origin}/p/${done.code}`} size={190} />
          </div>
          <div className="font-mono mt-3 text-sm text-[#c8f31d]">{done.code}</div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link href={`/p/${done.code}`} className="rounded-xl bg-[#c8f31d] py-3 text-sm font-bold text-black hover:bg-white">View live profile</Link>
            <button onClick={() => setDone(null)} className="glass rounded-xl py-3 text-sm font-semibold hover:bg-white/10">Register another</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-28">
      {ev && (
        <div className={`overflow-hidden rounded-3xl bg-gradient-to-r ${ev.bannerGradient} p-7`}>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80">Team registration</div>
          <h1 className="font-display mt-2 text-3xl font-bold text-white drop-shadow">{ev.name}</h1>
          <p className="mt-1 text-sm text-white/85">{ev.tagline} · {ev.venue}</p>
        </div>
      )}
      <form onSubmit={submit} className="glass mt-5 space-y-4 rounded-3xl p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="lbl">Project title *</span>
            <input name="title" required placeholder="e.g. MediQueue AI" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Track / category *</span>
            <select name="category" className="inp">
              {(ev?.categories || ["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech"]).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="lbl">Team name *</span>
            <input name="team" required placeholder="e.g. PulseCoders" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Demo / repo URL</span>
            <input name="demo" placeholder="https://…" className="inp" />
          </label>
        </div>
        <label className="block">
          <span className="lbl">One-paragraph pitch *</span>
          <textarea name="desc" required rows={3} placeholder="What does it do, who is it for, why does it win?" className="inp" />
        </label>
        <label className="block">
          <span className="lbl">Tech stack (comma separated)</span>
          <input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="Python, React, ESP32…" className="inp" />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="lbl">Team lead *</span>
            <input name="leader" required placeholder="Full name" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Email *</span>
            <input name="email" type="email" required placeholder="lead@mail.com" className="inp" />
          </label>
          <label className="block">
            <span className="lbl">Phone</span>
            <input name="phone" placeholder="+91…" className="inp" />
          </label>
        </div>
        <div>
          <span className="lbl">Team members</span>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input value={m} onChange={(e) => setMembers(members.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Member ${i + 1} name`} className="inp" />
                {members.length > 1 && (
                  <button type="button" onClick={() => setMembers(members.filter((_, j) => j !== i))} className="glass rounded-xl px-3 hover:bg-white/10"><X className="h-4 w-4" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setMembers([...members, ""])} className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#c8f31d] hover:text-white">
              <Plus className="h-4 w-4" /> Add member
            </button>
          </div>
        </div>
        <button disabled={saving} className="w-full rounded-2xl bg-[#c8f31d] py-4 text-sm font-bold text-black hover:bg-white disabled:opacity-50">
          {saving ? "Reserving booth…" : "Register team & generate QR →"}
        </button>
        <p className="text-center text-xs text-white/35">Free forever for campus events · Booth + QR assigned instantly</p>
      </form>
      <style>{`.lbl{font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:rgba(255,255,255,.45);display:block;margin-bottom:.4rem}.inp{width:100%;border-radius:.75rem;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.4);padding:.75rem 1rem;font-size:.875rem;outline:none;color:#fff}.inp:focus{border-color:#c8f31d}`}</style>
    </main>
  );
}
