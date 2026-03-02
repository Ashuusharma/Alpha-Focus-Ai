import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  await writeAuditLog({ action: "auth.logout", userId: "session_user", ok: true, route: "/api/auth/logout" });
  return response;
}
