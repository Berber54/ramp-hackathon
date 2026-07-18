import { describe, expect, it } from "vitest";
import {
  parseChatTurns,
  parseMessages,
  parseVerdict,
  ValidationError,
} from "./brain";
import { extractJSON } from "./llm";
import { pickMockForConversation } from "./mock";

const validVerdict = {
  cooked_score: 87,
  verdict: "You are the side quest.",
  delusion_level: "Clinically delulu",
  roast: "A savage paragraph.",
  red_flags: [{ flag: "dry", receipt: "k" }],
  green_flags: [],
  verdict_emoji: "🔥",
};

describe("parseVerdict", () => {
  it("accepts and normalizes a valid verdict", () => {
    const v = parseVerdict(validVerdict);
    expect(v.cooked_score).toBe(87);
    expect(v.verdict_emoji).toBe("🔥");
    expect(v.green_flags).toEqual([]);
  });

  it("clamps and rounds the score into 0-100", () => {
    expect(parseVerdict({ ...validVerdict, cooked_score: 140 }).cooked_score).toBe(100);
    expect(parseVerdict({ ...validVerdict, cooked_score: -5 }).cooked_score).toBe(0);
    expect(parseVerdict({ ...validVerdict, cooked_score: 42.6 }).cooked_score).toBe(43);
  });

  it("defaults a missing emoji", () => {
    const { verdict_emoji, ...rest } = validVerdict;
    void verdict_emoji;
    expect(parseVerdict(rest).verdict_emoji).toBe("🔥");
  });

  it("throws on missing required fields", () => {
    expect(() => parseVerdict({ ...validVerdict, roast: "" })).toThrow(ValidationError);
    expect(() => parseVerdict({ ...validVerdict, cooked_score: "high" })).toThrow(
      ValidationError,
    );
    expect(() =>
      parseVerdict({ ...validVerdict, red_flags: [{ flag: "no receipt" }] }),
    ).toThrow(ValidationError);
    expect(() => parseVerdict(null)).toThrow(ValidationError);
  });
});

describe("parseMessages", () => {
  it("cleans blank messages and trims", () => {
    const msgs = parseMessages([
      { sender: " Alex ", text: " hey " },
      { sender: "You", text: "   " },
      { sender: "You", text: "hi" },
    ]);
    expect(msgs).toEqual([
      { sender: "Alex", text: "hey" },
      { sender: "You", text: "hi" },
    ]);
  });

  it("throws when empty", () => {
    expect(() => parseMessages([])).toThrow(ValidationError);
    expect(() => parseMessages("nope")).toThrow(ValidationError);
  });
});

describe("parseChatTurns", () => {
  it("keeps valid turns and drops junk", () => {
    const turns = parseChatTurns([
      { role: "user", content: "hi" },
      { role: "bot", content: "nope" },
      { role: "assistant", content: "sup" },
      null,
    ]);
    expect(turns).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "sup" },
    ]);
  });
});

describe("extractJSON", () => {
  it("parses fenced JSON", () => {
    expect(extractJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("grabs the outermost object from surrounding prose", () => {
    expect(extractJSON('Sure! {"a":1} done')).toEqual({ a: 1 });
  });

  it("throws when there is no object", () => {
    expect(() => extractJSON("no json here")).toThrow();
  });
});

describe("pickMockForConversation", () => {
  it("returns a cooked verdict for dry one-word replies", () => {
    const v = pickMockForConversation(
      [
        { sender: "You", text: "wanna hang this week?" },
        { sender: "Jordan", text: "k" },
        { sender: "Jordan", text: "idk" },
      ],
      "You",
    );
    expect(v.cooked_score).toBeGreaterThan(65);
  });

  it("returns a healthy verdict for engaged replies with questions", () => {
    const v = pickMockForConversation(
      [
        { sender: "You", text: "how was your day" },
        { sender: "Sam", text: "so good! i booked us that pasta place, how did yours go?" },
        { sender: "Sam", text: "also are you free thursday, i got us comedy tickets" },
      ],
      "You",
    );
    expect(v.cooked_score).toBeLessThan(30);
  });
});
