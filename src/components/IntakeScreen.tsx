"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeConversation, AnalyzeError } from "@/lib/analyze";
import { DEMO_CONVOS } from "@/lib/demo-convos";
import { extractSenders, parsePastedConversation } from "@/lib/parse-paste";
import type { AnalyzeRequest, Message, VerdictResult } from "@/lib/types";

export type IntakeScreenProps = {
  /** Called when analysis succeeds — hand off to The Reveal (Teammate 3). */
  onVerdict: (
    verdict: VerdictResult,
    context: { messages: Message[]; userSender: string },
  ) => void;
};

type InputMode = "paste" | "demo";

/** base64url → UTF-8 string. Returns null on malformed input. */
function decodeBase64Url(value: string): string | null {
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function IntakeScreen({ onVerdict }: IntakeScreenProps) {
  const [rawText, setRawText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // The user's side is always labelled "You" — the extension tags it and the
  // demo convos follow suit — so we don't ask. Fall back to the first sender
  // for the rare manual paste that doesn't use "You".
  const senders = useMemo(() => extractSenders(messages), [messages]);
  const userSender = useMemo(
    () => (senders.includes("You") ? "You" : senders[0] ?? ""),
    [senders],
  );

  const applyMessages = useCallback((next: Message[], mode: InputMode, demoId?: string) => {
    setMessages(next);
    setInputMode(mode);
    setActiveDemoId(demoId ?? null);
    setParseError(null);
    setAnalyzeError(null);
  }, []);

  // Import handoff: the Chrome extension opens this app with the scraped chat in
  // the URL (`?convo=<base64url>`). Decode it and prefill, then strip the query
  // so a refresh doesn't re-import. The user's side is already tagged "You".
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const convo = params.get("convo");
    if (!convo) return;

    const text = decodeBase64Url(convo);
    if (text === null) return;

    const parsed = parsePastedConversation(text);
    if (parsed.length === 0) return;

    // Optional `times`: per-message timestamp labels, index-aligned with the
    // convo lines. Only attach when the counts line up so timing stays paired
    // with the right message (README: pair by index, never by filtering).
    const rawTimes = params.get("times");
    if (rawTimes) {
      const decoded = decodeBase64Url(rawTimes);
      if (decoded !== null) {
        const timeLines = decoded.split("\n");
        if (timeLines.length === parsed.length) {
          parsed.forEach((m, i) => {
            const t = timeLines[i]?.trim();
            if (t) m.time = t;
          });
        }
      }
    }

    setRawText(text);
    applyMessages(parsed, "paste");

    window.history.replaceState({}, "", window.location.pathname);
  }, [applyMessages]);

  const handlePasteChange = (value: string) => {
    setRawText(value);
    setInputMode("paste");
    setActiveDemoId(null);

    if (!value.trim()) {
      setMessages([]);
      setParseError(null);
      return;
    }

    const parsed = parsePastedConversation(value);
    if (parsed.length === 0) {
      setMessages([]);
      setParseError(
        'Could not parse messages. Use "Name: message" per line.',
      );
      return;
    }

    applyMessages(parsed, "paste");
  };

  const loadDemoConvo = (demoId: string) => {
    const demo = DEMO_CONVOS.find((c) => c.id === demoId);
    if (!demo) return;

    const formatted = demo.messages
      .map((m) => `${m.sender}: ${m.text}`)
      .join("\n");

    setRawText(formatted);
    applyMessages(demo.messages, "demo", demoId);
  };

  const handleAnalyze = async () => {
    setAnalyzeError(null);

    if (messages.length === 0) {
      setParseError("Paste a conversation or try a demo convo first.");
      return;
    }

    if (!userSender) {
      setParseError("Couldn't tell who you are in this chat.");
      return;
    }

    const request: AnalyzeRequest = {
      messages,
      userSender,
    };

    setIsAnalyzing(true);
    try {
      const verdict = await analyzeConversation(request);
      onVerdict(verdict, { messages, userSender });
    } catch (err) {
      const message =
        err instanceof AnalyzeError
          ? err.message
          : "Something went wrong. Is /api/analyze up?";
      setAnalyzeError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const primaryDemo = DEMO_CONVOS[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        {/* Left: identity, the scale, and demo shortcuts */}
        <div className="flex flex-col gap-7">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadDemoConvo(primaryDemo.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeDemoId === primaryDemo.id
                  ? "bg-orange-500 text-white"
                  : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
              }`}
            >
              {primaryDemo.label}
            </button>
            {DEMO_CONVOS.slice(1).map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => loadDemoConvo(demo.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeDemoId === demo.id
                    ? "bg-orange-500/20 text-orange-300"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {demo.description}
              </button>
            ))}
          </div>

          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              Delulu Detector
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
              Paste your talking stage
            </h1>
            <p className="max-w-md text-lg text-zinc-400">
              Find out if your talking stage is cooked or not.
            </p>
          </header>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Your Cooked Score, 0–100
            </p>
            <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="text-sm font-semibold text-emerald-400">Not cooked</p>
                <p className="text-xs text-zinc-500">0–30 · actually valid</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-400">Simmering</p>
                <p className="text-xs text-zinc-500">31–64 · mixed signals</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-400">Cooked</p>
                <p className="text-xs text-zinc-500">65–100 · it&apos;s giving delulu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: the input + analyze action */}
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="convo-paste" className="text-sm font-medium text-zinc-300">
              Conversation
            </label>
            <textarea
              id="convo-paste"
              value={rawText}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder={`Paste your chat here...\n\nAlex: hey\nYou: hi!!\nAlex: lol`}
              rows={16}
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 shadow-sm outline-none ring-orange-500 placeholder:text-zinc-600 focus:ring-2"
            />
            {parseError && (
              <p className="text-sm text-red-400" role="alert">
                {parseError}
              </p>
            )}
            {messages.length > 0 && !parseError && (
              <p className="text-sm text-zinc-400">
                Parsed {messages.length} message{messages.length === 1 ? "" : "s"}
                {inputMode === "demo" ? " from demo convo" : ""}.
              </p>
            )}
          </div>

          {analyzeError && (
            <p className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-300" role="alert">
              {analyzeError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing || messages.length === 0}
            className="w-full rounded-xl bg-orange-500 px-4 py-4 text-base font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing…" : "Chat am I cooked?"}
          </button>
        </div>
      </div>
    </div>
  );
}
