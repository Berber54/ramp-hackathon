/** Maps a cooked score (0–100) to a shared color/label tier used across The Reveal. */
export type ScoreTier = {
  key: "thriving" | "mixed" | "cooked";
  label: string;
  /** Raw hex — used for SVG strokes/gradients and inline styles on the share card. */
  color: string;
  colorSoft: string;
  /** Accent gradient stops for the meter fill. */
  gradient: [string, string];
};

export function getScoreTier(score: number): ScoreTier {
  if (score <= 30) {
    return {
      key: "thriving",
      label: "Not cooked",
      color: "#22c55e",
      colorSoft: "#dcfce7",
      gradient: ["#4ade80", "#16a34a"],
    };
  }
  if (score <= 64) {
    return {
      key: "mixed",
      label: "Simmering",
      color: "#f59e0b",
      colorSoft: "#fef3c7",
      gradient: ["#fbbf24", "#f97316"],
    };
  }
  return {
    key: "cooked",
    label: "Cooked",
    color: "#ef4444",
    colorSoft: "#fee2e2",
    gradient: ["#fb7185", "#dc2626"],
  };
}
