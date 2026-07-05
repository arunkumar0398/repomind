import { appConfig, REPO_FULL_NAME } from "@/lib/config";
import { checkCogneeHealth, getDatasetOverview } from "@/lib/cognee/client";
import { getSeedIssues } from "@/lib/issues/github";

export async function GET() {
  const [health, datasetOverview] = await Promise.all([checkCogneeHealth(), getDatasetOverview()]);
  const curatedIssueCount = getSeedIssues().length;
  return Response.json({
    repo: REPO_FULL_NAME,
    dataset: appConfig.dataset,
    cognee: health,
    seedIssueCount: curatedIssueCount,
    curatedIssueCount,
    datasetExists: datasetOverview.exists,
    datasetStatus: datasetOverview.status || (datasetOverview.exists ? "status unavailable" : "not found"),
    datasetId: datasetOverview.id,
    datasetError: datasetOverview.error,
  });
}
