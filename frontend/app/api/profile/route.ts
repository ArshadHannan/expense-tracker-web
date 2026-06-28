import { NextRequest, NextResponse } from "next/server";
import {
  authCookieOptions,
  createSessionCookie,
  getCurrentUser,
  sessionCookieName,
} from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, name, email: user.email });

  response.cookies.set(
    sessionCookieName,
    createSessionCookie({ name, email: user.email, picture: user.picture }),
    { ...authCookieOptions, maxAge: 60 * 60 * 8 },
  );

  return response;
}
