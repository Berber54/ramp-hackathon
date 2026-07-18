import { describe, expect, it } from "vitest";
import {
  extractSenders,
  parsePastedConversation,
  parseSimpleFormat,
} from "./parse-paste";

describe("parseSimpleFormat", () => {
  it("parses Name: message lines", () => {
    const raw = `Alex: hey
You: hi!!`;

    expect(parseSimpleFormat(raw)).toEqual([
      { sender: "Alex", text: "hey" },
      { sender: "You", text: "hi!!" },
    ]);
  });

  it("merges wrapped continuation lines", () => {
    const raw = `Alex: hey
this is a second line`;

    expect(parseSimpleFormat(raw)).toEqual([
      { sender: "Alex", text: "hey\nthis is a second line" },
    ]);
  });
});

describe("parsePastedConversation", () => {
  it("parses simple format", () => {
    const raw = `Alex: hey
You: hi`;

    expect(parsePastedConversation(raw)).toEqual([
      { sender: "Alex", text: "hey" },
      { sender: "You", text: "hi" },
    ]);
  });
});

describe("extractSenders", () => {
  it("returns unique senders in order", () => {
    const messages = [
      { sender: "You", text: "a" },
      { sender: "Alex", text: "b" },
      { sender: "You", text: "c" },
    ];

    expect(extractSenders(messages)).toEqual(["You", "Alex"]);
  });
});
