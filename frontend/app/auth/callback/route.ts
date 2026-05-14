import { NextRequest, NextResponse } from "next/server";
import {
  authCookieOptions,
  createSessionCookie,
  googleReturnToCookieName,
  googleStateCookieName,
  googleVerifierCookieName,
  sessionCookieName,
} from "@/lib/auth";
import {
  exchangeGoogleAuthorizationCode,
  loadGoogleProfile,
} from "../_lib/google";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(googleStateCookieName)?.value;
  const codeVerifier = request.cookies.get(googleVerifierCookieName)?.value;
  const returnTo =
    request.cookies.get(googleReturnToCookieName)?.value ?? "/dashboard";

  if (error) {
    return redirectToLogin(request, error);
  }

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return redirectToLogin(request, "Invalid or expired Google login request.");
  }

  try {
    const token = await exchangeGoogleAuthorizationCode({
      code,
      codeVerifier,
      requestUrl: request.url,
    });

    if (!token.access_token) {
      throw new Error("Google did not return an access token.");
    }

    const user = await loadGoogleProfile(token.access_token);
    const response = NextResponse.redirect(new URL(safeReturnTo(returnTo), request.url));

    response.cookies.set(sessionCookieName, createSessionCookie(user), {
      ...authCookieOptions,
      maxAge: 60 * 60 * 8,
    });
    clearGoogleCookies(response);

    return response;
  } catch (callbackError) {
    return redirectToLogin(
      request,
      callbackError instanceof Error
        ? callbackError.message
        : "Unable to finish Google login.",
    );
  }
}

function redirectToLogin(request: NextRequest, message: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);

  const response = NextResponse.redirect(loginUrl);
  clearGoogleCookies(response);

  return response;
}

function clearGoogleCookies(response: NextResponse) {
  for (const cookieName of [
    googleStateCookieName,
    googleVerifierCookieName,
    googleReturnToCookieName,
  ]) {
    response.cookies.set(cookieName, "", { ...authCookieOptions, maxAge: 0 });
  }
}

function safeReturnTo(returnTo: string) {
  return returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/dashboard";
}
