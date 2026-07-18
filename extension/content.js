// Delulu Detector — Instagram DM scraper (content script).
//
// This runs inside your own logged-in Instagram tab, so there's no programmatic
// login and no ban/checkpoint risk — it only reads what's already rendered.
//
// Instagram ships obfuscated, ever-changing class names, so we DON'T rely on
// them. Instead we detect who sent each message by horizontal ALIGNMENT: your
// messages hug the right edge of the thread column, the other person's hug the
// left. That heuristic survives class-name churn far better than CSS selectors.
//
// The message list is virtualized — only bubbles currently on screen exist in
// the DOM. To capture the WHOLE conversation we programmatically scroll the
// thread to the top (loading all older history), then scroll back down capturing
// each rendered window and stitching the overlapping windows into one ordered
// transcript.
//
// Timestamps: Instagram sprinkles time/date SEPARATOR rows between clusters of
// messages (e.g. "9:41 PM", "Mon 9:41 PM", "Yesterday 2:03 PM", "Jul 18, 2026").
// We recognize those rows, keep them as timing markers in reading order, and
// stamp every following message with the most recent separator we saw above it.

const MAX_MS = 25000; // wall-clock budget so we never hang the popup
const SETTLE_MS = 300; // pause after each scroll for Instagram to render/load

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Whole-string timestamp/date separators (case-insensitive). Anchored + short so
// a normal message like "meet at 9:41 pm tomorrow?" is NOT mistaken for a marker.
const TIME_PATTERNS = [
  // bare clock: "9:41 PM", "12:03"
  /^\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?$/i,
  // weekday + clock: "Mon 9:41 PM", "Monday 9:41 PM"
  /^(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?$/i,
  // relative + clock: "Yesterday 2:03 PM", "Today 9:41 PM"
  /^(?:yesterday|today),?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?$/i,
  // month day [, year] [clock]: "Jul 18", "July 18, 2026", "Jul 18, 2026 9:41 PM"
  /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?(?:,?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?)?$/i,
  // numeric date [clock]: "7/18/26", "07/18/2026 9:41 PM"
  /^\d{1,2}\/\d{1,2}\/\d{2,4}(?:,?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?)?$/i,
];

// Returns the raw separator label if the text is a timestamp row, else null.
function timeLabel(text) {
  const t = text.trim();
  if (t.length > 32) return null;
  return TIME_PATTERNS.some((re) => re.test(t)) ? t : null;
}

function inComposer(el) {
  return !!el.closest('[contenteditable="true"], textarea, [role="textbox"]');
}

function isJunk(text) {
  const t = text.trim();
  if (!t) return true;
  if (t.length > 4000) return true;
  // Common UI/status chrome (timestamps are handled separately, see timeLabel).
  if (/^(active now|seen|delivered|sent|now|yesterday|today|reply|replied to you)$/i.test(t)) return true;
  if (/^(mon|tue|wed|thu|fri|sat|sun)$/i.test(t)) return true;
  return false;
}

// Classify a text node: a timing marker, a real message bubble, or junk (null).
function classify(text) {
  const label = timeLabel(text);
  if (label) return { isTime: true, time: label };
  if (isJunk(text)) return null;
  return { isTime: false, time: null };
}

// Best-effort contact name from the thread header (right column, near the top).
// Cosmetic only — sender identity is driven by the "You" vs. contact split below.
function findContactName() {
  const w = window.innerWidth;
  const candidates = Array.from(
    document.querySelectorAll('header span[dir="auto"], header h1, header h2, a[role="link"] span[dir="auto"]'),
  );
  for (const el of candidates) {
    const t = (el.innerText || "").trim();
    if (!t || t.length > 40) continue;
    if (/instagram/i.test(t)) continue;
    const r = el.getBoundingClientRect();
    if (r.top >= 0 && r.top < 140 && r.left > w * 0.3) return t;
  }
  return null;
}

// The message bubbles + timing markers currently rendered (one scroll window).
function visibleItems() {
  const w = window.innerWidth;
  // Ignore the left conversation-list sidebar; the open thread is on the right.
  const leftCut = w * 0.3;

  const nodes = Array.from(
    document.querySelectorAll('div[dir="auto"], span[dir="auto"], p[dir="auto"]'),
  );

  const items = [];
  for (const el of nodes) {
    if (inComposer(el)) continue;
    // Keep only the innermost text node to avoid double-counting wrappers.
    if (el.querySelector('div[dir="auto"], span[dir="auto"], p[dir="auto"]')) continue;

    const text = (el.innerText || "").trim();
    const cls = classify(text);
    if (!cls) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.left < leftCut) continue;

    items.push({
      el,
      text,
      cx: rect.left + rect.width / 2,
      top: rect.top,
      isTime: cls.isTime,
      time: cls.time,
    });
  }

  items.sort((a, b) => a.top - b.top);
  return items;
}

