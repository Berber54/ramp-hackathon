import type { Message, VerdictResult } from "./types";

// 🧊 Mock verdict engine — the dev/demo fallback used when no LLM key is set, so
// the whole flow (Intake → Reveal → Chat) works offline. Unlike a single canned
// verdict, this scores the conversation, picks a matching tier, and assembles a
// VARIED verdict from per-tier phrase banks (10+ headlines each) with receipts
// pulled from the ACTUAL messages — so different chats produce different cards.

type Tier = "thriving" | "mixed" | "cooked";

// ---- Phrase banks: at least 10 verdict headlines per tier ---------------------

const VERDICTS: Record<Tier, string[]> = {
  cooked: [
    "You are the side quest, not the main story.",
    "This isn't a talking stage, it's a hostage situation you volunteered for.",
    "They text back with the energy of a customer-service auto-reply.",
    "You're the backup plan's backup plan.",
    "Respectfully? You're cooked, and the oven's still on.",
    "You've been left on read in three different fonts.",
    "This is a one-person relationship and you're the person.",
    "They're keeping you on layaway, not planning a future.",
    "The only thing consistent here is their inconsistency.",
    "You're doing all the talking and calling it a conversation.",
    "They give you crumbs and you're baking a wedding cake.",
    "This ship didn't just sail, it sank at the dock.",
  ],
  mixed: [
    "Hot, cold, and giving you emotional whiplash.",
    "They like the idea of you more than the effort of you.",
    "You're preheating, not cooked — yet.",
    "Real chemistry, allergic to a calendar.",
    "Half green flags, half question marks.",
    "They're interested on their schedule, not yours.",
    "It's not nothing, but it's not much either.",
    "Warm in person, vapor over text.",
    "You're in the maybe pile, not the no pile.",
    "Mixed signals with a side of hope.",
    "They mean it when they say it — they just rarely say it.",
    "Somewhere between a situationship and a wish.",
  ],
  thriving: [
    "Actually? You might just be winning this one.",
    "This is embarrassingly healthy. Congrats.",
    "Green flags as far as the eye can see.",
    "Plot twist: they actually like you back.",
    "Nothing to roast here — go text them back.",
    "Certified not cooked. Rare footage.",
    "Two people trying equally? Groundbreaking.",
    "This is what 'into you' actually looks like.",
    "You found a good one — don't self-sabotage.",
    "Balanced, mutual, and genuinely sweet.",
    "The only red flag is you doubting it.",
    "Whatever this is, keep doing it.",
  ],
};

const DELUSIONS: Record<Tier, string[]> = {
  cooked: [
    "Clinically delulu",
    "Certified cooked",
    "Terminal copium",
    "Delulu, no solulu",
    "Down bad, historically",
  ],
  mixed: [
    "Mild copium",
    "Cautiously delulu",
    "Simmering",
    "Hopeful but hazy",
    "Mixed-signal syndrome",
  ],
  thriving: [
    "Actually valid",
    "Refreshingly sane",
    "Not delulu for once",
    "Healthy behavior detected",
    "Certified fine",
  ],
};

const ROASTS: Record<Tier, string[]> = {
  cooked: [
    "You're putting in main-character effort for a background-character reply. The gap between what you send and what you get back is the whole story, and it's not a love story.",
    "Every message from you is a paragraph; every reply is a receipt. That's not a talking stage, that's you talking and them staging an exit.",
    "You keep reading these texts like there's a hidden layer of interest buried in there. There isn't. The subtext is the text.",
    "They've got you on a slow drip of just-enough attention to keep you from leaving. That's not affection, that's crowd control.",
    "You planned a whole future off vibes and vagueness. Close the app, go outside, and let this one go to voicemail.",
  ],
  mixed: [
    "The chemistry's real, the follow-through is theoretical. You're not imagining the good moments — you're just being asked to live off them between long silences.",
    "They're consistent about being inconsistent. One day you're the best thing ever, the next you're a 'maybe.' Pick a plan and watch what they actually do.",
    "You're not cooked, but you're on the counter thawing. The signals really are mixed, which means the ball's in your court to stop guessing and start testing.",
    "Half of this is sweet and half is a rain check. Enjoy the sweet, stop rearranging your life around the maybes.",
  ],
  thriving: [
    "I came here to roast and left unemployed. They match your energy, they make plans, they actually care. Stop hunting for a problem that isn't in the data.",
    "This is almost suspiciously healthy. Mutual effort, real interest, no games. The only delusion here would be talking yourself out of it.",
    "You're doing great and so are they. Screenshot this as evidence that good things happen, then go reply.",
    "Genuinely? Green across the board. The vibe is mutual and the effort is even. Let it be easy for once.",
  ],
};

