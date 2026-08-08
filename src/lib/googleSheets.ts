import { existsSync } from "node:fs";
import { google } from "googleapis";
import { env } from "../config/env.js";

const SHEET_RANGE = "Reports!A:J";
const MAX_MARKDOWN_CELL_CHARS = 45_000;

export type ReportRow = {
  id: string;
  createdAt: string;
  topic: string;
  focus: string;
  recency: string;
  status: "completed" | "failed";
  sourceCount: number;
  runId: string;
  title: string;
  markdown: string;
};

function getAuth() {
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

  if (existsSync(env.googleApplicationCredentials)) {
    return new google.auth.GoogleAuth({
      keyFile: env.googleApplicationCredentials,
      scopes,
    });
  }

  const raw = env.googleServiceAccountJson;
  if (!raw) {
    throw new Error(
      "No Google credentials available: neither the key file at GOOGLE_APPLICATION_CREDENTIALS " +
        "nor the GOOGLE_SERVICE_ACCOUNT_JSON env var is set."
    );
  }
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes,
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export async function appendReportRow(row: ReportRow): Promise<void> {
  const sheets = getSheetsClient();
  const markdown =
    row.markdown.length > MAX_MARKDOWN_CELL_CHARS
      ? row.markdown.slice(0, MAX_MARKDOWN_CELL_CHARS) + "\n\n...[truncated for storage]"
      : row.markdown;

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.googleSheetsSpreadsheetId,
    range: SHEET_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          row.id,
          row.createdAt,
          row.topic,
          row.focus,
          row.recency,
          row.status,
          row.sourceCount,
          row.runId,
          row.title,
          markdown,
        ],
      ],
    },
  });
}
