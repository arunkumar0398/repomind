export type Verdict = "likely_duplicate" | "related" | "new_issue";

export type EvidenceIssue = {
  number: number;
  title: string;
  state: string;
  labels: string[];
  url: string;
  excerpt: string;
};

export type TriageResponse = {
  verdict: Verdict;
  why: string;
  suggestedAction: string;
  draftReply: string;
  evidence: EvidenceIssue[];
  recallUsed: boolean;
  warnings: string[];
};

