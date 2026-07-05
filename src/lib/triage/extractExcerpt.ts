import type { RepoIssueMemory } from "@/lib/issues/types";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "issue",
  "error",
  "fails",
  "return",
  "returns",
]);

export function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .match(/[a-z0-9_./-]{3,}/g)
        ?.filter((token) => !STOP_WORDS.has(token)) ?? [],
    ),
  );
}

export function extractExcerpt(issue: RepoIssueMemory, query: string): string {
  const haystack = [issue.body, ...issue.comments].filter(Boolean).join("\n");
  const chunks = haystack
    .split(/(?<=[.!?])\s+|\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const terms = tokenize(query);

  const scored = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    const score = terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0);
    return { chunk, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0]?.chunk || chunks[0] || issue.body;
  return best.length > 220 ? `${best.slice(0, 217).trim()}...` : best;
}

