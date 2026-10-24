import { SignJWT, jwtVerify } from "jose";

export type SessionRole = "admin" | "participant" | "judge" | "visitor";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  organizationId?: string | null;
  organization?: string;
  judgeCode?: string;
  projectId?: string;
  avatar?: string;
};

export const SESSION_COOKIE_NAME = "eventos_session";

const SESSION_SECRET_STRING =
  process.env.SESSION_SECRET || "eventos-super-secret-session-key-2026-production-ready-min32";
const SECRET_KEY = new TextEncoder().encode(SESSION_SECRET_STRING);

/**
 * Creates a signed JWT session token valid for 7 days.
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId || null,
    organization: user.organization || "",
    judgeCode: user.judgeCode || "",
    projectId: user.projectId || "",
    avatar: user.avatar || "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token and returns the decoded user payload.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as SessionRole,
      organizationId: (payload.organizationId as string) || null,
      organization: (payload.organization as string) || "",
      judgeCode: (payload.judgeCode as string) || undefined,
      projectId: (payload.projectId as string) || undefined,
      avatar: (payload.avatar as string) || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Standard cookie configuration for session cookie.
 */
export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };
}
