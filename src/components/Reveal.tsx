"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { CookedMeter } from "@/components/CookedMeter";
import { getScoreTier } from "@/lib/verdict-theme";
import { computeConvoStats } from "@/lib/conversation-stats";
import type { Message, VerdictResult } from "@/lib/types";

type RevealProps = {
  verdict: VerdictResult;
  /** The original conversation — powers the "by the numbers" panel. Optional for previews. */
  messages?: Message[];
  /** Which sender is the user. Needed to attribute the stats. */
  userSender?: string;
  onBack: () => void;
  /** Optional: continue into chat mode (Teammate D). */
  onChat?: () => void;
};

type Flag = { flag: string; receipt: string };

function FlagRow({ flag, tone }: { flag: Flag; tone: "red" | "green" }) {
  const isRed = tone === "red";
  return (
    <li
      className={`rounded-xl border p-3 ${
        isRed ? "border-red-900/50 bg-red-950/40" : "border-emerald-900/50 bg-emerald-950/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="mt-0.5 text-base leading-none">
          {isRed ? "🚩" : "✅"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{flag.flag}</p>
          <p
            className={`mt-1 border-l-2 pl-2 text-sm italic text-zinc-400 ${
              isRed ? "border-red-700" : "border-emerald-700"
            }`}
          >
            &ldquo;{flag.receipt}&rdquo;
          </p>
        </div>
      </div>
    </li>
  );
}

export function Reveal({ verdict, messages, userSender, onBack, onChat }: RevealProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tier = getScoreTier(verdict.cooked_score);

  const stats = useMemo(
    () => (messages && messages.length ? computeConvoStats(messages, userSender ?? "You") : []),
    [messages, userSender],
  );
  const deepDive = verdict.deep_dive ?? [];

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    setSaveError(null);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#18181b",
      });
      const link = document.createElement("a");
      link.download = `delulu-verdict-${verdict.cooked_score}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setSaveError("Couldn't save the image. Try screenshotting instead.");
    } finally {
      setSaving(false);
    }
  }, [verdict.cooked_score]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
        >
          ← Roast another chat
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Delulu Detector
        </span>
      </div>

      {/* Desktop: stats · card · breakdown fill the whole width. Stacks on mobile. */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_28rem_1fr]">
        {/* ===== Left: real numbers from the actual conversation ===== */}
        {stats.length > 0 && (
          <aside className="order-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 lg:order-1 lg:sticky lg:top-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400">
              By the numbers
            </h2>
            <p className="mt-1 text-xs text-zinc-500">The receipts, quantified.</p>
            <dl className="mt-4 space-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs font-medium text-zinc-400">{s.label}</dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums text-zinc-100">
                    {s.value}
                  </dd>
                  {s.hint && <p className="mt-0.5 text-xs italic text-zinc-500">{s.hint}</p>}
                </div>
              ))}
            </dl>
          </aside>
        )}

        {/* ===== Center: the shareable card ===== */}
        <div className="order-1 flex flex-col gap-5 lg:order-2">
      {/* ===== Capture target: the shareable card ===== */}
      <div
        ref={cardRef}
        className="overflow-hidden rounded-3xl bg-zinc-900 shadow-xl ring-1 ring-zinc-800"
      >
        {/* Colored top band tied to the verdict tier */}
        <div className="h-2 w-full" style={{ backgroundColor: tier.color }} />

        <div className="flex flex-col items-center px-6 pt-6">
          <CookedMeter score={verdict.cooked_score} emoji={verdict.verdict_emoji} />

          <div
            className="mt-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ backgroundColor: tier.colorSoft, color: tier.color }}
          >
            {verdict.delusion_level}
          </div>

          <h1 className="mt-4 text-balance text-center text-2xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
            {verdict.verdict}
          </h1>
        </div>

        <div className="px-6 pb-6 pt-5">
          <p className="rounded-2xl bg-zinc-800/60 p-4 text-[15px] leading-relaxed text-zinc-200">
            {verdict.roast}
          </p>

          {verdict.red_flags.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">
                Red flags
              </h2>
              <ul className="space-y-2">
                {verdict.red_flags.map((f, i) => (
                  <FlagRow key={`red-${i}`} flag={f} tone="red" />
                ))}
              </ul>
            </section>
          )}

          {verdict.green_flags.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600">
                Green flags
              </h2>
              <ul className="space-y-2">
                {verdict.green_flags.map((f, i) => (
                  <FlagRow key={`green-${i}`} flag={f} tone="green" />
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Brand footer — makes the card self-explanatory as a screenshot */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3">
          <span className="text-xs font-bold text-zinc-100">🔥 Delulu Detector</span>
          <span className="text-xs text-zinc-500">find out if you&apos;re cooked</span>
        </div>
      </div>

      {saveError && (
        <p className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-300" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex-1 rounded-xl bg-orange-500 px-4 py-3.5 text-base font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "📸 Save your verdict"}
        </button>
        {onChat && (
          <button
            type="button"
            onClick={onChat}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-base font-semibold text-zinc-200 transition hover:bg-zinc-800"
          >
            Keep roasting 💬
          </button>
        )}
      </div>
        </div>

        {/* ===== Right: the full, funny-but-real breakdown ===== */}
        {deepDive.length > 0 && (
          <aside className="order-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 lg:order-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400">
              The full breakdown
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              A closer read of the whole conversation.
            </p>
            <div className="mt-4 space-y-4">
              {deepDive.map((section, i) => (
                <section key={i} className="border-l-2 border-zinc-700 pl-3">
                  <h3 className="text-sm font-bold text-zinc-100">{section.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{section.detail}</p>
                </section>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
