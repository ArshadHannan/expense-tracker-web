import { createHash } from "node:crypto";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sub?: string;
};

const googleAuthorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenEndpoint = "https://oauth2.googleapis.com/token";
const googleUserinfoEndpoint = "https://openidconnect.googleapis.com/v1/userinfo";

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }

  return {
    clientId,
    clientSecret,
    scope: "openid profile email",
  };
}

export function getBaseUrl(requestUrl: string) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const url = new URL(requestUrl);
  return url.origin;
}

export function getGoogleRedirectUri(requestUrl: string) {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${getBaseUrl(requestUrl)}/auth/callback`
  );
}

export function createGoogleAuthorizationUrl({
  codeChallenge,
  requestUrl,
  state,
}: {
  codeChallenge: string;
  requestUrl: string;
  state: string;
}) {
  const config = getGoogleConfig();
  const authorizationUrl = new URL(googleAuthorizationEndpoint);

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    getGoogleRedirectUri(requestUrl),
  );
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");

  return authorizationUrl;
}

export function createPkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function exchangeGoogleAuthorizationCode({
  code,
  codeVerifier,
  requestUrl,
}: {
  code: string;
  codeVerifier: string;
  requestUrl: string;
}) {
  const config = getGoogleConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getGoogleRedirectUri(requestUrl),
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });

  const response = await fetch(googleTokenEndpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const token = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || token.error) {
    throw new Error(
      token.error_description ?? token.error ?? "Google login failed.",
    );
  }

  return token;
}

export async function loadGoogleProfile(accessToken: string) {
  const response = await fetch(googleUserinfoEndpoint, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load your Google profile.");
  }

  return normalizeGoogleProfile((await response.json()) as GoogleProfile);
}

function normalizeGoogleProfile(profile: GoogleProfile) {
  const fallbackName = [profile.given_name, profile.family_name]
    .filter(Boolean)
    .join(" ");

  if (!profile.email) {
    throw new Error("Your Google profile did not include an email address.");
  }

  return {
    email: profile.email,
    name: profile.name ?? fallbackName ?? profile.email,
    picture: profile.picture,
  };
}
