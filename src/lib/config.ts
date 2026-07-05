export const REPO_OWNER = "topoteretes";
export const REPO_NAME = "cognee";
export const REPO_FULL_NAME = `${REPO_OWNER}/${REPO_NAME}`;

export const appConfig = {
  cogneeBaseUrl: process.env.COGNEE_BASE_URL || "http://localhost:8000",
  cogneeApiKey: process.env.COGNEE_API_KEY || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  dataset: process.env.REPOMIND_DATASET || "repomind-topoteretes-cognee",
};

export const demoPresets = [
  {
    id: "llm-config",
    label: "LLMConfig import fails",
    title: "LLMConfig cannot be imported from cognee.api.v1.config",
    body:
      "Trying to configure an LLM provider fails because from cognee.api.v1.config import LLMConfig raises an ImportError.",
  },
  {
    id: "deadlock-retry",
    label: "deadlock retry inconsistent",
    title: "DatabaseUnavailable retries fewer times than Neo4jError",
    body:
      "The deadlock_retry decorator handles DatabaseUnavailable differently from Neo4jError and appears to retry fewer times in neo4j_driver.",
  },
  {
    id: "router-errors",
    label: "API router error responses",
    title: "Improve, forget, and recall routers return inconsistent error bodies",
    body:
      "The lifecycle API routers for improve, forget, and recall return different error response shapes and status codes.",
  },
];

