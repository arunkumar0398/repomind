import { appConfig } from "@/lib/config";
import { rememberIssueText, getDatasetOverview } from "@/lib/cognee/client";
import { fetchCuratedIssues } from "@/lib/issues/github";
import { formatIssueMemory } from "@/lib/issues/formatIssueMemory";
import type { IngestResult } from "@/lib/issues/types";

const TERMINAL_STATUSES = ["DATASET_PROCESSING_COMPLETED", "DATASET_PROCESSING_ERROR"];

export async function POST() {
  const { source, issues } = await fetchCuratedIssues();
  const errors: string[] = [];
  let remembered = 0;

  for (const issue of issues) {
    try {
      await rememberIssueText(formatIssueMemory(issue), `cognee-issue-${issue.number}.txt`, false);
      remembered += 1;
    } catch (error) {
      errors.push(`#${issue.number}: ${error instanceof Error ? error.message : "remember failed"}`);
    }
  }

  let datasetStatus = "unknown";
  let processingPending = false;
  try {
    const datasetOverview = await getDatasetOverview();
    datasetStatus = datasetOverview.status || "unknown";
    processingPending = !TERMINAL_STATUSES.includes(datasetStatus);
  } catch {
    processingPending = remembered > 0;
  }

  const response: IngestResult = {
    source,
    dataset: appConfig.dataset,
    count: issues.length,
    issues: issues.map(({ number, title, state, labels, url }) => ({
      number,
      title,
      state,
      labels,
      url,
    })),
    remembered,
    errors,
    lastIngestAt: new Date().toISOString(),
    processingPending,
    datasetStatus,
  };

  return Response.json(response, { status: errors.length === issues.length ? 207 : 200 });
}

