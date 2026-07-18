import type { Message, VerdictResult } from "./types";
import { callLLM, extractJSON, type LLMMessage } from "./llm";
import {
  ANALYZE_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  formatTranscript,
  formatVerdictContext,
} from "./prompt";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

function isFlagArray(value: unknown): value is VerdictResult["red_flags"] {
  return (
    Array.isArray(value) &&
    value.every(
      (f) =>
        !!f &&
        typeof f === "object" &&
        typeof (f as { flag: unknown }).flag === "string" &&
        typeof (f as { receipt: unknown }).receipt === "string",
    )
  );
}

/** Normalizes the optional deep_dive breakdown, dropping malformed sections. */
function parseDeepDive(value: unknown): VerdictResult["deep_dive"] {
  if (!Array.isArray(value)) return [];
  const sections: VerdictResult["deep_dive"] = [];
  for (const s of value) {
    if (!s || typeof s !== "object") continue;
    const title = (s as { title?: unknown }).title;
    const detail = (s as { detail?: unknown }).detail;
    if (typeof title === "string" && typeof detail === "string") {
      const t = title.trim();
      const d = detail.trim();
      if (t && d) sections.push({ title: t, detail: d });
    }
  }
  return sections;
}

/** Validates + normalizes raw model output into the locked VerdictResult contract. */
export function parseVerdict(raw: unknown): VerdictResult {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Model output was not an object.");
  }
  const o = raw as Record<string, unknown>;

  const score = Number(o.cooked_score);
  if (!Number.isFinite(score)) {
    throw new ValidationError("cooked_score is missing or not a number.");
  }
  if (typeof o.verdict !== "string" || o.verdict.trim() === "") {
    throw new ValidationError("verdict is missing.");
  }
  if (typeof o.delusion_level !== "string" || o.delusion_level.trim() === "") {
    throw new ValidationError("delusion_level is missing.");
  }
  if (typeof o.roast !== "string" || o.roast.trim() === "") {
    throw new ValidationError("roast is missing.");
  }
  if (!isFlagArray(o.red_flags)) {
    throw new ValidationError("red_flags is missing or malformed.");
  }
  if (!isFlagArray(o.green_flags)) {
    throw new ValidationError("green_flags is missing or malformed.");
  }

  const emoji =
    typeof o.verdict_emoji === "string" && o.verdict_emoji.trim() !== ""
      ? o.verdict_emoji.trim()
      : "🔥";

  return {
    cooked_score: Math.max(0, Math.min(100, Math.round(score))),
    verdict: o.verdict.trim(),
    delusion_level: o.delusion_level.trim(),
    roast: o.roast.trim(),
    red_flags: o.red_flags,
    green_flags: o.green_flags,
    verdict_emoji: emoji,
    deep_dive: parseDeepDive(o.deep_dive),
  };
}

/** Validates + cleans an incoming message array. Throws ValidationError if empty. */
export function parseMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) {
    throw new ValidationError("`messages` must be an array.");
  }
  const messages: Message[] = [];
  for (const m of raw) {
    if (
      m &&
      typeof m === "object" &&
      typeof (m as Message).sender === "string" &&
      typeof (m as Message).text === "string"
    ) {
      const text = (m as Message).text.trim();
      if (text === "") continue;
      const msg: Message = { sender: (m as Message).sender.trim() || "Unknown", text };
      const rawTime = (m as Message).time;
      if (typeof rawTime === "string" && rawTime.trim() !== "") {
        msg.time = rawTime.trim();
      }
      messages.push(msg);
    }
  }
  if (messages.length === 0) {
    throw new ValidationError("`messages` is empty after cleaning.");
  }
  return messages;
}

/** Validates a chat history array (drops malformed turns). */
export function parseChatTurns(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (t): t is ChatTurn =>
      !!t &&
      typeof t === "object" &&
      ((t as ChatTurn).role === "user" || (t as ChatTurn).role === "assistant") &&
      typeof (t as ChatTurn).content === "string",
  );
}

/**
 * Calls the model to analyze a conversation, validates the JSON, and retries
 * once on malformed output. Returns a validated VerdictResult.
 */
export async function analyzeConversation(
  messages: Message[],
  userSender: string,
): Promise<VerdictResult> {
  const userPrompt = formatTranscript(messages, userSender);

  const attempt = async (nudge?: string): Promise<VerdictResult> => {
    const llmMessages: LLMMessage[] = [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      ...(nudge ? [{ role: "system" as const, content: nudge }] : []),
      { role: "user", content: userPrompt },
    ];
    const raw = await callLLM(llmMessages, { json: true, temperature: 0.9 });
    return parseVerdict(extractJSON(raw));
  };

  try {
    return await attempt();
  } catch (e) {
    if (e instanceof ValidationError || e instanceof SyntaxError) {
      return attempt(
        "Your previous response was not valid JSON matching the schema. Respond again with ONLY the JSON object, all keys present, every flag with a real receipt quote.",
      );
    }
    throw e;
  }
}

/**
 * Continues the roast in follow-up chat mode with full context (original convo +
 * verdict + prior turns). Returns the assistant's plain-text reply.
 */
export async function continueChat(params: {
  messages: Message[];
  verdict: VerdictResult;
  chat: ChatTurn[];
  userSender: string;
}): Promise<string> {
  const { messages, verdict, chat, userSender } = params;
  const context = `${formatTranscript(messages, userSender)}\n\n${formatVerdictContext(
    verdict,
  )}`;

  const llmMessages: LLMMessage[] = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    { role: "system", content: context },
    ...chat.map((t) => ({ role: t.role, content: t.content })),
  ];

  const reply = await callLLM(llmMessages, { json: false, temperature: 0.95 });
  return reply.trim();
}
