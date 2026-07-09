import { forgetDataset } from "@/lib/cognee/client";
import { verifyApiKey } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = verifyApiKey(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

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