const EMOJIS: Record<Tier, string[]> = {
  cooked: ["🔥", "💀", "🚩", "🫠", "📉"],
  mixed: ["🎢", "🎭", "🤔", "⚖️", "🌗"],
  thriving: ["💚", "✅", "🥹", "🫶", "🌱"],
};

const DEEP_DIVES: Record<Tier, Array<{ title: string; detail: string }>> = {
  cooked: [
    { title: "The effort gap", detail: "You're carrying the weight of this conversation while they coast. When one person writes essays and the other sends syllables, the scoreboard is already lopsided." },
    { title: "Plans that never land", detail: "Every step toward an actual plan dissolves into vague non-answers. Interested people pick a day; this is a lot of 'we'll see.'" },
    { title: "The curiosity test", detail: "Count how often they ask about your life. A low number isn't shyness — it's a tell. People who like you get curious about you." },
    { title: "Response energy", detail: "Short, late, low-effort replies are a language of their own. The message under the messages is that you're a low priority." },
    { title: "Why you keep rereading", detail: "You've scrolled this thread looking for proof of interest it doesn't contain. The hope is real; the evidence isn't." },
  ],
  mixed: [
    { title: "Genuine, but part-time", detail: "The interest is real when it shows up — it just doesn't show up reliably. You're getting a highlight reel and calling it a full season." },
    { title: "Who moves the plan forward", detail: "Watch who actually proposes and confirms plans. Right now it's a lot of enthusiasm that stalls before anything hits the calendar." },
    { title: "Warm in person, cold on text", detail: "The in-person chemistry is doing heavy lifting for the texting gaps. Both need to exist for this to be more than a maybe." },
    { title: "The one clean test", detail: "Stop analyzing and run an experiment: propose one specific plan and see if they meet you halfway. Their move is your answer." },
    { title: "Not doom, not destiny", detail: "You're squarely in the middle, which is honestly the hardest place to be. It could go either way — and a lot depends on what you tolerate." },
  ],
  thriving: [
    { title: "Effort is mutual", detail: "You give, they give, and nobody's keeping score because nobody needs to. That balance is the whole ballgame, and you've got it." },
    { title: "They plan in specifics", detail: "Real interest speaks in days, times, and places, not 'sometime.' The concreteness here is a very good sign." },
    { title: "They stay curious", detail: "They ask about your life and remember the answers. That's the difference between someone passing time and someone into you." },
    { title: "The only risk is overthinking", detail: "The single threat to this is you inventing problems. Resist the urge to stress-test a good thing until it breaks." },
    { title: "Let it be easy", detail: "Not every connection has to be a battle. This one's flowing — your job is to show up and enjoy it, not to brace for impact." },
  ],
};

const RED_LABELS = [
  "Bare, low-effort reply",
  "Non-committal breadcrumb",
  "Dodges a real plan",
  "Dry one-liner",
  "Keeps it vague",
];
const GREEN_LABELS = [
  "Asks about you",
  "Brings real energy",
  "Suggests an actual plan",
  "Matches your effort",
  "Genuinely enthusiastic",
];

