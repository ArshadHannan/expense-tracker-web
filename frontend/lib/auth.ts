import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type SessionUser = {
  email: string;
  name: string;
  picture?: string;
  expiresAt: number;
};

export const sessionCookieName = "__expense_session";
export const googleStateCookieName = "__expense_google_state";
export const googleVerifierCookieName = "__expense_google_verifier";
export const googleReturnToCookieName = "__expense_google_return_to";

export const authCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function createRandomToken(bytes = 32) {
  return base64UrlEncode(randomBytes(bytes));
}

export function createSessionCookie(user: Omit<SessionUser, "expiresAt">) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  const payload = base64UrlEncode(
    Buffer.from(JSON.stringify({ ...user, expiresAt })),
  );
  const signature = signValue(payload);

  return `${payload}.${signature}`;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName)?.value;

  if (!sessionCookie) {
    return null;
  }

  return verifySessionCookie(sessionCookie);
}

export function verifySessionCookie(value: string): SessionUser | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature || !safeCompare(signature, signValue(payload))) {
    return null;
  }

  try {
    const user = JSON.parse(base64UrlDecode(payload).toString()) as SessionUser;

    if (!user.email || !user.name || user.expiresAt < Date.now()) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function base64UrlDecode(input: string) {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded.replaceAll("-", "+").replaceAll("_", "/"), "base64");
}

function signValue(value: string) {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing AUTH_SESSION_SECRET for signed auth sessions.");
    }

    return createHmac("sha256", "expense-tracker-local-dev-secret")
      .update(value)
      .digest("base64url");
  }

  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}
