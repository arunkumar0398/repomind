import { beforeEach, describe, expect, it, vi } from "vitest";

const { forgetDataset } = vi.hoisted(() => ({
  forgetDataset: vi.fn(),
}));

vi.mock("@/lib/cognee/client", () => ({
  forgetDataset,
}));

describe("/api/memory/forget", () => {
  beforeEach(() => {
    forgetDataset.mockReset();
  });

  it("returns live true when Cognee forget succeeds", async () => {
    forgetDataset.mockResolvedValue({ status: "deleted" });
    const { POST } = await import("./route");

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.live).toBe(true);
    expect(body.status).toBe("ok");
    expect(body.message).toContain("cleared");
  });

  it("returns 502 when Cognee forget fails", async () => {
    forgetDataset.mockRejectedValue(new Error("service unavailable"));
    const { POST } = await import("./route");

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.live).toBe(false);
    expect(body.status).toBe("error");
    expect(body.error).toBe("service unavailable");
  });
});