// ---- Small deterministic RNG so a given chat yields a stable (but varied) card

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function pickMany<T>(arr: T[], n: number, rng: () => number): T[] {
  const pool = arr.slice();
  const out: T[] = [];
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// ---- Heuristics ---------------------------------------------------------------

function wordCount(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

const VAGUE = /\b(maybe|idk|dunno|we'?ll see|busy|kk?|meh|nvm|whatever|rain\s?check|sometime|i guess|ig|prob(?:ably)?)\b/i;
const ENTHUSED = /(haha|hah|lol|lmao|omg|yes+|can'?t wait|excited|love|down|for sure|definitely|100%|😍|🥰|❤|🔥|🥹|😊)/i;

/** 0–100 dryness/one-sidedness score. Higher = more cooked. */
function scoreConversation(messages: Message[], userSender: string): number {
  const others = messages.filter((m) => m.sender !== userSender);
  const yours = messages.filter((m) => m.sender === userSender);
  const sample = others.length ? others : messages;

  const counts = sample.map((m) => wordCount(m.text));
  const avg = counts.reduce((a, b) => a + b, 0) / Math.max(1, counts.length);
  const oneWordRatio = counts.filter((w) => w <= 2).length / Math.max(1, counts.length);
  const questionRatio = sample.filter((m) => m.text.includes("?")).length / Math.max(1, sample.length);
  const vagueRatio = sample.filter((m) => VAGUE.test(m.text)).length / Math.max(1, sample.length);
  const chase = yours.length / Math.max(1, others.length);

  let score = 50;
  if (avg < 3) score += 26;
  else if (avg < 6) score += 8;
  else if (avg >= 9) score -= 26;
  else score -= 8;

  score += oneWordRatio * 20;
  score += vagueRatio * 14;
  score += questionRatio > 0 ? -questionRatio * 26 : 10;
  if (chase > 1.6) score += 10;
  else if (chase < 0.8) score -= 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function tierAndBand(raw: number): { tier: Tier; lo: number; hi: number } {
  if (raw <= 30) return { tier: "thriving", lo: 6, hi: 29 };
  if (raw <= 64) return { tier: "mixed", lo: 34, hi: 62 };
  return { tier: "cooked", lo: 66, hi: 93 };
}

function truncate(text: string, max = 120): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Builds flags from REAL quotes so the receipts match the pasted conversation. */
function deriveFlags(
  messages: Message[],
  userSender: string,
  tier: Tier,
  rng: () => number,
): Pick<VerdictResult, "red_flags" | "green_flags"> {
  const others = messages.filter((m) => m.sender !== userSender && m.text.trim() !== "");

  const dryOrVague = others.filter((m) => wordCount(m.text) <= 3 || VAGUE.test(m.text));
  const warm = others.filter((m) => m.text.includes("?") || ENTHUSED.test(m.text) || wordCount(m.text) >= 10);

  const uniq = (arr: Message[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of arr) {
      const t = truncate(m.text);
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  };

  const redQuotes = uniq(dryOrVague);
  const greenQuotes = uniq(warm);

  const want = tier === "cooked" ? { red: 3, green: 1 } : tier === "mixed" ? { red: 2, green: 2 } : { red: 1, green: 3 };

  const redLabels = pickMany(RED_LABELS, want.red, rng);
  const greenLabels = pickMany(GREEN_LABELS, want.green, rng);

  const red_flags = redQuotes.slice(0, want.red).map((receipt, i) => ({
    flag: redLabels[i] ?? RED_LABELS[i % RED_LABELS.length],
    receipt,
  }));
  const green_flags = greenQuotes.slice(0, want.green).map((receipt, i) => ({
    flag: greenLabels[i] ?? GREEN_LABELS[i % GREEN_LABELS.length],
    receipt,
  }));

  return { red_flags, green_flags };
}

/**
 * Dev-only fallback used when no LLM key is configured. Scores the conversation,
 * then assembles a varied, tier-appropriate verdict with real-quote receipts.
 * Deterministic per conversation (seeded by content) so a given chat is stable,
 * but different chats — and different score ranges — produce different cards.
 */
export function pickMockForConversation(
  messages: Message[],
  userSender: string,
): VerdictResult {
  const raw = scoreConversation(messages, userSender);
  const { tier, lo, hi } = tierAndBand(raw);

  const seed = hashString(messages.map((m) => `${m.sender}:${m.text}`).join("|"));
  const rng = mulberry32(seed);

  const base = Math.min(hi, Math.max(lo, raw));
  const cooked_score = Math.min(hi, Math.max(lo, Math.round(base + (rng() * 11 - 5))));

  const { red_flags, green_flags } = deriveFlags(messages, userSender, tier, rng);

  return {
    cooked_score,
    verdict: pick(VERDICTS[tier], rng),
    delusion_level: pick(DELUSIONS[tier], rng),
    roast: pick(ROASTS[tier], rng),
    red_flags,
    green_flags,
    verdict_emoji: pick(EMOJIS[tier], rng),
    deep_dive: pickMany(DEEP_DIVES[tier], 4, rng),
  };
}
