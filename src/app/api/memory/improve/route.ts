import { improveDataset } from "@/lib/cognee/client";

export async function POST() {
  try {
    const result = await improveDataset();
    return Response.json({
      status: "ok",
      message: "Memory updated; re-running triage",
      result,
    });
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        message: "Improve request could not complete, but triage can still be re-run.",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 200 },
    );
  }
}

