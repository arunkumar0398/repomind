import { appConfig } from "@/lib/config";

export type CogneeRecallResult = unknown;

function cogneeHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (appConfig.cogneeApiKey) headers["X-Api-Key"] = appConfig.cogneeApiKey;
  return headers;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.error || body.detail || body.message || `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

export async function checkCogneeHealth(): Promise<{ connected: boolean; detail: string }> {
  try {
    const response = await fetch(`${appConfig.cogneeBaseUrl}/health`, {
      headers: cogneeHeaders(false),
      cache: "no-store",
    });
    return {
      connected: response.ok,
      detail: response.ok ? "connected" : await readError(response),
    };
  } catch (error) {
    return {
      connected: false,
      detail: error instanceof Error ? error.message : "Cognee unavailable",
    };
  }
}

export async function rememberIssueText(text: string, fileName: string): Promise<unknown> {
  const blob = new Blob([text], { type: "text/plain" });
  const form = new FormData();
  form.append("datasetName", appConfig.dataset);
  form.append("data", blob, fileName);
  form.append("node_set", "project_docs");
  form.append("run_in_background", "true");

  const response = await fetch(`${appConfig.cogneeBaseUrl}/api/v1/remember`, {
    method: "POST",
    headers: cogneeHeaders(false),
    body: form,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function recallIssueDraft(query: string, topK = 8): Promise<CogneeRecallResult[]> {
  const response = await fetch(`${appConfig.cogneeBaseUrl}/api/v1/recall`, {
    method: "POST",
    headers: cogneeHeaders(),
    body: JSON.stringify({
      query,
      datasets: [appConfig.dataset],
      search_type: "CHUNKS",
      top_k: topK,
      only_context: false,
      scope: ["graph"],
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const body = await response.json();
  return Array.isArray(body) ? body : [body];
}

export async function improveDataset(): Promise<unknown> {
  const response = await fetch(`${appConfig.cogneeBaseUrl}/api/v1/improve`, {
    method: "POST",
    headers: cogneeHeaders(),
    body: JSON.stringify({ dataset_name: appConfig.dataset }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function forgetDataset(): Promise<unknown> {
  const response = await fetch(`${appConfig.cogneeBaseUrl}/api/v1/forget`, {
    method: "POST",
    headers: cogneeHeaders(),
    body: JSON.stringify({ dataset: appConfig.dataset }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
