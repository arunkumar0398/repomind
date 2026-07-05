import { beforeEach, describe, expect, it, vi } from "vitest";

const recallIssueDraft = vi.fn();

vi.mock("@/lib/cognee/client", () => ({
  recallIssueDraft,
}));

describe("/api/triage", () => {
  beforeEach(() => {
    recallIssueDraft.mockReset();
  });

  it("returns live Cognee proof metadata when recall returns known issue ids", async () => {
    recallIssueDraft.mockResolvedValue(["Live CHUNKS evidence for #3774"]);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/triage", {
        method: "POST",
        body: JSON.stringify({
          title: "LLMConfig cannot be imported",
          body: "Import fails from cognee.api.v1.config.",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.recallUsed).toBe(true);
    expect(body.fallbackUsed).toBe(false);
    expect(body.recallSource).toBe("cognee");
    expect(body.recallMode).toBe("CHUNKS");
    expect(body.topRecalledNumbers).toEqual([3774]);
    expect(body.evidence[0].source).toBe("cognee");
  });

  it("uses seed fallback when Cognee recall fails", async () => {
    recallIssueDraft.mockRejectedValue(new Error("cloud unavailable"));
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/triage", {
        method: "POST",
        body: JSON.stringify({
          title: "API router error responses inconsistent",
          body: "improve forget recall return different bodies",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.recallUsed).toBe(false);
    expect(body.fallbackUsed).toBe(true);
    expect(body.recallSource).toBe("seed_fallback");
    expect(body.warnings[0]).toContain("Cognee recall unavailable");
    expect(body.evidence[0].source).toBe("seed_fallback");
  });

  it("honors disabled fallback after forget", async () => {
    recallIssueDraft.mockResolvedValue([]);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/triage", {
        method: "POST",
        body: JSON.stringify({
          title: "LLMConfig cannot be imported",
          body: "Import fails from cognee.api.v1.config.",
          fallbackDisabled: true,
        }),
      }),
    );

    const body = await response.json();
    expect(body.recallSource).toBe("none");
    expect(body.fallbackUsed).toBe(false);
    expect(body.evidence).toEqual([]);
    expect(body.warnings[0]).toContain("Seed fallback disabled");
  });
});
