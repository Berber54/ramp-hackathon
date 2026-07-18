"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { MOCK_VERDICTS } from "@/lib/mock-verdicts";

type MockKey = keyof typeof MOCK_VERDICTS;

const KEYS: { key: MockKey; label: string }[] = [
  { key: "cooked", label: "Very cooked (91)" },
  { key: "mixed", label: "Mixed (54)" },
  { key: "healthy", label: "Healthy (18)" },
];

/**
 * Dev/QA preview for The Reveal (Teammate 3). Cycles the frozen mock verdicts
 * so the Cooked-o-meter + card can be checked at both extremes without the API.
 */
export default function RevealPreview() {
  const [key, setKey] = useState<MockKey>("cooked");
  // Remount Reveal on switch so the meter sweep animation replays.
  const [nonce, setNonce] = useState(0);

  const select = (next: MockKey) => {
    setKey(next);
    setNonce((n) => n + 1);
  };

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-2 px-4 pt-6">
        {KEYS.map(({ key: k, label }) => (
          <button
            key={k}
            type="button"
            onClick={() => select(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              key === k
                ? "bg-orange-500 text-white"
                : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-700 hover:ring-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Reveal
        key={`${key}-${nonce}`}
        verdict={MOCK_VERDICTS[key]}
        onBack={() => select(key)}
      />
    </div>
  );
}
