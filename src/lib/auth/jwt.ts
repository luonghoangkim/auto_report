/**
 * jwt.ts — Sign and verify JWTs using the `jose` library (pure JS, no native deps).
 *
 * Token payload: { sub: userId, username, role }
 * Duration: 7 days
 * Stored in: HTTP-only cookie named "auth_token"
 */

import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-in-production-min-32-chars!!"
);

const ALGORITHM  = "HS256";
const DURATION   = "7d";
export const COOKIE_NAME = "auth_token";

export interface JWTPayload {
  sub:      string;   // userId
  username: string;
  role:     string;
  name?:    string;
}

/** Sign a JWT and return the token string. */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(DURATION)
    .sign(SECRET);
}

/** Verify a JWT. Returns the payload or null if invalid/expired. */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
    return {
      sub:      payload.sub as string,
      username: payload.username as string,
      role:     payload.role as string,
      name:     payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}
