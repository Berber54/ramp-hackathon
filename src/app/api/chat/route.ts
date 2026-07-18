import { NextResponse } from "next/server";
import {
  continueChat,
  parseChatTurns,
  parseMessages,
  parseVerdict,
  type ChatTurn,
} from "@/lib/brain";
import { llmConfigured, LLMError } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    messages: rawMessages,
    verdict: rawVerdict,
    chat: rawChat,
    message,
    userSender,
  } = (body ?? {}) as {
    messages?: unknown;
    verdict?: unknown;
    chat?: unknown;
    message?: unknown;
    userSender?: unknown;
  };
  const who = typeof userSender === "string" ? userSender.trim() : "";

  let messages;
  let verdict;
  try {
    messages = parseMessages(rawMessages);
    verdict = parseVerdict(rawVerdict);
  } catch (e) {
    return NextResponse.json(
      { error: `Missing context: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  const chat: ChatTurn[] = parseChatTurns(rawChat);
  if (typeof message === "string" && message.trim() !== "") {
    chat.push({ role: "user", content: message.trim() });
  }
  if (chat.length === 0 || chat[chat.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "No user message to respond to." },
      { status: 400 },
    );
  }

  if (!llmConfigured()) {
    return NextResponse.json(
      {
        reply:
          "(No LLM key set, so I'm running on vibes — but based on that convo? Still cooked. Set OPENAI_API_KEY to hear my full unfiltered take.)",
      },
      { headers: { "x-delulu-source": "mock" } },
    );
  }

  try {
    const reply = await continueChat({ messages, verdict, chat, userSender: who });
    return NextResponse.json({ reply }, { headers: { "x-delulu-source": "openai" } });
  } catch (e) {
    if (e instanceof LLMError) {
      return NextResponse.json(
        { error: "The brain glitched. Try again.", detail: e.message },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Chat failed.", detail: (e as Error).message },
      { status: 500 },
    );
  }
}
