import { appConfig, REPO_FULL_NAME } from "@/lib/config";
import { checkCogneeHealth } from "@/lib/cognee/client";
import { getSeedIssues } from "@/lib/issues/github";

export async function GET() {
  const health = await checkCogneeHealth();
  return Response.json({
    repo: REPO_FULL_NAME,
    dataset: appConfig.dataset,
    cognee: health,
    seedIssueCount: getSeedIssues().length,
  });
}

