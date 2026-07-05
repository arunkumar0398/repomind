import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkCogneeHealth, getDatasetOverview } = vi.hoisted(() => ({
  checkCogneeHealth: vi.fn(),
  getDatasetOverview: vi.fn(),
}));

vi.mock("@/lib/cognee/client", () => ({
  checkCogneeHealth,
  getDatasetOverview,
}));

describe("/api/status", () => {
  beforeEach(() => {
    checkCogneeHealth.mockReset();
    getDatasetOverview.mockReset();
  });

  it("includes Cognee connection and dataset processing fields", async () => {
    checkCogneeHealth.mockResolvedValue({ connected: true, detail: "connected" });
    getDatasetOverview.mockResolvedValue({
      exists: true,
      status: "DATASET_PROCESSING_COMPLETED",
      id: "dataset-id",
    });
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cognee.connected).toBe(true);
    expect(body.datasetExists).toBe(true);
    expect(body.datasetStatus).toBe("DATASET_PROCESSING_COMPLETED");
    expect(body.curatedIssueCount).toBeGreaterThan(0);
  });
});
