"use client";

import { useEffect, useRef, useState } from "react";
import { ChatError, sendChatMessage, type ChatTurn } from "@/lib/chat";
import { getScoreTier } from "@/lib/verdict-theme";
import type { Message, VerdictResult } from "@/lib/types";

type ChatPanelProps = {
  verdict: VerdictResult;
  messages: Message[];
  userSender: string;
  /** Back to the verdict card. */
  onBack: () => void;
};

/** Demo-friendly openers so the crowd sees the roaster react live. */
const QUICK_REPLIES = [
  "but they were just busy 🥺",
  "should I text them again?",
  "be honest — is there any hope?",
];

export function ChatPanel({ verdict, messages, userSender, onBack }: ChatPanelProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = getScoreTier(verdict.cooked_score);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, isSending]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || isSending) return;

    setError(null);
    setInput("");

    const history = turns;
    const userTurn: ChatTurn = { role: "user", content: text };
    setTurns([...history, userTurn]);
    setIsSending(true);

    try {
      const reply = await sendChatMessage({
        messages,
        userSender,
        verdict,
        chat: history,
        message: text,
      });
      setTurns((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err instanceof ChatError ? err.message : "The roaster ghosted you. Try again.";
      setError(message);
      // Roll the failed user turn back so they can retry cleanly.
      setTurns(history);
      setInput(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
        >
          ← Back to verdict
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Delulu Detector
        </span>
      </div>

      {/* Verdict recap so the chat has visible context */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-sm">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold"
          style={{ backgroundColor: tier.colorSoft, color: tier.color }}
        >
          {verdict.cooked_score}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-100">
            {verdict.verdict_emoji} {verdict.verdict}
          </p>
          <p className="text-xs text-zinc-400">
            {verdict.delusion_level} · keep the receipts coming
          </p>
        </div>
      </div>

      {/* Message stream */}
      <div
        ref={scrollRef}
        className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-zinc-900/60 p-4"
      >
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-2.5 text-[15px] leading-relaxed text-zinc-100 shadow-sm ring-1 ring-zinc-700">
            Alright, I read the whole thing. Ask me anything about this situationship —
            I&apos;ve still got the receipts. 🔥
          </div>
        </div>

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-orange-500 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
                {turn.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-2.5 text-[15px] leading-relaxed text-zinc-100 shadow-sm ring-1 ring-zinc-700">
                {turn.content}
              </div>
            </div>
          ),
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3 shadow-sm ring-1 ring-zinc-700">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-950/50 px-4 py-2.5 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              disabled={isSending}
              className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something to the roaster…"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-[15px] text-zinc-100 shadow-sm outline-none ring-orange-500 placeholder:text-zinc-600 focus:ring-2"
          aria-label="Message the roaster"
        />
        <button
          type="submit"
          disabled={isSending || input.trim() === ""}
          className="rounded-xl bg-orange-500 px-5 py-3 text-base font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-zinc-500"
      style={{ animationDelay: delay }}
    />
  );
}
