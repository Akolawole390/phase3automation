import { existsSync } from "node:fs";
import path from "node:path";

// `trigger.dev dev` already loads .env for local task runs, and deployed
// tasks get vars from the dashboard — this only fills the gap for plain
// `node` scripts run directly, where nothing has loaded .env yet.
const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath) && !process.env.ANTHROPIC_API_KEY) {
  process.loadEnvFile(envPath);
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  get anthropicApiKey() {
    return required("ANTHROPIC_API_KEY");
  },
  get firecrawlApiKey() {
    return required("FIRECRAWL_API_KEY");
  },
  get googleApplicationCredentials() {
    return required("GOOGLE_APPLICATION_CREDENTIALS");
  },
  /** Full service-account JSON as a string — fallback for deployed runners
   * where the credentials file isn't present on disk. Optional: only one
   * of this or the file needs to exist. */
  get googleServiceAccountJson() {
    return process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  },
  get googleSheetsSpreadsheetId() {
    return required("GOOGLE_SHEETS_SPREADSHEET_ID");
  },
  get triggerSecretKey() {
    return required("TRIGGER_SECRET_KEY");
  },
  get triggerApiUrl() {
    return required("TRIGGER_API_URL");
  },
  get triggerProjectRef() {
    return required("TRIGGER_PROJECT_REF");
  },
};
