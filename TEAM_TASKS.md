# 🔥 Delulu Detector — Task Delegation (Team of 4)

> Full spec lives in [`delulu_detector_spec.md`](./delulu_detector_spec.md). This doc is the **who-does-what**.
> Four people, four lanes — claim yours at kickoff. Lanes map 1:1 to the spec's roles. You (coordinator) take **Person D**; delegate A/B/C to your teammates.

---

## The split at a glance

| Owner | Lane | One-line mission |
|---|---|---|
| **Teammate 1** | 🅰️ Intake & Parsing | Get a conversation *into* the app — paste, upload, demo button, parser. |
| **Teammate 2** | 🅱️ The Brain | Backend: analyze + chat APIs, the prompt, JSON validation. |
| **Teammate 3** | 🅲️ The Reveal | The money shot — Cooked-o-meter + result card + shareable screenshot. |
| **You** | 🅳️ Chat + Design + Deploy + Demo | Glue: chat UI, theme, Vercel deploy, QR, run the demo. |

**Why this holds up in parallel:** The Brain is a pure API. The Reveal builds against mocked JSON so it never waits. Intake produces a clean message array. You stitch it together and ship it.

---

## 🔒 FIRST 15 MINUTES — lock this together, then don't touch it

Everyone codes against this exact JSON shape so all four of us work in parallel. **No changes after kickoff without telling the group.**

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

Also lock in the first 15 min:
- **LLM key + credits** — the app calls OpenAI at runtime. Who has the key? Are there credits? Ask organizers about OpenAI credits (helps the sponsor story). Have a fallback provider ready. **This is the one thing that can hard-block us — sort it first.** (Teammate 2 drives, everyone confirms.)
- **3 design tokens** — primary color, display font, vibe word (e.g. "unhinged Duolingo"). (You drive.)
- **Repo + `AGENTS.md`** so Codex knows our conventions. (You drive.)
- **Sample convos** — 2–3 canned chats: one *very cooked*, one *healthy*. (Teammate 1 + You agree.)

---

## 🅰️ Teammate 1 — Intake & Parsing

You own everything that gets a conversation *into* the app.

**Checklist**
- [ ] **Landing screen:** big paste box + file upload + **"Try a demo convo" button** (sacred — the demo always runs on this, never on unknown data).
- [ ] **Paste flow:** raw pasted text → message array `[{ sender, text }]`.
- [ ] **Upload flow:** parse a **WhatsApp `.txt` export** (`[2026-07-18, 10:32] Alex: hey` or `7/18/26, 10:32 - Alex: hey`). Split lines, pull sender + message, drop system lines ("Messages are encrypted…"). *(Cut candidate — see cut list.)*
- [ ] **"Who are you?" toggle** so the model knows which sender is the user.
- [ ] Fire `POST /api/analyze` and hand the JSON to The Reveal (Teammate 3).

**De-risk:** ship 2–3 canned demo convos (one very cooked, one healthy) that you + You agree on early. Let Codex write the parser + its tests.

**Interfaces**
- Produces: message array `[{ sender, text }]` → consumed by The Brain (Teammate 2).

---

## 🅱️ Teammate 2 — The Brain (backend + LLM + the contract)

You own the LLM and the data contract. Nobody else touches `/api`.

**Checklist**
- [ ] `POST /api/analyze` — takes the message array, injects the system prompt, calls OpenAI, returns **validated** JSON matching the contract above.
- [ ] `POST /api/chat` — follow-up mode: takes original convo + the verdict + new user messages, stays in savage-roaster character, keeps full context.
- [ ] Own + tune the **system prompt** (paste-ready in spec §"The system prompt"). Append the exact JSON schema to it. Enforce `response_format: json`.
- [ ] JSON validation + **one automatic retry** on malformed output.
- [ ] **Calibrate scoring** so it's honest when NOT cooked (mutual effort + real plans → 0–30). This honesty beat wins credibility in the demo — don't force doom.

**First 20 min:** confirm the runtime LLM key/credits. If blocked, escalate immediately.

**Interfaces**
- Consumes: message array from Intake (Teammate 1).
- Produces: contract JSON → consumed by The Reveal (Teammate 3) and Chat UI (You).
- **Hand Teammate 3 a frozen mock JSON blob in the first 30 min** so they can build against something real.

---

## 🅲️ Teammate 3 — The Reveal (the money shot, wins Audience Favorite)

You own the hero screen. This is the screenshot people share. **Start immediately against a MOCKED JSON blob — do not wait for The Brain.**

**Checklist**
- [ ] Animated **Cooked-o-meter** dial — needle sweeps to the score, ~1.5s, dramatic. This is the reveal moment.
- [ ] **Result card:** score, verdict line, delusion level, red flags + green flags **with receipts shown**, the roast.
- [ ] **Screenshot / share card** via `html-to-image` (or `dom-to-image`) → "Save your verdict" button. This is the virality engine — make the card look great *as an image*.
- [ ] Handle both extremes gracefully: a 91 doom card AND a low-score "actually valid" green card (needed for the demo's honesty beat).

**First hour:** get the card rendering from a hardcoded JSON blob. Polish the sweep animation once static layout is done.

**Interfaces**
- Consumes: the contract JSON (mock first, then real from Teammate 2).

---

## 🅳️ You — Chat UI + Design + Deploy + Demo (glue + hype)

You own cohesion and the actual performance. Also the coordinator: you drive the contract lock, tokens, repo, and the demo.

**Checklist**
- [ ] **Chat UI** — follow-up interface wired to `/api/chat`, keeps convo context (the second feature).
- [ ] Enforce the **3 design tokens** across all screens so everything matches.
- [ ] **Deploy to Vercel + generate a QR code** for the booth ("scan to roast yourself").
- [ ] **Write + rehearse the 2-min demo** (spec §"Demo script"). Prep sample convos with Teammate 1.

**Demo prep is a real job — own it.** Run it out loud twice before 3:30.

---

## ⏱️ Timeline (from spec)

| Time | Block | Goal |
|---|---|---|
| 11:00–11:20 | **Kickoff** | Lock contract, stack, repo, `AGENTS.md`, 3 tokens. Confirm LLM key. Claim lanes. |
| 11:20–1:00 | **Sprint 1** | Build in parallel. A: intake + parser. B: `/api/analyze` + prompt. C: reveal (mocked). D: shell + theme + deploy skeleton. *Lunch ~12:45, keep momentum.* |
| 1:00–1:15 | **Checkpoint #1** | First real end-to-end verdict: A → B → C on a demo convo. |
| 1:15–2:30 | **Sprint 2** | Chat mode, share-card export, polish, live deploy. |
| 2:30–2:50 | **Checkpoint #2** | Full flow works on the demo convo. **Feature freeze.** |
| 2:50–3:20 | **Polish + rehearse** | Finalize sample convos, QR, run the demo twice out loud. |
| 3:20–3:30 | **Buffer** | Breathe. Don't push new code. |
| **3:30** | **Demos + Awards** | Perform. |

---

## ✂️ If we're behind — cut top-down (whoever owns it, drop it)

1. Drop the WhatsApp file parser → **paste-only** (A).
2. Drop free chat mode → keep just the verdict card (D + B).
3. Hardcode ONE demo convo and nail the reveal on it (C).

> A polished single flow beats three broken features. Every time.

## 🚀 Stretch (only if Checkpoint #2 is green)
Eavesdrop mode (live mic transcription) · Booth leaderboard · Couples mode.

## 🔐 Privacy (also a demo line)
Don't persist messages — process per-request and drop them. "Nothing is stored — it runs and forgets" builds trust at the booth.
