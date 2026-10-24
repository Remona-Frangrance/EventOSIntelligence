"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { extra: { digest: error.digest } });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#FAFAF9] p-6 text-slate-900 font-sans">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 text-xl font-bold">
            ⚠️
          </div>
          <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            An unexpected error has been captured and logged to our forensic monitoring telemetry.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] text-slate-400">
              Error Digest: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Reload Platform
          </button>
        </div>
      </body>
    </html>
  );
}
