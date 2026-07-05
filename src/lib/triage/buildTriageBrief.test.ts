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
    expect(brief.evidence[0].source).toBe("cognee");
    expect(brief.recallSource).toBe("cognee");
    expect(brief.recallMode).toBe("CHUNKS");
    expect(brief.recallUsed).toBe(true);
    expect(brief.fallbackUsed).toBe(false);
    expect(brief.topRecalledNumbers).toEqual([3774]);
    expect(brief.draftReply).toContain("#3774");
  });

  it("preserves live Cognee recall order without demo boosts", () => {
    const brief = buildTriageBrief({
      title: "LLMConfig import fails",
      body: "This query would normally boost #3774 in seed fallback.",
      recallResults: ["Cognee CHUNKS recalled #3757 first, then #3774"],
      corpus,
    });

    expect(brief.evidence.map((issue) => issue.number).slice(0, 2)).toEqual([3757, 3774]);
    expect(brief.evidence.every((issue) => issue.source === "cognee")).toBe(true);
    expect(brief.fallbackUsed).toBe(false);
  });

  it("applies demo fallback boosts only when live recall has no known issue ids", () => {
    const brief = buildTriageBrief({
      title: "LLMConfig cannot be imported from cognee.api.v1.config",
      body: "ImportError when importing config.",
      recallResults: ["Cognee returned context without a known issue number"],
      corpus,
    });

    expect(brief.evidence[0].number).toBe(3774);
    expect(brief.evidence[0].source).toBe("seed_fallback");
    expect(brief.recallSource).toBe("seed_fallback");
    expect(brief.recallUsed).toBe(false);
    expect(brief.fallbackUsed).toBe(true);
  });

  it("returns no seed evidence when fallback is disabled after forget", () => {
    const brief = buildTriageBrief({
      title: "LLMConfig cannot be imported from cognee.api.v1.config",
      body: "ImportError when importing config.",
      recallResults: [],
      corpus,
      fallbackDisabled: true,
    });

    expect(brief.verdict).toBe("new_issue");
    expect(brief.evidence).toEqual([]);
    expect(brief.recallSource).toBe("none");
    expect(brief.fallbackUsed).toBe(false);
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
    expect(brief.graphProof).toContain("retry behavior -> neo4j_driver -> #3757");
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
