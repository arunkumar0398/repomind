import { forgetDataset } from "@/lib/cognee/client";

export async function POST() {
  try {
    const result = await forgetDataset();
    return Response.json({ live: true, status: "ok", message: "Cognee dataset cleared.", result });
  } catch (error) {
    return Response.json(
      {
        live: false,
        status: "error",
        message: "Cognee dataset could not be cleared.",
        error: error instanceof Error ? error.message : "forget failed",
      },
      { status: 502 },
    );
  }
}
