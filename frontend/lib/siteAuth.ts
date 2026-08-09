import { createHash } from "node:crypto";

export const SITE_AUTH_COOKIE = "site_auth";

// The cookie stores a hash derived from the credentials, never the
// credentials themselves — so a leaked cookie only grants access, and
// rotating SITE_USERNAME/SITE_PASSWORD invalidates every existing cookie.
export function siteAuthToken(username: string, password: string): string {
  return createHash("sha256")
    .update(`phase3-gate:${username}:${password}`)
    .digest("hex");
}
