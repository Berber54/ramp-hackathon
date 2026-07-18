import type { Message } from "./types";

/** A single computed stat about the conversation, ready to render. */
export type ConvoStat = {
  label: string;
  value: string;
  /** Optional witty one-liner shown under the value. */
  hint?: string;
};

function wordCount(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

/** Longest run of consecutive messages from `sender` beyond the first (i.e. double-texts). */
function maxStreak(messages: Message[], sender: string): number {
  let best = 0;
  let run = 0;
  for (const m of messages) {
    if (m.sender === sender) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return Math.max(0, best - 1);
}

/**
 * Derives real, quantitative stats about the conversation from the actual
 * messages — the "actual information" half of the results. Pure/deterministic,
 * so it works identically for live and mock verdicts.
 */
export function computeConvoStats(messages: Message[], userSender: string): ConvoStat[] {
  if (messages.length === 0) return [];

  const yours = messages.filter((m) => m.sender === userSender);
  const theirs = messages.filter((m) => m.sender !== userSender);

  const otherName =
    theirs[0]?.sender ?? messages.find((m) => m.sender !== userSender)?.sender ?? "Them";

  const yourWords = yours.reduce((sum, m) => sum + wordCount(m.text), 0);
  const theirWords = theirs.reduce((sum, m) => sum + wordCount(m.text), 0);
  const totalWords = yourWords + theirWords;

  const yourAvg = yours.length ? yourWords / yours.length : 0;
  const theirAvg = theirs.length ? theirWords / theirs.length : 0;

  const yourShare = totalWords ? Math.round((yourWords / totalWords) * 100) : 0;

  const doubleTexts = maxStreak(messages, userSender);
  const theirQuestions = theirs.filter((m) => m.text.includes("?")).length;
  const initiator = messages[0].sender === userSender ? "You" : otherName;

  const round1 = (n: number) => (Math.round(n * 10) / 10).toString();

  const timed = messages.filter((m) => m.time && m.time.trim() !== "");
  // Late-night = sent between 12–4am, the prime rumination window.
  const lateNight = timed.filter((m) => /\b(12|1|2|3|4):\d{2}\s*a\.?m\.?/i.test(m.time!)).length;

  const stats: ConvoStat[] = [
    {
      label: "Messages sent",
      value: `${yours.length} vs ${theirs.length}`,
      hint:
        yours.length > theirs.length
          ? `You out-texted ${otherName} by ${yours.length - theirs.length}.`
          : yours.length < theirs.length
            ? `${otherName} actually out-texted you. Rare.`
            : "Perfectly, suspiciously even.",
    },
    {
      label: "Avg words / message",
      value: `${round1(yourAvg)} vs ${round1(theirAvg)}`,
      hint:
        yourAvg > theirAvg * 1.5
          ? "You write essays; they write receipts."
          : "Reply energy is roughly matched.",
    },
    {
      label: "Your share of the words",
      value: `${yourShare}%`,
      hint:
        yourShare >= 65
          ? "You're carrying this whole conversation."
          : yourShare <= 40
            ? "They're doing the heavy lifting here."
            : "A pretty balanced back-and-forth.",
    },
    {
      label: "Your longest double-text streak",
      value: doubleTexts > 0 ? `${doubleTexts} in a row` : "None",
      hint:
        doubleTexts >= 2
          ? "Chasing the reply into the void, we love to see it."
          : "Impressive restraint, honestly.",
    },
    {
      label: `Questions ${otherName} asked you`,
      value: `${theirQuestions}`,
      hint:
        theirQuestions === 0
          ? "Zero. Curiosity: not detected."
          : theirQuestions >= 3
            ? "They're actually curious about you."
            : "A little curiosity, at least.",
    },
    {
      label: "Who texted first",
      value: initiator,
      hint: initiator === "You" ? "As usual, you opened the negotiations." : "They came to you. Note it.",
    },
  ];

  if (timed.length > 0) {
    stats.push({
      label: "Sent between 12–4am",
      value: `${lateNight}`,
      hint:
        lateNight === 0
          ? "Nothing sent in the rumination hours. Healthy."
          : lateNight >= 3
            ? "The 3am spiral is well documented here."
            : "A couple of late-night lapses. It happens.",
    });
  }

  return stats;
}
