import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthCookieConfig, signAuthToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/server/validators";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";

type LoginRequest = {
  name?: string;
  consent?: boolean;
  passcode?: string;
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (isRateLimited(`auth:login:${ip}`, 12, 60_000)) {
      await writeAuditLog({ action: "auth.login", userId: "anonymous", ok: false, route: "/api/auth/login", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as LoginRequest;
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "auth.login", userId: "anonymous", ok: false, route: "/api/auth/login", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const name = body.name.trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
    }

    const pinHash = process.env.AUTH_DEMO_PIN_HASH;
    if (pinHash) {
      const passcode = String(body.passcode || "").trim();
      const passOk = await verifyPassword(passcode, pinHash);
      if (!passOk) {
        await writeAuditLog({ action: "auth.login", userId: "anonymous", ok: false, route: "/api/auth/login", detail: "invalid_credentials" });
        return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
      }
    }

    const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guest";
    const userId = `user_${normalized}`;

    const token = await signAuthToken({
      sub: userId,
      name,
      role: "user",
    });

    const response = NextResponse.json({ ok: true, user: { id: userId, name } });
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieConfig());
    await writeAuditLog({ action: "auth.login", userId, ok: true, route: "/api/auth/login" });
    return response;
  } catch {
    await writeAuditLog({ action: "auth.login", userId: "anonymous", ok: false, route: "/api/auth/login", detail: "internal_error" });
    return NextResponse.json({ ok: false, error: "login_failed" }, { status: 500 });
  }
}
