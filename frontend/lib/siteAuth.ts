import { createHash } from "node:crypto";

export const SITE_AUTH_COOKIE = "site_auth";

// The cookie stores a hash derived from the password, never the password
// itself — so a leaked cookie only grants access, and rotating
// SITE_PASSWORD automatically invalidates every existing cookie.
export function siteAuthToken(password: string): string {
  return createHash("sha256").update(`phase3-gate:${password}`).digest("hex");
}
