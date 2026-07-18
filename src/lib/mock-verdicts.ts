import type { VerdictResult } from "./types";

// 🧊 Frozen mock verdicts for building/testing The Reveal without the API.
// Shapes match the locked contract (VerdictResult) exactly.

export const MOCK_COOKED: VerdictResult = {
  cooked_score: 91,
  verdict: "You are the side quest, not the main story.",
  delusion_level: "Clinically delulu",
  roast:
    "Babe, you are writing paragraphs and getting back the energy of a customer service auto-reply. You planned an entire future in your head off a 'lol maybe' — that's not a talking stage, that's a one-person book club. The math isn't mathing, and deep down you already know it, which is why you reread the chat 40 times looking for a clue that was never there.",
  red_flags: [
    { flag: "Takes 8 hours to reply, then just 'lol'", receipt: "lol yeah maybe" },
    { flag: "Never asks a single question back", receipt: "haha nice" },
    { flag: "Dodges every concrete plan", receipt: "we should hang sometime for sure" },
  ],
  green_flags: [
    { flag: "Did remember your dog's name once", receipt: "how's Biscuit doing" },
  ],
  verdict_emoji: "🔥",
  deep_dive: [
    {
      title: "The reply-time to word-count ratio is criminal",
      detail:
        "Eight hours of suspense to receive 'lol yeah maybe.' That's not a busy person, that's someone budgeting the bare minimum to keep you subscribed. The wait is doing more emotional labor than they are.",
    },
    {
      title: "Curiosity level: undetectable",
      detail:
        "Scan the whole thread for a question they asked about you. Found one? Neither did I. 'haha nice' is what people say when they've stopped reading but still want credit for responding.",
    },
    {
      title: "Plans exist only in the abstract",
      detail:
        "'we should hang sometime for sure' is the 'for sure' that never books a calendar. It's a plan-shaped object with no date, no place, and no intention — a hologram of a date.",
    },
    {
      title: "The one crumb you're surviving on",
      detail:
        "They remembered Biscuit once, and you've been living off that single data point ever since. One decent moment across a desert of dryness isn't a green flag, it's a mirage you're very thirsty for.",
    },
  ],
};

export const MOCK_HEALTHY: VerdictResult = {
  cooked_score: 18,
  verdict: "Actually? You might just be winning this one.",
  delusion_level: "Actually valid",
  roast:
    "Plot twist: this is going well and I have almost nothing to roast. They match your energy, they make real plans, and they actually ask about your life. Stop screenshotting this for your group chat looking for red flags — there aren't any. Go text them back before you self-sabotage.",
  red_flags: [
    { flag: "Slightly slow to reply on weekends", receipt: "sorry was hiking all day! how was yours?" },
  ],
  green_flags: [
    { flag: "Makes concrete plans", receipt: "friday 7pm, that ramen place, i'm booking it" },
    { flag: "Actually asks about your day", receipt: "wait how did the interview go?? tell me everything" },
    { flag: "Matches your effort and initiates too", receipt: "been thinking about you, hope today's less crazy" },
  ],
  verdict_emoji: "💚",
  deep_dive: [
    {
      title: "They book, they don't 'maybe'",
      detail:
        "'friday 7pm, that ramen place, i'm booking it' — a day, a time, a location, and initiative in one text. This is the rarest species in the dating wild: a person who converts vibes into an actual reservation.",
    },
    {
      title: "The questions come back",
      detail:
        "'wait how did the interview go?? tell me everything' — double question mark, genuine follow-up, wants details. Curiosity that specific means they're building a file on you because they like the subject.",
    },
    {
      title: "Effort with no scoreboard",
      detail:
        "They initiate ('been thinking about you'), they reciprocate, and even the weekend slow-reply came with an apology and a question back. Nobody's keeping score here because nobody needs to.",
    },
    {
      title: "The call is coming from inside the app",
      detail:
        "The only threat to this situationship is you screenshotting it for the group chat looking for doom. There is no doom. Reply to the poor person before you talk yourself out of a good thing.",
    },
  ],
};

export const MOCK_MIXED: VerdictResult = {
  cooked_score: 54,
  verdict: "Hot, cold, and leaving you on 'we'll see'.",
  delusion_level: "Mixed signals, heavy copium",
  roast:
    "The vibes are real when you're together and vapor when you're not. They call you the best and then rain-check the plan they suggested — that's breadcrumb sourdough. You're not cooked yet, but you're preheating. Make one concrete plan and watch what they actually do, not what they text.",
  red_flags: [
    { flag: "Suggests plans, then bails", receipt: "hmm might have to rain check" },
    { flag: "Sweet-talks to soften the flake", receipt: "you're the best 💕" },
  ],
  green_flags: [
    { flag: "Genuine enthusiasm in person", receipt: "same omg you're actually hilarious" },
    { flag: "Does initiate sometimes", receipt: "we should do it again soon" },
  ],
  verdict_emoji: "🎭",
  deep_dive: [
    {
      title: "Breadcrumb sourdough",
      detail:
        "They suggested doing it again, you said yes, and then it fermented into 'might have to rain check.' The starter is real — they DID initiate — but you keep getting fed just enough to stay hungry.",
    },
    {
      title: "Compliments on a payment plan",
      detail:
        "'you're the best 💕' lands right on the heels of a flake, every time. Warm words timed to soften cold actions aren't romance, they're customer retention. Notice the pattern, not just the pet name.",
    },
    {
      title: "In-person 100, over-text 40",
      detail:
        "The chemistry when you're together is not in question — 'you're actually hilarious' is a real reaction. The gap is the follow-through between hangs, where the enthusiasm evaporates like it was rented.",
    },
    {
      title: "The tiebreaker is a test",
      detail:
        "You're genuinely mid-range, so stop reading tea leaves. Propose one specific plan and let their response be the verdict — if it's another 'maybe saturday?', you'll have your answer in HD.",
    },
  ],
};

/** All mocks keyed for quick cycling in a dev harness. */
export const MOCK_VERDICTS = {
  cooked: MOCK_COOKED,
  mixed: MOCK_MIXED,
  healthy: MOCK_HEALTHY,
} as const;
