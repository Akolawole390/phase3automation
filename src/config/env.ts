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
  get googleSheetsSpreadsheetId() {
    return required("GOOGLE_SHEETS_SPREADSHEET_ID");
  },
};
