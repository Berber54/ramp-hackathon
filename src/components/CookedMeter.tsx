"use client";

import { useEffect, useRef, useState } from "react";
import { getScoreTier } from "@/lib/verdict-theme";

type CookedMeterProps = {
  /** Final cooked score, 0–100. */
  score: number;
  /** Big emoji shown under the number. */
  emoji: string;
  /** Sweep duration in ms. */
  duration?: number;
  /** Delay before the sweep starts (lets the card settle first). */
  delay?: number;
};

const CX = 100;
const CY = 100;
const R = 82;
const NEEDLE_LEN = 66;

/** score (0–100) → angle in degrees on the top semicircle (180=left, 0=right). */
function scoreToAngle(value: number): number {
  return 180 - (Math.max(0, Math.min(100, value)) / 100) * 180;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

/** Arc path over the TOP of the circle from startAngle → endAngle (both in [0,180]). */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweep = startAngle > endAngle ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The Cooked-o-meter — the reveal moment. Needle sweeps to the score while the
 * number counts up, ~1.5s, dramatic. rAF-driven so it's smooth and cross-browser.
 */
export function CookedMeter({ score, emoji, duration = 1500, delay = 350 }: CookedMeterProps) {
  const target = Math.max(0, Math.min(100, Math.round(score)));
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    const startTimer = window.setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts;
        const t = Math.min(1, (ts - start) / duration);
        setValue(target * easeOutCubic(t));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  const tier = getScoreTier(value);
  const finalTier = getScoreTier(target);
  const needleAngle = scoreToAngle(value);
  const needleTip = polar(CX, CY, NEEDLE_LEN, needleAngle);
  const progressEnd = scoreToAngle(value);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 118"
        className="w-full max-w-[340px]"
        role="img"
        aria-label={`Cooked score ${target} out of 100`}
      >
        <defs>
          <linearGradient id="meter-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={arcPath(CX, CY, R, 180, 0)}
          fill="none"
          stroke="#27272a"
          strokeWidth={16}
          strokeLinecap="round"
        />

        {/* Faint full-color reference band */}
        <path
          d={arcPath(CX, CY, R, 180, 0)}
          fill="none"
          stroke="url(#meter-gradient)"
          strokeWidth={16}
          strokeLinecap="round"
          opacity={0.18}
        />

        {/* Animated progress fill */}
        {value > 0.5 && (
          <path
            d={arcPath(CX, CY, R, 180, progressEnd)}
            fill="none"
            stroke={tier.color}
            strokeWidth={16}
            strokeLinecap="round"
          />
        )}

        {/* Tick labels */}
        <text x="14" y="114" className="fill-zinc-500" fontSize="9" fontWeight="600">
          0
        </text>
        <text x="96" y="20" className="fill-zinc-500" fontSize="9" fontWeight="600">
          50
        </text>
        <text x="180" y="114" className="fill-zinc-500" fontSize="9" fontWeight="600">
          100
        </text>

        {/* Needle */}
        <line
          x1={CX}
          y1={CY}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#fafafa"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={9} fill="#fafafa" />
        <circle cx={CX} cy={CY} r={4} fill="#18181b" />
      </svg>

      <div className="-mt-6 flex flex-col items-center">
        <div
          className="text-6xl font-black tabular-nums leading-none tracking-tight"
          style={{ color: finalTier.color }}
        >
          {Math.round(value)}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Cooked Score
        </div>
        <div className="mt-2 text-4xl" aria-hidden>
          {emoji}
        </div>
      </div>
    </div>
  );
}
