import type { AnalyzeRequest, VerdictResult } from "./types";

export class AnalyzeError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

/** POST /api/analyze — hands off to The Brain (Teammate 2). */
export async function analyzeConversation(
  request: AnalyzeRequest,
): Promise<VerdictResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AnalyzeError(
      body || `Analysis failed (${response.status})`,
      response.status,
    );
  }

  return response.json() as Promise<VerdictResult>;
}
