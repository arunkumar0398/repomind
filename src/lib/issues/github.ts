import { Octokit } from "@octokit/rest";
import { appConfig, REPO_NAME, REPO_OWNER } from "@/lib/config";
import { curatedIssueNumbers } from "./curatedIssueNumbers";
import seedIssues from "@/data/seed-issues.json";
import type { RepoIssueMemory } from "./types";

type IssueApiResponse = Awaited<ReturnType<Octokit["issues"]["get"]>>["data"];
type CommentApiResponse = Awaited<ReturnType<Octokit["issues"]["listComments"]>>["data"][number];

function toIssueMemory(issue: IssueApiResponse, comments: CommentApiResponse[]): RepoIssueMemory {
  return {
    type: "github_issue",
    repo: "topoteretes/cognee",
    number: issue.number,
    title: issue.title,
    state: issue.state === "closed" ? "closed" : "open",
    labels: issue.labels
      .map((label) => (typeof label === "string" ? label : label.name ?? ""))
      .filter(Boolean),
    author: issue.user?.login ?? "unknown",
    url: issue.html_url,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    body: issue.body ?? "",
    comments: comments.slice(0, 3).map((comment) => comment.body ?? "").filter(Boolean),
  };
}

export function getSeedIssues(): RepoIssueMemory[] {
  return seedIssues as RepoIssueMemory[];
}

export async function fetchCuratedIssues(): Promise<{ source: "github" | "seed"; issues: RepoIssueMemory[] }> {
  const octokit = new Octokit({
    auth: appConfig.githubToken || undefined,
    userAgent: "repomind-hackathon",
  });

  try {
    const issues = await Promise.all(
      curatedIssueNumbers.map(async (issue_number) => {
        const [issueResponse, commentsResponse] = await Promise.all([
          octokit.issues.get({ owner: REPO_OWNER, repo: REPO_NAME, issue_number }),
          octokit.issues.listComments({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            issue_number,
            per_page: 3,
          }),
        ]);
        return toIssueMemory(issueResponse.data, commentsResponse.data);
      }),
    );

    return { source: "github", issues };
  } catch {
    return { source: "seed", issues: getSeedIssues() };
  }
}
