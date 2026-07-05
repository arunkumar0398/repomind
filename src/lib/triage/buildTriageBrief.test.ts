import { describe, expect, it } from "vitest";
import seedIssues from "@/data/seed-issues.json";
import type { RepoIssueMemory } from "@/lib/issues/types";
import { buildTriageBrief } from "./buildTriageBrief";
import { extractExcerpt } from "./extractExcerpt";

const corpus = seedIssues as RepoIssueMemory[];

describe("extractExcerpt", () => {
  it("returns a matched line for API paths and function terms", () => {
    const issue = corpus.find((item) => item.number === 3774)!;
    const excerpt = extractExcerpt(issue, "api.v1.config LLMConfig import");

    expect(excerpt).toContain("cognee.api.v1.config");
  });
});

describe("buildTriageBrief", () => {
  it("returns likely duplicate for LLMConfig evidence with #3774", () => {
    const brief = buildTriageBrief({
      title: "LLMConfig cannot be imported from cognee.api.v1.config",
      body: "ImportError when importing config.",
      recallResults: ["#3774"],
      corpus,
    });

    expect(brief.verdict).toBe("likely_duplicate");
    expect(brief.evidence[0].number).toBe(3774);
    expect(brief.draftReply).toContain("#3774");
  });

  it("returns duplicate or related for retry evidence with #3757", () => {
    const brief = buildTriageBrief({
      title: "DatabaseUnavailable retry inconsistent with Neo4jError",
      body: "deadlock_retry in neo4j_driver behaves differently.",
      recallResults: ["#3757"],
      corpus,
    });

    expect(["likely_duplicate", "related"]).toContain(brief.verdict);
    expect(brief.evidence[0].number).toBe(3757);
  });

  it("returns duplicate or related for router error evidence with #3748", () => {
    const brief = buildTriageBrief({
      title: "API router error responses inconsistent",
      body: "improve forget recall return different response bodies",
      recallResults: ["#3748"],
      corpus,
    });

    expect(["likely_duplicate", "related"]).toContain(brief.verdict);
    expect(brief.evidence[0].number).toBe(3748);
  });

  it("returns new issue with no evidence", () => {
    const brief = buildTriageBrief({
      title: "Completely new package idea",
      body: "No overlap with remembered corpus",
      recallResults: [],
      corpus: [],
    });

    expect(brief.verdict).toBe("new_issue");
    expect(brief.evidence).toEqual([]);
  });
});

