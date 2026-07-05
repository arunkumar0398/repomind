import { beforeEach, describe, expect, it, vi } from "vitest";

const { forgetDataset, verifyApiKey } = vi.hoisted(() => ({
  forgetDataset: vi.fn(),
  verifyApiKey: vi.fn(),
}));

vi.mock("@/lib/cognee/client", () => ({
  forgetDataset,
}));

vi.mock("@/lib/auth", () => ({
  verifyApiKey,
}));

function makePostRequest() {
  return new Request("http://localhost/api/memory/forget", { method: "POST" });
}

describe("/api/memory/forget", () => {
  beforeEach(() => {
    forgetDataset.mockReset();
    verifyApiKey.mockReset();
    verifyApiKey.mockReturnValue({ ok: true });
  });

  it("returns live true when Cognee forget succeeds", async () => {
    forgetDataset.mockResolvedValue({ status: "deleted" });
    const { POST } = await import("./route");

    const response = await POST(makePostRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.live).toBe(true);
    expect(body.status).toBe("ok");
    expect(body.message).toContain("cleared");
  });

  it("returns 502 when Cognee forget fails", async () => {
    forgetDataset.mockRejectedValue(new Error("service unavailable"));
    const { POST } = await import("./route");

    const response = await POST(makePostRequest());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.live).toBe(false);
    expect(body.status).toBe("error");
    expect(body.error).toBe("service unavailable");
  });

  it("returns 401 when API key is invalid", async () => {
    verifyApiKey.mockReturnValue({ ok: false, error: "Invalid key" });
    const { POST } = await import("./route");

    const response = await POST(makePostRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid key");
    expect(forgetDataset).not.toHaveBeenCalled();
  });
});
