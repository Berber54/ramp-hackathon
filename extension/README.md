# 🔥 Delulu Detector — Chrome extension

Grab the Instagram DM thread you're viewing and open Delulu Detector with it
prefilled. It reads the messages already on screen in **your own** logged-in
Instagram tab — no login, no API keys, no scraping-bot risk.

## Setup (once)

1. Go to `chrome://extensions`, toggle **Developer mode** (top right).
2. Click **Load unpacked** and select this `extension/` folder.
3. Point it at your app URL. Two options:
   - **In the popup (recommended):** click the extension icon, expand **App URL**,
     paste your URL (e.g. `https://delulu-detector.vercel.app` or
     `http://localhost:3000` for local dev), and hit **Save**. It's stored via
     `chrome.storage.local`, so a demo machine never needs a source edit.
   - **In source:** edit `DEFAULT_APP_URL` at the top of `popup.js`.

   Either way, the handoff needs a build that includes the `?convo=` import code
   in `IntakeScreen` — so run/deploy that build first. Until a real URL is set,
   the popup shows a clear "Set your app URL" prompt instead of scraping.

## Use / demo

1. Open Instagram and click into a DM thread.
2. Click the extension icon → **Am I delusional?**.
3. The content script auto-scrolls the thread to the top to load the full
   history (the message list is virtualized, so older messages only exist in the
   DOM once scrolled into view), then walks back down capturing everything. This
   takes a few seconds on long chats.
4. A new tab opens on your app with the whole convo prefilled. Pick who you are
   if needed, then hit analyze.

The popup tells you exactly what happened via the status line: not on an
Instagram tab, the content script needs a tab reload, no messages were found,
or `Sent N messages → roasting…` on success. Very long chats are trimmed to the
most recent messages that fit the handoff URL (`Sent the latest N of M …`).

> If a thread was already open before you loaded/updated the extension, reload
> the Instagram tab once so the content script attaches.

## Handoff format (for the web-app side)

The extension opens the app at:

```
<APP_URL>/?me=<sender>&convo=<base64url>&times=<base64url>
```

| Param   | Required | What it is |
|---------|----------|------------|
| `me`    | yes      | Which sender is "you". Always the literal `You` (sender detection labels your bubbles `You`). Use it to preselect the "Who are you?" toggle. |
| `convo` | yes      | The transcript. base64url of UTF-8 text, **one message per line** as `Sender: message`. Multi-line messages are flattened to a single line. |
| `times` | no       | Per-message timestamps, **index-aligned** with `convo`. base64url of UTF-8 text, one line per message. A line is the raw Instagram separator label or **empty** if unknown. Omitted entirely when no timestamps were captured. |

### Encoding

`base64url` = standard base64 with `+`→`-`, `/`→`_`, and `=` padding stripped.
Decode by reversing that, then base64-decoding as UTF-8. Both params share the
same scheme. (The existing decoder in `src/components/IntakeScreen.tsx` already
does this for `convo`.)

### `times` details

- Split the decoded `times` text by `\n`. Line _i_ is the timestamp for message
  _i_ in `convo` (same order, same count). Do **not** assume every line is
  non-empty — pair by index, not by filtering.
- The value is the **raw label Instagram rendered** on the nearest separator row
  _above_ that message, e.g. `9:41 PM`, `Mon 9:41 PM`, `Yesterday 2:03 PM`,
  `Jul 18, 2026`, `July 18, 2026 9:41 PM`, `7/18/26`. It is **not** normalized to
  ISO — format varies by locale, recency, and how far apart messages are. Treat
  it as a display hint; parse to a real `Date` only defensively.
- Messages before the first visible separator (top of the loaded history) have an
  empty timestamp.

### Example

Thread:

```
9:41 PM
Alex: hey
You: hi!!
3:15 PM
Alex: you up?
```

produces (before base64url-encoding):

```
convo = "Alex: hey\nYou: hi!!\nAlex: you up?"
times = "9:41 PM\n9:41 PM\n3:15 PM"
```

Consuming `times` is optional — ignoring it leaves today's paste/analyze flow
unchanged.

## How sender detection works

Instagram's class names are obfuscated and change often, so the scraper doesn't
use them. It detects who sent each message by **horizontal alignment** — your
bubbles hug the right of the thread column, theirs hug the left. This is far more
resilient to Instagram UI changes than CSS selectors, but it's still a heuristic:
verify the "Who are you?" toggle before analyzing, and lead your live demo with
the canned demo convos.

## Privacy

Messages are read on demand and handed straight to the app via the URL. The
extension stores nothing.
