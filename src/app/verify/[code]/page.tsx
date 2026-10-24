"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import {
  BadgeCheck,
  Printer,
  XCircle,
  Award,
  ShieldCheck,
  Sparkles,
  Calendar,
  Lock,
  Share2,
  Copy,
  ChevronLeft,
} from "lucide-react";

export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<{
    recipientName: string;
    role: string;
    title: string;
    code: string;
    issuedAt: string;
    eventId: string;
    signatory1?: string;
    signatory2?: string;
    theme?: string;
    isTamperProof?: boolean;
    isValidSignature?: boolean;
    verificationHash?: string;
    isLocked?: boolean;
    eventStatus?: string;
  } | null>(null);
  const [evName, setEvName] = useState("");
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setMissing(true);
      }
    }, 4500);

    (async () => {
      try {
        const r = await fetch(`/api/certificates?code=${encodeURIComponent(code || "")}`);
        if (!r.ok) {
          if (!cancelled) setMissing(true);
          return;
        }
        const d = await r.json();
        if (!d || d.error || !d.recipientName) {
          if (!cancelled) setMissing(true);
          return;
        }
        if (!cancelled) {
          setCert(d);
          try {
            const ev = await fetch(`/api/events/${d.eventId}`).then((x) => x.json());
            setEvName(ev?.name || "National Tech Exposition & Awards");
          } catch {
            setEvName("National Tech Exposition & Awards");
          }
        }
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (missing) {
    return (
      <main className="mx-auto max-w-md px-4 pb-24 pt-32 text-center">
        <div className="glass-card rounded-3xl p-10">
          <XCircle className="mx-auto h-14 w-14 text-rose-400" />
          <h1 className="font-display mt-4 text-2xl font-bold">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-white/55">
            Credential hash <span className="font-mono text-white font-bold">{code}</span> could not be verified in the registry.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/certificates"
              className="rounded-xl bg-[#c8f31d] px-5 py-3 text-sm font-bold text-black hover:bg-white"
            >
              Go to Certificate Studio
            </Link>
            <Link href="/" className="glass rounded-xl px-5 py-3 text-sm font-semibold hover:bg-white/10">
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!cert) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-36 text-center">
        <div className="glass-card rounded-3xl p-14">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <h2 className="font-display mt-4 text-xl font-bold">Verifying Cryptographic Credential…</h2>
          <p className="mt-1 font-mono text-xs text-white/40">Querying registry hash: {code}</p>
        </div>
      </main>
    );
  }

  if (cert.isLocked) {
    return (
      <main className="relative min-h-screen bg-[#05070f] px-4 pb-24 pt-32 text-center text-white">
        <div className="pointer-events-none absolute left-1/2 top-16 h-80 w-[450px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-md rounded-3xl border border-amber-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            <Lock className="h-8 w-8" />
          </div>
          <span className="mt-4 inline-block rounded-full bg-amber-400/20 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
            Certificate Locked · Event In Progress
          </span>
          <h2 className="font-display mt-3 text-2xl font-black text-white">
            Ceremony In Progress
          </h2>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            This certificate for <b className="text-white">{cert.recipientName}</b> is registered in the secure vault, but remains locked while <b>{evName || "the event"}</b> is actively running.
          </p>
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200 text-left">
            🔒 <b>How to unlock:</b> The event organizer must officially conclude the event ceremony from the Admin Console. Once ended, this credential unlocks automatically with full cryptographic tamper-proof verification.
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-950 hover:bg-slate-200 transition"
            >
              Return to Platform Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isGold = cert.theme === "gold" || cert.role === "winner";

  return (
    <main className="relative min-h-screen bg-[#05070f] px-4 pb-24 pt-28">
      <div className="aurora-bg -top-24 h-96 opacity-50" />

      <div className="relative mx-auto max-w-4xl">
        {/* Navigation & Verification Badge */}
        <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Studio</span>
          </Link>

          {cert.isValidSignature === false ? (
            <div className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <XCircle className="h-4 w-4" />
              <span>Warning: Signature Mismatch · Credential May Be Tampered</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
              <BadgeCheck className="h-4 w-4" />
              <span>Official Authenticated Credential · HMAC-SHA256 Cryptographically Verified</span>
            </div>
          )}
        </div>

        {/* Certificate Rendering Container */}
        <div
          className={`print-cert relative overflow-hidden rounded-3xl border shadow-2xl transition-all ${
            isGold
              ? "cert-gold border-amber-400/40"
              : "cert-cyber border-cyan-400/40"
          }`}
        >
          {/* Guilloche Border */}
          <div className="guilloche-border absolute inset-3 rounded-2xl pointer-events-none opacity-40 border border-current" />

          <div className="relative p-8 md:p-14 text-center flex flex-col justify-between min-h-[520px]">
            {/* Top Seal */}
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                <Award className="h-9 w-9" />
              </div>
              <div className="font-mono mt-5 text-[11px] uppercase tracking-[0.35em] text-amber-300 font-bold">
                CERTIFICATE OF {cert.role.toUpperCase()}
              </div>
            </div>

            {/* Recipient & Citation */}
            <div className="my-8">
              <p className="font-editorial text-sm italic opacity-70">This is to officially certify that</p>
              <h1 className="font-luxury mt-3 text-4xl md:text-6xl font-extrabold tracking-tight gold-foil">
                {cert.recipientName}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed opacity-85">
                {cert.title || `has demonstrated exceptional innovation and leadership at ${evName}`}
              </p>
              <div className="font-display mt-3 text-xl font-bold tracking-tight opacity-95">
                {evName}
              </div>
            </div>

            {/* Footer Signatures & QR */}
            <div className="mt-8 border-t border-current/20 pt-6 flex items-end justify-between text-left">
              <div>
                <div className="font-editorial text-xl italic tracking-wider opacity-90 border-b border-current/40 pb-1">
                  {cert.signatory1 || "Dr. Elena Vance"}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider opacity-60 mt-1">
                  Grand Jury Chair · Nexathon
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                    VERIFICATION HASH
                  </div>
                  <div className="font-mono text-sm font-bold text-[#c8f31d]">{cert.code}</div>
                  <div className="font-mono text-[10px] opacity-60">
                    Issued {new Date(cert.issuedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white p-1.5 shadow-lg">
                  <QrCode
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${cert.code}`}
                    size={76}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="no-print mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c8f31d] py-3.5 text-sm font-bold text-black transition hover:bg-white shadow-[0_0_20px_rgba(200,243,29,0.3)]"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save High-Res PDF</span>
          </button>
          <button
            onClick={copyUrl}
            className="glass flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Copy className="h-4 w-4 text-cyan-300" />
            <span>{copied ? "Link Copied!" : "Share Credential"}</span>
          </button>
          <Link
            href="/certificates"
            className="glass flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            <span>Create New Certificate</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
