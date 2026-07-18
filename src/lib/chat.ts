import type { Message, VerdictResult } from "./types";

/** One turn in the follow-up chat. */
export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

/** POST /api/chat request body. */
export type ChatRequest = {
  /** The original conversation that was analyzed. */
  messages: Message[];
  /** Which sender is the user (same value passed to /api/analyze). */
  userSender: string;
  /** The verdict returned by /api/analyze (kept as context). */
  verdict: VerdictResult;
  /** Prior follow-up turns, oldest → newest. */
  chat: ChatTurn[];
  /** Latest user message (appended to `chat` server-side). */
  message: string;
};

export type ChatReply = {
  reply: string;
};

export class ChatError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ChatError";
  }
}

/**
 * Sends a follow-up message to the roaster. Wire this to the Chat UI (Teammate D).
 * Keep the returned reply in your `chat` history and pass it back next call.
 */
export async function sendChatMessage(request: ChatRequest): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ChatError(body || `Chat failed (${response.status})`, response.status);
  }

  const data = (await response.json()) as ChatReply;
  return data.reply;
}
