import { NextRequest, NextResponse } from "next/server";
import { getReport } from "../../../../lib/googleSheets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Failed to fetch report", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
