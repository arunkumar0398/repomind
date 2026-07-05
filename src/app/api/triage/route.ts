import { z } from "zod";
import { recallIssueDraft } from "@/lib/cognee/client";
import { getSeedIssues } from "@/lib/issues/github";
import { buildTriageBrief } from "@/lib/triage/buildTriageBrief";

const TriageRequest = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const parsed = TriageRequest.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Issue title and body are required." }, { status: 400 });
  }

  const query = `${parsed.data.title}\n${parsed.data.body}`;
  const warnings: string[] = [];
  let recallResults: unknown[] = [];

  try {
    recallResults = await recallIssueDraft(query);
  } catch (error) {
    warnings.push(
      `Cognee recall unavailable; using seed evidence fallback: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }

  const response = buildTriageBrief({
    title: parsed.data.title,
    body: parsed.data.body,
    recallResults,
    corpus: getSeedIssues(),
  });

  return Response.json({ ...response, warnings: [...response.warnings, ...warnings] });
}

