import { improveDataset } from "@/lib/cognee/client";

export async function POST() {
  try {
    const result = await improveDataset();
    return Response.json({
      live: true,
      status: "ok",
      message: "Cognee improve accepted; re-running triage",
      result,
    });
  } catch (error) {
    return Response.json(
      {
        live: false,
        status: "degraded",
        message: "Improve unavailable; re-running recall without ranking claim.",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 200 },
    );
  }
}
