"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * Booth display — a big "scan to roast yourself" QR for the demo table.
 * The QR points at NEXT_PUBLIC_APP_URL if set, otherwise the current origin,
 * so it just works once deployed to Vercel.
 */
export default function BoothPage() {
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_APP_URL ?? "");

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setUrl(window.location.origin);
    }
  }, [url]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-[radial-gradient(circle_at_top,#2a0a1f,#0a0a0a)] px-6 py-12 text-center text-white">
      <div className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-flame,#ff2d7e)]">
          Delulu Detector
        </p>
        <h1 className="font-display text-5xl font-black leading-none tracking-tight sm:text-6xl">
          Scan to roast
          <br />
          yourself 🔥
        </h1>
        <p className="mx-auto max-w-md text-lg text-zinc-300">
          Paste your talking stage. Find out if you&apos;re cooked. Screenshot the damage.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-2xl">
        {url ? (
          <QRCodeSVG
            value={url}
            size={280}
            level="M"
            marginSize={2}
            fgColor="#0a0a0a"
            bgColor="#ffffff"
          />
        ) : (
          <div className="flex h-[280px] w-[280px] items-center justify-center text-zinc-400">
            Loading…
          </div>
        )}
      </div>

      {url && (
        <p className="break-all font-mono text-sm text-zinc-400">{url}</p>
      )}

      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Scaffolded with Codex · Brain runs on OpenAI · Nothing is stored
      </p>
    </main>
  );
}