// Nearest scrollable ancestor — the pane that holds the message history.
function scrollableAncestor(el) {
  let node = el && el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const oy = style.overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      node.scrollHeight > node.clientHeight + 20
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function findScrollContainer() {
  for (const it of visibleItems()) {
    const c = scrollableAncestor(it.el);
    if (c) return c;
  }
  return null;
}

// Strip DOM refs so items can travel through chrome messaging / stitching.
function plain(items) {
  return items.map((i) => ({ text: i.text, cx: i.cx, isTime: i.isTime, time: i.time }));
}

// Stitch one freshly-captured window (ordered oldest→newest) onto the growing
// transcript by matching the longest overlap between the tail of what we have
// and the head of the new window. Overlap matching keys on text only; because
// consecutive scroll windows overlap by well over a screenful, the overlap is
// larger than any run of repeated identical messages, so ordering stays correct.
function stitch(global, window) {
  if (global.length === 0) return window.slice();
  const maxK = Math.min(global.length, window.length);
  for (let k = maxK; k > 0; k--) {
    let match = true;
    for (let i = 0; i < k; i++) {
      if (global[global.length - k + i].text !== window[i].text) {
        match = false;
        break;
      }
    }
    if (match) return global.concat(window.slice(k));
  }
  return global.concat(window);
}

// Turn ordered items into {sender, text, time} messages. Sender split uses the
// global left/right divide across the WHOLE transcript (message items only), so
// a screenful of only-your-messages can't skew the midpoint. Each message gets
// the label of the most recent timing marker seen above it (null if none yet).
function finalize(items, contactName) {
  const msgItems = items.filter((i) => !i.isTime);
  if (msgItems.length === 0) return { messages: [], contactName };

  const xs = msgItems.map((i) => i.cx);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spread = Math.max(...xs) - Math.min(...xs);

  const messages = [];
  let currentTime = null;
  for (const it of items) {
    if (it.isTime) {
      currentTime = it.time;
      continue;
    }
    // If every bubble is at basically the same x (spread tiny), we can't tell
    // sides apart — attribute to the contact rather than guess wrong.
    const sender = spread > 40 && it.cx > mid ? "You" : contactName;
    const last = messages[messages.length - 1];
    if (last && last.sender === sender && last.text === it.text) continue;
    messages.push({ sender, text: it.text, time: currentTime });
  }
  return { messages, contactName };
}

async function scrapeAll() {
  const start = Date.now();
  const contactName = findContactName() || "Them";
  const container = findScrollContainer();

  // No scrollable pane found — fall back to whatever is on screen right now.
  if (!container) {
    return finalize(plain(visibleItems()), contactName);
  }

  // Phase A: scroll to the top repeatedly to load ALL older history. Stop once
  // the total scroll height stops growing (nothing left to load) or we run out
  // of time budget.
  let lastHeight = -1;
  let stable = 0;
  for (let i = 0; i < 400 && stable < 3; i++) {
    container.scrollTop = 0;
    await sleep(SETTLE_MS);
    if (container.scrollHeight === lastHeight) {
      stable++;
    } else {
      stable = 0;
      lastHeight = container.scrollHeight;
    }
    if (Date.now() - start > MAX_MS) break;
  }

  // Phase B: from the top, walk down capturing each rendered window and stitch.
  let ordered = [];
  container.scrollTop = 0;
  await sleep(SETTLE_MS);
  const step = Math.max(200, Math.floor(container.clientHeight * 0.6));

  for (let guard = 0; guard < 1000; guard++) {
    ordered = stitch(ordered, plain(visibleItems()));

    const atBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
    if (atBottom || Date.now() - start > MAX_MS) break;

    container.scrollTop = Math.min(
      container.scrollHeight,
      container.scrollTop + step,
    );
    await sleep(SETTLE_MS);
  }

  // Final capture at the very bottom, then leave the thread where the user had it.
  ordered = stitch(ordered, plain(visibleItems()));
  container.scrollTop = container.scrollHeight;

  return finalize(ordered, contactName);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "DELULU_SCRAPE") {
    scrapeAll()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // keep the message channel open for the async response
  }
  return false;
});
