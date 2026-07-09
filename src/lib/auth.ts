const API_KEY = process.env.REPOMIND_API_KEY || "";

export function verifyApiKey(request: Request): { ok: boolean; error?: string } {
  if (!API_KEY) return { ok: true };
  const provided = request.headers.get("x-api-key");
  if (!provided || provided !== API_KEY) {
    return { ok: false, error: "Missing or invalid x-api-key header." };
  }
  return { ok: true };
}
