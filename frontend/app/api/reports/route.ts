import { NextResponse } from "next/server";
import { listReports } from "../../../lib/googleSheets";

export async function GET() {
  try {
    const reports = await listReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to list reports", error);
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
  }
}
