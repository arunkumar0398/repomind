import { beforeEach, describe, expect, it, vi } from "vitest";

const { improveDataset, verifyApiKey } = vi.hoisted(() => ({
  improveDataset: vi.fn(),
  verifyApiKey: vi.fn(),
}));

vi.mock("@/lib/cognee/client", () => ({
  improveDataset,
}));

vi.mock("@/lib/auth", () => ({
  verifyApiKey,
}));

describe("/api/memory/improve", () => {
  beforeEach(() => {
    improveDataset.mockReset();
    verifyApiKey.mockReset();
    verifyApiKey.mockReturnValue({ ok: true });
  });

  function makeRequest(body?: unknown) {
    return new Request("http://localhost/api/memory/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  it("reports live true only when Cognee accepts improve", async () => {
    improveDataset.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.live).toBe(true);
    expect(body.message).toContain("Cognee improve accepted");
  });

  it("reports degraded improve without claiming memory was updated", async () => {
    improveDataset.mockRejectedValue(new Error("not available"));
    const { POST } = await import("./route");

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.live).toBe(false);
    expect(body.status).toBe("degraded");
    expect(body.message).not.toContain("Memory updated");
    expect(body.error).toBe("not available");
  });

  it("returns 401 when API key is invalid", async () => {
    verifyApiKey.mockReturnValue({ ok: false, error: "Invalid key" });
    const { POST } = await import("./route");

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid key");
  });
});
