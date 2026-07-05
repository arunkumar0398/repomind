export type Verdict = "likely_duplicate" | "related" | "new_issue";
export type RecallSource = "cognee" | "seed_fallback" | "none";
export type RecallMode = "CHUNKS";
export type EvidenceSource = "cognee" | "seed_fallback";

export type EvidenceIssue = {
  number: number;
  title: string;
  state: string;
  labels: string[];
  url: string;
  excerpt: string;
  source: EvidenceSource;
};

export type TriageResponse = {
  verdict: Verdict;
  why: string;
  suggestedAction: string;
  draftReply: string;
  evidence: EvidenceIssue[];
  recallUsed: boolean;
  recallSource: RecallSource;
  recallMode: RecallMode;
  topRecalledNumbers: number[];
  fallbackUsed: boolean;
  graphProof?: string;
  warnings: string[];
};
