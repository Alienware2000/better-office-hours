"use client";

import { useEffect, useRef } from "react";
import type { Turn } from "@/lib/types";
import { isJunkSpeech } from "./speech";

export function Captions({ turns }: { turns: Turn[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const spoken = turns.filter((turn) => turn.text.trim() && !isJunkSpeech(turn.text));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [spoken.length, spoken.at(-1)?.text]);

  if (!spoken.length) return null;

  return (
    <div className="captions" aria-live="polite">
      <div className="captions-scroll">
        {spoken.map((turn, index) => (
          <p
            key={`${turn.at}-${index}`}
            className={turn.role === "tutor" ? "caption caption-tutor" : "caption caption-student"}
          >
            {turn.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
