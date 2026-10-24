"use client";

import { useEffect, useState } from "react";
import { ScanLine, Star, BadgeCheck, Trophy } from "lucide-react";

const feed = [
  { icon: ScanLine, text: "QR scan · MediQueue AI · Booth B-1", time: "2s", color: "text-cyan-300" },
  { icon: Star, text: "Judge Anjali scored SwarmDrones 34/40", time: "18s", color: "text-amber-300" },
  { icon: BadgeCheck, text: "Check-in #1,204 · Diya Sharma · VIP", time: "31s", color: "text-emerald-300" },
  { icon: Trophy, text: "MediQueue AI takes #1 on leaderboard", time: "44s", color: "text-[#c8f31d]" },
  { icon: ScanLine, text: "QR scan · CarbonLedger · Booth B-5", time: "1m", color: "text-cyan-300" },
  { icon: Star, text: "Judge Suresh scored CredScore 36/40", time: "2m", color: "text-amber-300" },
];

export default function LivePulse() {
  const [tick, setTick] = useState(0);
  const [counts, setCounts] = useState({ scans: 4821, scores: 312, checkins: 1204, certs: 486 });
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setCounts((c) => ({
        scans: c.scans + Math.floor(Math.random() * 4),
        scores: c.scores + (Math.random() > 0.7 ? 1 : 0),
        checkins: c.checkins + (Math.random() > 0.6 ? 1 : 0),
        certs: c.certs + (Math.random() > 0.85 ? 1 : 0),
      }));
    }, 2200);
    return () => clearInterval(id);
  }, []);
  const visible = [0, 1, 2, 3].map((i) => feed[(tick + i) % feed.length]);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-blink rounded-full bg-red-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">Live event pulse</span>
        </div>
        <span className="font-mono rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[10px] text-indigo-300 font-bold">NEXATHON &apos;26</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { k: "QR scans", v: counts.scans.toLocaleString() },
          { k: "Scores", v: counts.scores.toString() },
          { k: "Check-ins", v: counts.checkins.toLocaleString() },
          { k: "Certs", v: counts.certs.toString() },
        ].map((s) => (
          <div key={s.k} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2.5 text-center">
            <div className="font-display text-sm font-bold text-white tabular-nums md:text-lg">{s.v}</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">{s.k}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {visible.map((f, i) => (
          <div
            key={`${tick}-${i}`}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
            style={{ opacity: 1 - i * 0.22 }}
          >
            <f.icon className={`h-4 w-4 shrink-0 ${f.color}`} />
            <span className="flex-1 truncate text-[13px] text-white/80">{f.text}</span>
            <span className="font-mono text-[10px] text-white/35">{f.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
