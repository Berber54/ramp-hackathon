# 🔥 Delulu Detector — Build Spec & Team Plan
### Builders Cup 2026 · Ramp Hackathon · ~4.5 hr build window (11:00 AM – 3:30 PM)

---

## TL;DR

**Delulu Detector** reads your conversation with a situationship and tells you, brutally and honestly, whether you're **cooked**. Paste or upload the chat → get a shareable verdict card (Cooked Score, red/green flags with receipts, delusion level, and a savage roast) → then keep chatting with the bot, which remembers the whole convo.

**One-liner for the booth:** *"Paste your talking-stage. Find out if you're cooked. Screenshot the damage."*

**Target tracks:**
- 🗳️ **Audience Favorite** (primary) — relatable pain, instant laughs, a screenshot-able card people *want* to share.
- 🛠️ **Best Use of Sponsors** (secondary) — the whole app is **built with Codex** (scaffolding, parsers, tests, PRs) and the runtime brain calls **OpenAI's API**.

---

## The winning insight

The roaster is **savage but rooted in truth**. It never invents evidence — every flag cites a real quote ("receipt") from the convo. If you're genuinely doing fine, it *says so* and gives you green flags. This is what separates us from a joke Twitter bot: it's calibrated, so the verdict feels earned. It also unlocks our best demo moment (see Demo Script).

---

## Architecture (keep it boring, ship it fast)

```
  ┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
  │  INTAKE      │────▶│  BRAIN (API)      │────▶│  THE REVEAL         │
  │  paste/upload│     │  /api/analyze     │     │  Cooked-o-meter     │
  │  parse convo │     │  → OpenAI + prompt│     │  flags + receipts   │
  │  demo loader │     │  → structured JSON│     │  roast + share card │
  └─────────────┘     └──────────────────┘     └────────────────────┘
                              │                          │
                              ▼                          ▼
                       ┌──────────────┐          ┌──────────────┐
                       │ /api/chat     │◀────────▶│  CHAT MODE    │
                       │ (keeps convo  │          │  keep roasting│
                       │  as context)  │          │  w/ context   │
                       └──────────────┘          └──────────────┘
```

**Recommended stack (optimized for speed + a public demo URL):**
- **Next.js + Tailwind**, deployed on **Vercel** (instant public URL → QR code at the booth).
- API routes (`/api/analyze`, `/api/chat`) so the OpenAI key stays server-side.
- `html-to-image` (or `dom-to-image`) for the screenshot-able result card.
- Let **Codex do the grunt work**: repo scaffold, the WhatsApp parser, the JSON types, tests. Write an `AGENTS.md` at kickoff so Codex knows your conventions.

---

## 🔒 The contract (lock this in the FIRST 15 minutes)

Everyone builds against this JSON shape so all four of you work in parallel without waiting on each other. **Do not change it after kickoff without telling the group.**

```json
{
  "cooked_score": 87,
  "verdict": "You are the side quest, not the main story.",
  "delusion_level": "Clinically delulu",
  "roast": "A savage-but-true paragraph...",
  "red_flags": [
    { "flag": "Takes 8 hours to reply, then just 'lol'", "receipt": "actual quote from convo" }
  ],
  "green_flags": [
    { "flag": "Actually asked about your day", "receipt": "actual quote from convo" }
  ],
  "verdict_emoji": "🔥"
}
```

- `cooked_score`: 0 (thriving) → 100 (you are so cooked). **Must be calibrated** — low if the convo is genuinely healthy.
- `delusion_level`: a funny label, e.g. `"Mild copium"` → `"Clinically delulu"`, or `"Actually valid"` if they're not cooked.
- Every flag **must** have a `receipt` = a real quote. No receipt, no flag.

---

## 🧠 The system prompt (ready to paste — Person B owns tuning)

> You are **Delulu Detector**, a brutally honest but truthful dating-situation analyst. You read a conversation between the user and their romantic interest and decide whether the user is "cooked" — i.e., the other person isn't into them and the situation is going nowhere.
>
> **Voice:** savage, funny, roast-style, fluent in group-chat/Gen-Z humor. Roast the *situation*, never the user's worth as a person.
>
> **Rooted in truth — non-negotiable:** Never invent evidence. Every red or green flag MUST cite an actual quote from the conversation as its `receipt`. If the conversation is genuinely going *well*, be honest: give a LOW `cooked_score`, list green flags, and hype the user up. "Not cooked" is a real, common outcome — do not force a doomed verdict.
>
> **Signals to weigh:** reply-time and effort asymmetry, who initiates, dry vs. enthusiastic replies ("k", one-word answers), left-on-read patterns, concrete future plans vs. vague non-commitment, breadcrumbing, whether they ask questions back, escalation vs. stagnation.
>
> **Scoring calibration:** mutual effort + real plans → 0–30. Mixed signals → 30–65. Consistent dryness / one-sided effort / avoidance → 65–100.
>
> Return **ONLY** valid JSON matching the provided schema. No markdown, no preamble.

*(Person B: append the exact JSON schema to this prompt and enforce `response_format: json` / validate + one retry on parse failure.)*

---

## 👥 Roles (4 people — claim your lane at kickoff)

### 🅰️ Person A — Intake & Parsing
Owns everything that gets a conversation *into* the app.
- [ ] Landing screen: big paste box + file upload + **"Try a demo convo" button** (this button is sacred — never live-demo on unknown data).
- [ ] Paste flow: turn raw pasted text into the message array.
- [ ] Upload flow: parse a **WhatsApp `.txt` export**. Format looks like `[2026-07-18, 10:32] Alex: hey` or `7/18/26, 10:32 - Alex: hey` — split lines, pull sender + message, ignore system lines ("Messages are encrypted…").
- [ ] "Who are you?" toggle so the model knows which sender is the user.
- [ ] Fire `POST /api/analyze` and hand the JSON to Person C.
- **De-risk:** ship 2–3 canned demo convos (one very cooked, one healthy) that A + D agree on early.

