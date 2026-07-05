import type { RepoIssueMemory } from "./types";

export function formatIssueMemory(issue: RepoIssueMemory): string {
  const labels = issue.labels.length ? issue.labels.join(", ") : "none";
  const comments = issue.comments.length
    ? issue.comments.map((comment, index) => `Comment ${index + 1}:\n${comment}`).join("\n\n")
    : "No selected comments.";

  return [
    `GitHub issue #${issue.number} in ${issue.repo}`,
    "",
    `Title: ${issue.title}`,
    `State: ${issue.state}`,
    `Labels: ${labels}`,
    `Author: ${issue.author}`,
    `URL: ${issue.url}`,
    `Created: ${issue.createdAt}`,
    `Updated: ${issue.updatedAt}`,
    "",
    "Body:",
    issue.body || "No issue body.",
    "",
    "Selected comments:",
    comments,
  ].join("\n");
}

