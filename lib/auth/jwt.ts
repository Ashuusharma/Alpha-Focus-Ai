import { jwtVerify, SignJWT } from "jose";

export type AuthTokenPayload = {
  sub: string;
  name: string;
  role: "user";
};

export const AUTH_COOKIE_NAME = "af_token";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "dev-insecure-jwt-secret-change-me";
}

function getSecretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyAuthToken(token: string) {
  const result = await jwtVerify(token, getSecretKey());
  return result.payload as unknown as AuthTokenPayload;
}

export function getAuthCookieConfig() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
