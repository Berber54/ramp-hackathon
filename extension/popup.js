// Default Delulu Detector URL (no trailing slash). You can override this at
// runtime via the "App URL" box below — handy for pointing a demo machine at
// localhost or a fresh deploy without editing source. The override is stored in
// chrome.storage.local. The prefill handoff only works on a build that includes
// the ?convo= import code in IntakeScreen, so point this at your deploy.
const DEFAULT_APP_URL = "https://your-app.vercel.app";

// The content script scrolls the whole thread and returns every message it can
// load. We hand them all off, but cap the ENCODED payload so the request line
// stays under server/browser limits (Node's default max HTTP header size is
// ~16 KB, and that includes the URL). If a chat is longer than this, we keep the
// most recent messages that fit. Budget covers both the convo and times params.
const MAX_PAYLOAD_CHARS = 12000;

const button = document.getElementById("roast");
const statusEl = document.getElementById("status");
const urlInput = document.getElementById("app-url");
const saveButton = document.getElementById("save-url");

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", !!isError);
}

function isPlaceholder(url) {
  return !url || url.includes("your-app");
}

// Prefer a locally configured URL; fall back to the built-in default.
async function getAppUrl() {
  try {
    const { appUrl } = await chrome.storage.local.get("appUrl");
    if (appUrl && appUrl.trim()) return appUrl.trim().replace(/\/+$/, "");
  } catch {
    // storage unavailable — fall through to the default
  }
  return DEFAULT_APP_URL;
}

// UTF-8 → base64url, matching the decoder in the web app.
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function isInstagram(url) {
  return /^https:\/\/(www\.)?instagram\.com\//.test(url || "");
}

// Keep the most recent messages whose base64url-encoded payload fits the budget.
// `convo` is one "Sender: message" line per message; `times` is one raw
// timestamp label per message (index-aligned, empty when unknown).
function fitPayload(messages) {
  let kept = messages;
  while (kept.length > 0) {
    const convo = kept.map((m) => `${m.sender}: ${m.text}`).join("\n");
    const times = kept.map((m) => m.time || "").join("\n");
    const size = toBase64Url(convo).length + toBase64Url(times).length;
    if (size <= MAX_PAYLOAD_CHARS) {
      return { convo, times, kept, trimmed: kept.length < messages.length };
    }
    kept = kept.slice(1); // drop the oldest message and retry
  }
  return { convo: "", times: "", kept: [], trimmed: false };
}

async function run() {
  button.disabled = true;
  setStatus("Reading chat… scrolling for full history.");

  const appUrl = await getAppUrl();
  if (isPlaceholder(appUrl)) {
    setStatus('Set your app URL below (open "App URL"), then retry.', true);
    button.disabled = false;
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !isInstagram(tab.url)) {
    setStatus("Open an Instagram DM thread first.", true);
    button.disabled = false;
    return;
  }

  let res;
  try {
    res = await chrome.tabs.sendMessage(tab.id, { type: "DELULU_SCRAPE" });
  } catch {
    setStatus("Couldn't read the page. Reload the Instagram tab, then retry.", true);
    button.disabled = false;
    return;
  }

  if (!res || !res.ok) {
    setStatus("Scrape failed. Reload the Instagram tab and retry.", true);
    button.disabled = false;
    return;
  }

  const allMessages = res.messages || [];
  if (allMessages.length === 0) {
    setStatus("No messages found. Open a DM thread, then retry.", true);
    button.disabled = false;
    return;
  }

  const { convo, times, kept, trimmed } = fitPayload(allMessages);
  if (kept.length === 0) {
    setStatus("That first message is too long to hand off. Try a shorter chat.", true);
    button.disabled = false;
    return;
  }

  let url = `${appUrl}/?me=You&convo=${toBase64Url(convo)}`;
  // Only include timestamps if we actually captured any (keeps the URL lean).
  if (kept.some((m) => m.time)) {
    url += `&times=${toBase64Url(times)}`;
  }

  await chrome.tabs.create({ url });
  button.disabled = false;

  if (trimmed) {
    setStatus(
      `Sent the latest ${kept.length} of ${allMessages.length} messages → roasting…`,
    );
  } else {
    setStatus(`Sent ${kept.length} messages → roasting…`);
  }
}

async function saveUrl() {
  const raw = (urlInput.value || "").trim().replace(/\/+$/, "");
  if (!raw) {
    await chrome.storage.local.remove("appUrl");
    setStatus(`Cleared — using default (${DEFAULT_APP_URL}).`, isPlaceholder(DEFAULT_APP_URL));
    return;
  }
  if (!/^https?:\/\//.test(raw)) {
    setStatus("Enter a full URL, e.g. https://your-app.vercel.app", true);
    return;
  }
  await chrome.storage.local.set({ appUrl: raw });
  urlInput.value = raw;
  setStatus("Saved app URL.");
}

async function init() {
  try {
    const { appUrl } = await chrome.storage.local.get("appUrl");
    if (appUrl) urlInput.value = appUrl;
  } catch {
    // ignore — the field just stays empty
  }
}

button.addEventListener("click", () => {
  void run();
});

saveButton.addEventListener("click", () => {
  void saveUrl();
});

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void saveUrl();
});

void init();
