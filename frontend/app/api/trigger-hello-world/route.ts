import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const handle = await tasks.trigger("hello-world", {
      message: "Hello from the frontend demo",
    });

    return NextResponse.json({
      runId: handle.id,
      publicAccessToken: handle.publicAccessToken,
    });
  } catch (error) {
    console.error("Failed to trigger hello-world task", error);
    return NextResponse.json(
      { error: "Failed to trigger task" },
      { status: 500 }
    );
  }
}
