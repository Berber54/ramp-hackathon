"use client";

import { useState } from "react";
import { IntakeScreen } from "@/components/IntakeScreen";
import { Reveal } from "@/components/Reveal";
import { ChatPanel } from "@/components/ChatPanel";
import type { Message, VerdictResult } from "@/lib/types";

/**
 * Integration shell — Intake (Teammate 1) → Reveal (Teammate 3) → Chat (Teammate D).
 * `context` (the original convo + who the user is) flows through to Chat mode.
 */
type Stage = "reveal" | "chat";

export default function Home() {
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [context, setContext] = useState<{
    messages: Message[];
    userSender: string;
  } | null>(null);
  const [stage, setStage] = useState<Stage>("reveal");

  const reset = () => {
    setVerdict(null);
    setContext(null);
    setStage("reveal");
  };

  if (verdict && context) {
    if (stage === "chat") {
      return (
        <ChatPanel
          verdict={verdict}
          messages={context.messages}
          userSender={context.userSender}
          onBack={() => setStage("reveal")}
        />
      );
    }
    return (
      <Reveal
        verdict={verdict}
        messages={context.messages}
        userSender={context.userSender}
        onBack={reset}
        onChat={() => setStage("chat")}
      />
    );
  }

  return (
    <IntakeScreen
      onVerdict={(nextVerdict, nextContext) => {
        setVerdict(nextVerdict);
        setContext(nextContext);
        setStage("reveal");
      }}
    />
  );
}
