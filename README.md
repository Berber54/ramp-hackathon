# 🔥 Delulu Detector

Paste your talking-stage. Find out if you're **cooked**. Screenshot the damage.

Delulu Detector reads a conversation with your situationship and returns a brutally
honest — but truthful — verdict: a **Cooked Score**, red/green flags with real
**receipts** (actual quotes), a delusion level, and a savage roast. Then you can keep
chatting with the roaster, which remembers the whole convo.

Built for Builders Cup 2026 · Ramp Hackathon. Scaffolded with **Codex**; the brain runs on **OpenAI**.

## Stack

- **Next.js 16** (App Router) + **Tailwind CSS v4**, deployed on **Vercel**.
- Server-side API routes keep the OpenAI key off the client:
  - `POST /api/analyze` → the verdict (the locked JSON contract).
  - `POST /api/chat` → follow-up roast with full context.
- `html-to-image` for the shareable verdict card, `qrcode.react` for the booth QR.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your OPENAI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **No key?** The app still runs — `/api/*` returns calibrated **mock** verdicts
> (look for the `x-delulu-source: mock` response header) so the full flow is demoable offline.

### Environment variables

| Var | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | for real verdicts | Falls back to mock data if unset. |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o`. |
| `OPENAI_BASE_URL` | no | Any OpenAI-compatible endpoint (fallback provider). |
| `NEXT_PUBLIC_APP_URL` | no | Absolute URL for the booth QR; defaults to the current origin. |

### Roast your Instagram DMs (Chrome extension)

There's a Chrome extension in [`extension/`](./extension) that reads the DM thread
you're currently viewing on Instagram and opens this app with it prefilled — no
login and no API keys, because it runs inside your own already-logged-in tab.

```bash
# 1. Set APP_URL in extension/popup.js to your deployed URL.
# 2. chrome://extensions → enable Developer mode → Load unpacked → pick extension/.
```

Open an Instagram DM, click the extension, hit **Am I delusional?**: a new tab opens
on the app with the convo prefilled (handed over via a `?convo=` URL param). Sender
is detected by message alignment (not brittle CSS class names), so confirm the
"Who are you?" toggle before analyzing. It reads only what's on screen and stores
nothing. See [`extension/README.md`](./extension/README.md) for details.

## Routes

- `/` — the app: intake (paste · demo convo · **Instagram extension import**) → verdict → chat.
- `/booth` — a full-screen **"scan to roast yourself"** QR for the demo table.
- `/preview` — internal preview of the verdict card against mock data.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (framework auto-detected as Next.js).
3. Add `OPENAI_API_KEY` under **Settings → Environment Variables**.
4. Deploy. Point the booth screen at `https://<your-app>.vercel.app/booth`.

CLI alternative:

```bash
npm i -g vercel
vercel            # first deploy / link project
vercel --prod     # production deploy
```

## Privacy

Messages are processed per-request and never persisted — it runs and forgets.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npm run test    # vitest
```
