/** A single message in a parsed conversation. */
export type Message = {
  sender: string;
  text: string;
  /**
   * Raw timestamp label as rendered by the source (e.g. "9:41 PM",
   * "Yesterday 2:03 PM", "Jul 18, 2026"). Optional — only the Instagram
   * extension supplies it. Not normalized to ISO; treat as a display/timing hint.
   */
  time?: string;
};

/** Locked JSON contract — do not change without team agreement. */
export type VerdictResult = {
  cooked_score: number;
  verdict: string;
  delusion_level: string;
  roast: string;
  red_flags: Array<{ flag: string; receipt: string }>;
  green_flags: Array<{ flag: string; receipt: string }>;
  verdict_emoji: string;
  /**
   * Longer, section-by-section breakdown of the whole conversation — real
   * observations delivered with comedy. May be empty (older payloads/mocks).
   */
  deep_dive: Array<{ title: string; detail: string }>;
};

export type AnalyzeRequest = {
  messages: Message[];
  userSender: string;
};

export type DemoConvo = {
  id: string;
  label: string;
  description: string;
  messages: Message[];
  defaultUserSender: string;
};
