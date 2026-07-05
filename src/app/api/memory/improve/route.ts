import { z } from "zod";
import { improveDataset } from "@/lib/cognee/client";

const ImproveRequest = z.object({
  dismissedIssueNumber: z.number().optional(),
});

export async function POST(request?: Request) {
  const parsed = request
    ? ImproveRequest.safeParse(await request.json().catch(() => ({})))
    : { success: true as const, data: {} };

  const dismissedIssueNumber = parsed.success ? parsed.data.dismissedIssueNumber : undefined;

  try {
    const result = await improveDataset();
    return Response.json({
      live: true,
      status: "ok",
      message: "Cognee improve accepted; re-running triage with refreshed memory.",
      dismissedIssueNumber,
      result,
    });
  } catch (error) {
    return Response.json(
      {
        live: false,
        status: "degraded",
        message: "Improve unavailable; re-running recall without ranking claim.",
        error: error instanceof Error ? error.message : "unknown error",
        dismissedIssueNumber,
      },
      { status: 200 },
    );
  }
}
