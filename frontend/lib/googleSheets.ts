import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

export type ReportSummary = {
  id: string;
  createdAt: string;
  topic: string;
  focus: string;
  recency: string;
  status: string;
  sourceCount: number;
  runId: string;
  title: string;
};

export type ReportDetail = ReportSummary & {
  markdown: string;
};

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is not set");
  }
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function rowToSummary(row: string[]): ReportSummary {
  const [id, createdAt, topic, focus, recency, status, sourceCount, runId, title] = row;
  return {
    id: id ?? "",
    createdAt: createdAt ?? "",
    topic: topic ?? "",
    focus: focus ?? "",
    recency: recency ?? "",
    status: status ?? "",
    sourceCount: Number(sourceCount) || 0,
    runId: runId ?? "",
    title: title ?? "",
  };
}

export async function listReports(): Promise<ReportSummary[]> {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID env var is not set");
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Reports!A2:I",
  });
  const rows = res.data.values ?? [];
  return rows.map((row) => rowToSummary(row as string[])).reverse();
}

export async function getReport(id: string): Promise<ReportDetail | null> {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID env var is not set");
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Reports!A2:J",
  });
  const rows = res.data.values ?? [];
  const row = rows.find((r) => r[0] === id);
  if (!row) return null;
  return {
    ...rowToSummary(row as string[]),
    markdown: (row[9] as string) ?? "",
  };
}
