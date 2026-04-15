/**
 * session.ts — Read the current authenticated user from the request cookie.
 *
 * Used by:
 * - API routes (pass `request.cookies`)
 * - Server components / layouts (use `cookies()` from next/headers)
 */

import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken, type JWTPayload } from "./jwt";

/**
 * Get current user from the auth cookie (Server Components / Route Handlers).
 * Returns null if no valid session.
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Build the Set-Cookie header value for setting the auth token.
 */
export function buildAuthCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge  = 60 * 60 * 24 * 7; // 7 days in seconds
  return [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Build the Set-Cookie header value for clearing the auth token.
 */
export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}
