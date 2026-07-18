import type { Message } from "./types";

const SIMPLE_LINE = /^([^:\n]{1,40}):\s*(.+)$/;

/** Parse simple "Name: message" lines (iMessage-style paste). */
export function parseSimpleFormat(raw: string): Message[] {
  const messages: Message[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(SIMPLE_LINE);
    if (match) {
      messages.push({ sender: match[1].trim(), text: match[2].trim() });
      continue;
    }

    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      last.text = `${last.text}\n${trimmed}`;
    }
  }

  return messages.filter((m) => m.text.length > 0);
}

/** Parse pasted conversation text into a message array. */
export function parsePastedConversation(raw: string): Message[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  return parseSimpleFormat(trimmed);
}

/** Extract unique senders in order of first appearance. */
export function extractSenders(messages: Message[]): string[] {
  const seen = new Set<string>();
  const senders: string[] = [];

  for (const { sender } of messages) {
    if (!seen.has(sender)) {
      seen.add(sender);
      senders.push(sender);
    }
  }

  return senders;
}
