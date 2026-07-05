import { beforeEach, describe, expect, it, vi } from "vitest";

const { rememberIssueText, getDatasetOverview, fetchCuratedIssues } = vi.hoisted(() => ({
  rememberIssueText: vi.fn(),
  getDatasetOverview: vi.fn(),
  fetchCuratedIssues: vi.fn(),
}));

vi.mock("@/lib/cognee/client", () => ({
  rememberIssueText,
  getDatasetOverview,
}));

vi.mock("@/lib/issues/github", () => ({
  fetchCuratedIssues,
}));

vi.mock("@/lib/issues/formatIssueMemory", () => ({
  formatIssueMemory: vi.fn((issue: { number: number }) => `formatted-${issue.number}`),
}));

describe("/api/issues/ingest", () => {
  beforeEach(() => {
    rememberIssueText.mockReset();
    getDatasetOverview.mockReset();
    fetchCuratedIssues.mockReset();
  });

  it("returns remembered count and processingPending when dataset is not terminal", async () => {
    fetchCuratedIssues.mockResolvedValue({
      source: "github",
      issues: [
        { number: 1, title: "Bug A", state: "open", labels: ["bug"], url: "https://example.com/1" },
        { number: 2, title: "Bug B", state: "closed", labels: [], url: "https://example.com/2" },
      ],
    });
    rememberIssueText.mockResolvedValue({ ok: true });
    getDatasetOverview.mockResolvedValue({ exists: true, status: "DATASET_PROCESSING" });

    const { POST } = await import("./route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.remembered).toBe(2);
    expect(body.count).toBe(2);
    expect(body.processingPending).toBe(true);
    expect(body.datasetStatus).toBe("DATASET_PROCESSING");
    expect(body.source).toBe("github");
  });

  it("returns processingPending false when dataset is terminal", async () => {
    fetchCuratedIssues.mockResolvedValue({
      source: "seed",
      issues: [{ number: 10, title: "Bug X", state: "open", labels: [], url: "https://example.com/10" }],
    });
    rememberIssueText.mockResolvedValue({ ok: true });
    getDatasetOverview.mockResolvedValue({ exists: true, status: "DATASET_PROCESSING_COMPLETED" });

    const { POST } = await import("./route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.remembered).toBe(1);
    expect(body.processingPending).toBe(false);
    expect(body.datasetStatus).toBe("DATASET_PROCESSING_COMPLETED");
  });

  it("sets processingPending true when getDatasetOverview fails and issues were remembered", async () => {
    fetchCuratedIssues.mockResolvedValue({
      source: "github",
      issues: [{ number: 5, title: "Bug Y", state: "open", labels: [], url: "https://example.com/5" }],
    });
    rememberIssueText.mockResolvedValue({ ok: true });
    getDatasetOverview.mockRejectedValue(new Error("connection refused"));

    const { POST } = await import("./route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.remembered).toBe(1);
    expect(body.processingPending).toBe(true);
    expect(body.datasetStatus).toBe("unknown");
  });

  it("returns 207 when all issues fail to remember", async () => {
    fetchCuratedIssues.mockResolvedValue({
      source: "github",
      issues: [
        { number: 1, title: "A", state: "open", labels: [], url: "https://example.com/1" },
        { number: 2, title: "B", state: "open", labels: [], url: "https://example.com/2" },
      ],
    });
    rememberIssueText.mockRejectedValue(new Error("cognee down"));
    getDatasetOverview.mockResolvedValue({ exists: false });

    const { POST } = await import("./route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(207);
    expect(body.remembered).toBe(0);
    expect(body.errors).toHaveLength(2);
  });

  it("passes background=false to rememberIssueText for synchronous processing", async () => {
    fetchCuratedIssues.mockResolvedValue({
      source: "seed",
      issues: [{ number: 3, title: "C", state: "open", labels: [], url: "https://example.com/3" }],
    });
    rememberIssueText.mockResolvedValue({ ok: true });
    getDatasetOverview.mockResolvedValue({ exists: true, status: "DATASET_PROCESSING_COMPLETED" });

    const { POST } = await import("./route");
    await POST();

    expect(rememberIssueText).toHaveBeenCalledWith(
      expect.any(String),
      "cognee-issue-3.txt",
      false,
    );
  });
});
