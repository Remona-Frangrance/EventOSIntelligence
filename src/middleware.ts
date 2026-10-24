import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken, SessionRole } from "@/lib/session";

interface RouteProtection {
  prefix: string;
  allowedRoles: SessionRole[];
  label: string;
}

const PROTECTED_ROUTES: RouteProtection[] = [
  { prefix: "/console", allowedRoles: ["admin"], label: "Admin Console" },
  { prefix: "/judge", allowedRoles: ["judge", "admin"], label: "Judge Portal" },
  { prefix: "/participant", allowedRoles: ["participant", "admin"], label: "Participant Portal" },
  { prefix: "/visitor", allowedRoles: ["visitor", "admin"], label: "Visitor Portal" },
  { prefix: "/checkin", allowedRoles: ["admin"], label: "Scanner Terminal" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Find if this path requires protection
  const matchedRoute = PROTECTED_ROUTES.find((r) =>
    pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );

  // If not a protected route, proceed
  if (!matchedRoute) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the JWT session token
  const sessionUser = await verifySessionToken(sessionCookie);

  if (!sessionUser) {
    // Cookie is invalid or expired
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("sessionExpired", "true");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Check role authorization
  const isAuthorized =
    sessionUser.role === "admin" || matchedRoute.allowedRoles.includes(sessionUser.role);

  if (!isAuthorized) {
    // Redirect to their own role's home page
    let destination = "/";
    if (sessionUser.role === "participant") destination = "/participant";
    else if (sessionUser.role === "judge") destination = "/judge";
    else if (sessionUser.role === "visitor") destination = "/visitor";
    else if (sessionUser.role === "admin") destination = "/console";

    const redirectUrl = new URL(destination, req.url);
    redirectUrl.searchParams.set("unauthorized", "true");
    return NextResponse.redirect(redirectUrl);
  }

  // Valid session - attach user metadata in headers and proceed
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", sessionUser.id);
  requestHeaders.set("x-user-email", sessionUser.email);
  requestHeaders.set("x-user-role", sessionUser.role);
  if (sessionUser.organizationId) {
    requestHeaders.set("x-user-org-id", sessionUser.organizationId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/console/:path*",
    "/judge/:path*",
    "/participant/:path*",
    "/visitor/:path*",
    "/checkin/:path*",
  ],
};
