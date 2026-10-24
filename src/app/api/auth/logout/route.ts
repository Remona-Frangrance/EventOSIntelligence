import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/session";
import { getAuthUser } from "@/lib/authGuard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  const clientIp = getClientIp(req);

  if (user) {
    await logAudit({
      organizationId: user.organizationId,
      userId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "USER_LOGOUT",
      targetType: "session",
      targetId: user.id,
      ipAddress: clientIp,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  const cookieOptions = getSessionCookieOptions();

  // Expire the cookie immediately
  response.cookies.set({
    ...cookieOptions,
    value: "",
    maxAge: 0,
  });

  return response;
}
