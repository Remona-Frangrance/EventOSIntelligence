"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GateIndex() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((events) => {
        if (Array.isArray(events) && events.length > 0) {
          const live = events.find((e: any) => e.status === "live") || events[0];
          router.replace(`/gate/${live.id}`);
        } else {
          router.replace("/gate/nexathon-26");
        }
      })
      .catch(() => {
        router.replace("/gate/nexathon-26");
      });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-white">
      <div className="font-mono text-xs text-white/50 animate-pulse">
        Connecting to Event Gate…
      </div>
    </main>
  );
}
