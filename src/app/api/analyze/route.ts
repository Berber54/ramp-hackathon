import { NextResponse } from "next/server";
import {
  analyzeConversation,
  parseMessages,
  ValidationError,
} from "@/lib/brain";
import { llmConfigured, LLMError } from "@/lib/llm";
import { pickMockForConversation } from "@/lib/mock";

// Never cache, and never persist: each request is analyzed and dropped.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { messages: rawMessages, userSender } = (body ?? {}) as {
    messages?: unknown;
    userSender?: unknown;
  };
  const who = typeof userSender === "string" ? userSender.trim() : "";

  let messages;
  try {
    messages = parseMessages(rawMessages);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Dev fallback: no key → return a plausible mock so the UI still works end-to-end.
  if (!llmConfigured()) {
    const verdict = pickMockForConversation(messages, who);
    return NextResponse.json(verdict, { headers: { "x-delulu-source": "mock" } });
  }

  try {
    const verdict = await analyzeConversation(messages, who);
    return NextResponse.json(verdict, { headers: { "x-delulu-source": "openai" } });
  } catch (e) {
    if (e instanceof LLMError) {
      return NextResponse.json(
        { error: "The brain glitched. Try again.", detail: e.message },
        { status: e.status && e.status >= 500 ? 502 : (e.status ?? 500) },
      );
    }
    if (e instanceof ValidationError || e instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Could not produce a valid verdict. Try again.", detail: (e as Error).message },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Unexpected error.", detail: (e as Error).message },
      { status: 500 },
    );
  }
}
