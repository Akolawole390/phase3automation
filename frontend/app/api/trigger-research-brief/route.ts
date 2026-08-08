import { tasks } from "@trigger.dev/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
    const focus = typeof body?.focus === "string" ? body.focus.trim() : undefined;
    const recency = typeof body?.recency === "string" ? body.recency : undefined;

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const handle = await tasks.trigger("research-brief", { topic, focus, recency });

    return NextResponse.json({
      runId: handle.id,
      publicAccessToken: handle.publicAccessToken,
    });
  } catch (error) {
    console.error("Failed to trigger research-brief task", error);
    return NextResponse.json(
      { error: "Failed to trigger task" },
      { status: 500 }
    );
  }
}
