import { describe, expect, it } from "vitest";
import { formatIssueMemory } from "./formatIssueMemory";
import seedIssues from "@/data/seed-issues.json";
import type { RepoIssueMemory } from "./types";

describe("formatIssueMemory", () => {
  it("includes issue number, title, url, labels, body, and comments", () => {
    const issue = (seedIssues as RepoIssueMemory[]).find((item) => item.number === 3774);
    expect(issue).toBeDefined();

    const text = formatIssueMemory(issue!);

    expect(text).toContain("GitHub issue #3774");
    expect(text).toContain("[Bug]: LLMConfig cannot be imported");
    expect(text).toContain("https://github.com/topoteretes/cognee/issues/3774");
    expect(text).toContain("Labels: bug");
    expect(text).toContain("LLMConfig cannot be imported");
    expect(text).toContain("Proof of bug");
  });
});

