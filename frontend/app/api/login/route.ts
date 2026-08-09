import { NextRequest, NextResponse } from "next/server";
import { SITE_AUTH_COOKIE, siteAuthToken } from "../../../lib/siteAuth";

export async function POST(request: NextRequest) {
  const siteUsername = process.env.SITE_USERNAME;
  const sitePassword = process.env.SITE_PASSWORD;
  if (!siteUsername || !sitePassword) {
    return NextResponse.json(
      { error: "Site credentials are not configured" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (username !== siteUsername || password !== sitePassword) {
    return NextResponse.json(
      { error: "Incorrect username or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_AUTH_COOKIE, siteAuthToken(siteUsername, sitePassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
