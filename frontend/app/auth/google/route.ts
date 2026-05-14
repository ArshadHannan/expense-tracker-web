import { NextRequest, NextResponse } from "next/server";
import {
  authCookieOptions,
  createRandomToken,
  googleReturnToCookieName,
  googleStateCookieName,
  googleVerifierCookieName,
} from "@/lib/auth";
import {
  createGoogleAuthorizationUrl,
  createPkceChallenge,
} from "../_lib/google";

export async function GET(request: NextRequest) {
  try {
    const state = createRandomToken();
    const verifier = createRandomToken(64);
    const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard";
    const authorizationUrl = createGoogleAuthorizationUrl({
      codeChallenge: createPkceChallenge(verifier),
      requestUrl: request.url,
      state,
    });
    const response = NextResponse.redirect(authorizationUrl);
    const temporaryCookieOptions = { ...authCookieOptions, maxAge: 60 * 10 };

    response.cookies.set(googleStateCookieName, state, temporaryCookieOptions);
    response.cookies.set(
      googleVerifierCookieName,
      verifier,
      temporaryCookieOptions,
    );
    response.cookies.set(
      googleReturnToCookieName,
      returnTo,
      temporaryCookieOptions,
    );

    return response;
  } catch (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to start Google login.",
    );

    return NextResponse.redirect(loginUrl);
  }
}
