// Provider-agnostic LLM client. Calls an OpenAI-compatible Chat Completions API
// via fetch (no SDK dependency) so we can swap providers with OPENAI_BASE_URL.

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5.5";

export function llmConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function baseUrl(): string {
  return (process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function model(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

/** GPT-5 / o-series reasoning models reject custom temperature (only default 1). */
function supportsTemperature(modelName: string): boolean {
  return !/^(gpt-5|o1|o3|o4)/i.test(modelName);
}

export class LLMError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LLMError";
    this.status = status;
  }
}

type CallOptions = {
  json?: boolean;
  temperature?: number;
};

/** Single call to the chat completions endpoint. Returns the raw assistant string. */
export async function callLLM(
  messages: LLMMessage[],
  { json = false, temperature = 0.9 }: CallOptions = {},
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new LLMError("OPENAI_API_KEY is not set.", 500);
  }

  const modelName = model();
  const body: Record<string, unknown> = {
    model: modelName,
    messages,
  };
  // Reasoning models (gpt-5.5, etc.) only accept the default temperature — sending
  // 0.9 would 400. Older chat models still get the creative roast setting.
  if (supportsTemperature(modelName)) {
    body.temperature = temperature;
  }
  if (json) {
    body.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new LLMError(`Failed to reach LLM provider: ${(e as Error).message}`, 502);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new LLMError(
      `LLM provider returned ${res.status}: ${detail.slice(0, 500)}`,
      res.status,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new LLMError("LLM returned an empty response.", 502);
  }
  return content;
}

/**
 * Extracts a JSON object from a model response, tolerating markdown fences
 * or stray prose around the object.
 */
export function extractJSON(raw: string): unknown {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new SyntaxError("No JSON object found in model output.");
  }
}
