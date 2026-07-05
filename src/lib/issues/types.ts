export type RepoIssueMemory = {
  type: "github_issue";
  repo: "topoteretes/cognee";
  number: number;
  title: string;
  state: "open" | "closed";
  labels: string[];
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  comments: string[];
};

export type IngestResult = {
  source: "github" | "seed";
  dataset: string;
  count: number;
  issues: Array<Pick<RepoIssueMemory, "number" | "title" | "state" | "labels" | "url">>;
  remembered: number;
  errors: string[];
  lastIngestAt: string;
};

