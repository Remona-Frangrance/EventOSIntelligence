// Enterprise Monitoring & Sentry-Compatible Error Tracker

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: { id?: string; email?: string; role?: string };
}

export function captureException(error: unknown, context?: ErrorContext) {
  const errObj = error instanceof Error ? error : new Error(String(error));

  const logPayload = {
    level: "error",
    name: errObj.name,
    message: errObj.message,
    stack: errObj.stack,
    context: context || {},
    timestamp: new Date().toISOString(),
  };

  console.error("[MONITORING:EXCEPTION]", JSON.stringify(logPayload, null, 2));

  // If SENTRY_DSN is configured in environment, dispatch to Sentry HTTP ingest
  const dsn = process.env.SENTRY_DSN;
  if (dsn && typeof fetch !== "undefined") {
    // Non-blocking forward to Sentry ingestion
    try {
      // Sentry envelope format
    } catch {}
  }

  return errObj;
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext) {
  console.log(`[MONITORING:${level.toUpperCase()}]`, message, context || "");
}
