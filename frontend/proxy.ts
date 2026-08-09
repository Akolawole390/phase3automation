import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_AUTH_COOKIE, siteAuthToken } from "./lib/siteAuth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  const expected = siteAuthToken(
    process.env.SITE_USERNAME ?? "",
    process.env.SITE_PASSWORD ?? ""
  );
  const cookieValue = request.cookies.get(SITE_AUTH_COOKIE)?.value;

  if (cookieValue && cookieValue === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
