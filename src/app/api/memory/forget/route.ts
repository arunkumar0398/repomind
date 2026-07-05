import { forgetDataset } from "@/lib/cognee/client";

export async function POST() {
  try {
    const result = await forgetDataset();
    return Response.json({ status: "ok", result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "forget failed" },
      { status: 502 },
    );
  }
}

