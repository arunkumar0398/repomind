import { beforeEach, describe, expect, it, vi } from "vitest";

const improveDataset = vi.fn();

vi.mock("@/lib/cognee/client", () => ({
  improveDataset,
}));

describe("/api/memory/improve", () => {
  beforeEach(() => {
    improveDataset.mockReset();
  });

  it("reports live true only when Cognee accepts improve", async () => {
    improveDataset.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.live).toBe(true);
    expect(body.message).toContain("Cognee improve accepted");
  });

  it("reports degraded improve without claiming memory was updated", async () => {
    improveDataset.mockRejectedValue(new Error("not available"));
    const { POST } = await import("./route");

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.live).toBe(false);
    expect(body.status).toBe("degraded");
    expect(body.message).not.toContain("Memory updated");
    expect(body.error).toBe("not available");
  });
});
