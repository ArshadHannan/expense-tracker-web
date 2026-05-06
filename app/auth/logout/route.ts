import { NextResponse } from "next/server";
import { authCookieOptions, sessionCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  return logout(request);
}

export async function GET(request: Request) {
  return logout(request);
}

function logout(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set(sessionCookieName, "", {
    ...authCookieOptions,
    maxAge: 0,
  });

  return response;
}
