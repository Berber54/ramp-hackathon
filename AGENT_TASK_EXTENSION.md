# Agent Task — Instagram DM → Delulu Detector browser extension

> **Owner:** one agent, end to end. Work through Part A first (cleanup), then Part B
> (the extension), then Part C (verify). Do not stop until all acceptance criteria pass.

## Mission

Make the **only** way to import a real conversation be the **Chrome extension that reads
the Instagram DM thread you're currently viewing** and hands it to the web app prefilled.
Rip out the Telegram and WhatsApp import paths entirely — we don't use them.

## Context you need

- **App:** Delulu Detector — a Next.js 16 (App Router) + Tailwind v4 app. Paste a chat →
  get a "Cooked Score" verdict with receipts → keep roasting in chat.
- **LLM:** **OpenAI**. This is the only model provider. Do not add, mention, or wire up any
  other provider. The server routes (`/api/analyze`, `/api/chat`) already call OpenAI via
  `src/lib/llm.ts` and fall back to mock verdicts when `OPENAI_API_KEY` is unset — leave
  that behavior intact.
- **Intake flow** lives in `src/components/IntakeScreen.tsx`. It already supports:
  - Paste "Name: message" text (keep this)
  - "Try a demo convo" buttons from `src/lib/demo-convos.ts` (keep this)
  - A `?convo=<base64url>&me=<sender>` URL handoff decoded in a `useEffect` (**keep this —
    the extension depends on it**)
  - WhatsApp `.txt` upload (**remove**) and a "Pull from Telegram" box (**remove**)
- **Extension** already exists in `extension/` (manifest v3, `content.js`, `popup.js`,
  `popup.html`, `README.md`). It is close to done; your job is to finish, harden, and verify
  it — not rewrite it from scratch.

---

## Part A — Remove Telegram & WhatsApp

### Delete these files
- `src/lib/telegram.ts`
- `src/lib/telegram.test.ts`
- `src/app/api/telegram/route.ts` (and remove the now-empty `src/app/api/telegram/` folder)
- `scripts/telegram-login.mjs`
- `src/lib/parse-whatsapp.ts`
- `src/lib/parse-whatsapp.test.ts`

### Edit these files
- **`src/lib/analyze.ts`** — delete `importFromTelegram()` and the `TelegramImport` type.
  Keep `AnalyzeError` and `analyzeConversation()`.
- **`src/components/IntakeScreen.tsx`** — remove:
  - imports of `parseWhatsAppExport` and `importFromTelegram`
  - the `telegramName`, `isPulling` state and `handleTelegramPull()`
  - the file-upload path: `fileInputRef`, `handleFileUpload()`, the hidden `<input type="file">`,
    and the "Upload WhatsApp .txt" button
  - the entire "Pull from Telegram" `<div>` UI block (the sky-colored card)
  - update the paste parse-error copy so it no longer says "or paste a WhatsApp export"
    (e.g. `Could not parse messages. Use "Name: message" per line.`)
  - **Do not touch** the `?convo=`/`?me=` `useEffect` import handoff, paste handling, demo
    convos, the "Who are you?" sender picker, or `handleAnalyze()`.
- **`next.config.ts`** — remove `serverExternalPackages: ["telegram"]` (the whole option if it
  becomes empty).
- **`package.json`** — remove the `"telegram"` dependency and the `"telegram:login"` script.
  Then run the package manager install so `package-lock.json` updates.
- **`.env.example`** — remove the `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` / `TELEGRAM_SESSION`
  block and its comment header. Keep `OPENAI_API_KEY` (and `OPENAI_MODEL` / `OPENAI_BASE_URL`).
- **`README.md`** — delete the "Pull chats from Telegram" section and the WhatsApp-upload
  mentions; update the intake description and the env-vars table to drop Telegram rows.
  The intake list should read: paste · demo convo · **Instagram extension import**.

### After removal
- Grep the repo (excluding `.next/`, `node_modules/`) for `telegram` and `whatsapp`
  (case-insensitive) — there should be **zero** remaining references outside this task file.
- `npm run lint`, `npm run test`, and `npm run build` must all pass with no dangling imports.

---

## Part B — Finish & harden the Instagram DM extension

The extension opens the app in a new tab with the scraped DM thread prefilled via
`?me=You&convo=<base64url>`. The web-app side of that handoff already exists and must keep
working after Part A.

Do the following in `extension/`:

1. **`popup.js` — `APP_URL`:** it currently defaults to the placeholder
   `https://your-app.vercel.app`. Make the flow robust:
   - If `APP_URL` is still the placeholder, keep showing the existing clear "Set APP_URL"
     error (already implemented) — good.
   - Prefer reading a locally configured URL if present (see step 4). Fall back to the
     constant otherwise.
2. **Sender detection:** `content.js` detects "You" vs. the contact by horizontal alignment
   of message bubbles (right = you), because Instagram class names are obfuscated and churn.
   Keep this heuristic. Verify it still selects sane senders on a current Instagram DM layout
   and that the virtualized-list caveat (only on-screen bubbles are read) is handled — the
   popup should tell the user to scroll up for more history when few messages are found.
3. **Robustness / UX:** confirm the popup handles these states with a clear status message and
   re-enabled button: not on an Instagram tab, content script not attached (reload prompt),
   scrape returned zero messages, and success (`Sent N messages → roasting…`). These exist;
   verify and tighten copy if needed. Keep `MAX_MESSAGES` capping so the handoff URL stays
   under browser length limits.
4. **Configurable URL (nice-to-have, do if time allows):** add a small input in `popup.html`
   to set/persist `APP_URL` via `chrome.storage.local`, so a demo machine can point at
   localhost or the deploy without editing source. Add the `"storage"` permission to
   `manifest.json` only if you implement this.
5. **`extension/README.md`:** update so setup no longer implies WhatsApp/Telegram anywhere and
   accurately reflects the final popup behavior (including the URL config if you add it).

Do **not** add programmatic Instagram login, background network calls, or any data storage.
The extension must only read what is already rendered in the user's own logged-in tab and
hand it off via the URL — this is the whole privacy/safety story.

---

## Part C — Verify end to end

1. `npm install` (or the project's package manager) succeeds; no `telegram` package remains.
2. `npm run lint` → clean. `npm run test` → green (remember the whatsapp/telegram test files
   are gone). `npm run build` → succeeds.
3. `npm run dev`, open `/`, and confirm: paste flow works, demo convos work, the "Who are you?"
   picker works, and analyze returns a verdict (mock is fine without a key).
4. Simulate the extension handoff without Instagram: open
   `http://localhost:3000/?me=You&convo=<base64url of "Alex: hey\nYou: hi">` and confirm the
   textarea prefills, "You" is preselected, and the query string is stripped from the URL bar.
5. Load `extension/` unpacked in Chrome (`chrome://extensions` → Developer mode → Load
   unpacked), open a real Instagram DM, click **Roast this chat**, and confirm a new tab opens
   on the app with the thread prefilled.

## Acceptance criteria
- [ ] No Telegram or WhatsApp code, deps, scripts, env vars, or docs remain (grep is clean).
- [ ] `lint`, `test`, and `build` all pass.
- [ ] The `?convo=`/`?me=` import handoff still works.
- [ ] The Instagram extension scrapes the open thread and opens the app prefilled.
- [ ] OpenAI remains the sole LLM provider; mock fallback still works with no key.

## Out of scope
- Changing the verdict JSON contract in `src/lib/types.ts`.
- Adding new LLM providers or model-routing logic.
- Any server-side persistence — the app runs and forgets.