### 🅱️ Person B — The Brain (Analysis + Chat API)
Owns the LLM and the data contract.
- [ ] `/api/analyze` — calls OpenAI, injects the system prompt, returns validated JSON (the contract above).
- [ ] `/api/chat` — follow-up mode: takes the original convo + the verdict + new user messages, stays in savage-roaster character, keeps context.
- [ ] Own + tune the system prompt; calibrate scoring so it's honest when not cooked.
- [ ] JSON validation + one automatic retry on malformed output.
- **Blocker to clear in first 20 min:** confirm the runtime LLM key/credits (see Open Decisions).

### 🅲️ Person C — The Reveal (the money shot)
Owns the hero screen — this is what wins Audience Favorite.
- [ ] Animated **Cooked-o-meter** dial (needle sweeps to the score — make the reveal *dramatic*, ~1.5s).
- [ ] Result card: score, verdict line, delusion level, red flags + green flags **with receipts shown**, the roast.
- [ ] **Screenshot / share card** via `html-to-image` → "Save your verdict" button. This is the virality engine.
- **Start immediately against a MOCKED JSON blob** — do not wait for Person B.

### 🅳️ Person D — Chat UI + Design + Deploy + Demo (glue + hype)
Owns cohesion and the actual performance.
- [ ] Follow-up **chat interface** (the second feature) — wired to `/api/chat`, keeps the convo context.
- [ ] Overall theme: enforce the 3 shared design tokens picked at kickoff (color, font, vibe) so all screens match.
- [ ] **Deploy to Vercel + generate a QR code** for the booth ("scan to roast yourself").
- [ ] **Write + rehearse the 2-minute demo** and prep the sample convos with Person A. Demo prep is a real job — own it.

---

## ⏱️ Timeline

| Time | Block | Goal |
|---|---|---|
| 11:00–11:20 | **Kickoff** | Lock JSON contract, stack, repo, `AGENTS.md`, 3 design tokens. Confirm LLM key. Everyone claims a lane. |
| 11:20–1:00 | **Sprint 1** | Build core in parallel. A: intake+parser. B: `/api/analyze`+prompt. C: reveal (mocked data). D: shell+theme+deploy skeleton. *Grab lunch ~12:45, keep momentum.* |
| 1:00–1:15 | **Checkpoint #1** | First real end-to-end verdict: A → B → C on a demo convo. |
| 1:15–2:30 | **Sprint 2** | Chat mode, share-card export, design polish, live deploy. |
| 2:30–2:50 | **Checkpoint #2** | Full flow works on the demo convo. **Feature freeze.** |
| 2:50–3:20 | **Polish + rehearse** | Finalize sample convos, QR code, run the demo twice out loud. |
| 3:20–3:30 | **Buffer** | Breathe. Don't push new code. |
| **3:30** | **Demos + Awards** | Perform. |

---

## ✂️ Cut list (if you're behind — cut top-down)
1. Drop the WhatsApp file parser → **paste-only**.
2. Drop free chat mode → keep just the verdict card.
3. Hardcode ONE demo convo and nail the reveal on it.
> A polished single flow beats three broken features. Every time.

## 🚀 Stretch goals (only if Checkpoint #2 is green)
- 🎤 **Eavesdrop mode** — live IRL transcription via the browser Web Speech API (huge wow, but risky — strictly stretch).
- 🏆 **Booth leaderboard** — most-cooked convo of the day.
- 👀 **Couples mode** — roast both sides.

---

## 🎬 Demo script (Person D — ~2 min, Audience Favorite is won here)
1. **Hook (10s):** "Everyone's got that one chat they've reread 40 times. We built a machine to tell you the truth." *(instant relatability laugh)*
2. **Live paste (20s):** Paste the spicy demo convo. Hit Analyze.
3. **The reveal (20s):** Let the Cooked-o-meter *sweep* to 91. Read the roast out loud — let the crowd laugh.
4. **The honesty beat (20s):** "But it's not just mean —" paste the *healthy* convo → low score, green flags. Shows it's smart, not a gimmick. **This beat wins credibility.**
5. **The share (15s):** Hit "Save your verdict" → show the card. "Screenshot-able. Built to be sent to the group chat."
6. **Sponsor close (15s):** "Scaffolded and shipped with **Codex**, brain runs on **OpenAI**." Flash the QR: "Scan it. Find out if *you're* cooked." *(mic drop)*

---

## ✅ Open decisions to lock at kickoff
1. **Runtime LLM key/credits** — the app calls OpenAI at runtime; who has a key, and are there credits? **Ask the organizers whether OpenAI API credits are available** (it strengthens the sponsor story). Have a fallback provider ready if not. *This is the one thing that can hard-block you — sort it first.*
2. **3 design tokens** — pick a primary color, a display font, and a vibe word (e.g. "unhinged Duolingo") in 5 minutes so screens match.
3. **Sample convos** — A + D agree on 2–3 canned chats (one very cooked, one healthy) before Sprint 1 ends.

## 🔐 Quick privacy note (also a good demo line)
You're processing people's private messages. Don't persist them; process per-request and drop them. Saying *"nothing is stored — it runs and forgets"* at the booth actually builds trust and is worth a sentence in the demo. (If you add mic mode, get the other person's consent — mention it.)
