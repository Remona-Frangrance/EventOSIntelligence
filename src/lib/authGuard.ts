import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken, SessionUser, SessionRole } from "@/lib/session";

/**
 * Extracts and verifies the session token from request cookies or Authorization header.
 */
export async function getAuthUser(req: Request): Promise<SessionUser | null> {
  let token: string | null = null;

  // 1. Check cookies
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match) {
    token = decodeURIComponent(match[1]);
  }

  // 2. Fallback to Authorization header: "Bearer <token>"
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Enforces role-based authentication on an API route.
 * Returns { authorized: true, user } or { authorized: false, response: NextResponse }
 */
export async function requireAuth(
  req: Request,
  allowedRoles?: SessionRole[]
): Promise<
  | { authorized: true; user: SessionUser }
  | { authorized: false; response: NextResponse }
> {
  const user = await getAuthUser(req);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required. Please log in to access this endpoint." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Admin always has superset access
    const isPermitted = user.role === "admin" || allowedRoles.includes(user.role);
    if (!isPermitted) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: `Access denied. Role '${user.role}' is not authorized for this action.`,
            requiredRoles: allowedRoles,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true, user };
}
