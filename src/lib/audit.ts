import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_REGISTER"
  | "USER_LOGOUT"
  | "EVENT_CREATE"
  | "EVENT_UPDATE"
  | "EVENT_DELETE"
  | "PROJECT_CREATE"
  | "PROJECT_UPDATE"
  | "SCORE_SUBMIT"
  | "SCORE_UPDATE"
  | "CHECKIN_SUCCESS"
  | "CHECKIN_DUPLICATE"
  | "CERTIFICATE_ISSUE"
  | "FEEDBACK_SUBMIT";

export interface LogAuditParams {
  organizationId?: string | null;
  eventId?: string | null;
  userId?: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction | string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Asynchronously logs an audit event to the database.
 * Does not throw errors if logging fails to prevent breaking primary user flows.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const validOrgId = params.organizationId && uuidRegex.test(params.organizationId) ? params.organizationId : null;
  const validEventId = params.eventId && uuidRegex.test(params.eventId) ? params.eventId : null;
  const validUserId = params.userId && uuidRegex.test(params.userId) ? params.userId : null;

  try {
    await db.insert(auditLogs).values({
      organizationId: validOrgId,
      eventId: validEventId,
      userId: validUserId,
      actorEmail: params.actorEmail || "anonymous",
      actorRole: params.actorRole || "system",
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || "",
      details: params.details || {},
      ipAddress: params.ipAddress || "",
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Audit log warning (non-fatal):", err);
    }
  }
}

export const recordAuditLog = logAudit;
