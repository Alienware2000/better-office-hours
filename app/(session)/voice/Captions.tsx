"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Turn } from "@/lib/types";
import { isJunkSpeech } from "./speech";

// Live captions, not a chat log. Older lines drop off the screen; the model
// still has the session until the student puts the paper away.
const LIVE_TURNS = 4;

export function Captions({ turns }: { turns: Turn[] }) {
  const reduced = useReducedMotion();
  const endRef = useRef<HTMLDivElement>(null);
  const spoken = turns
    .filter((turn) => turn.text.trim() && !isJunkSpeech(turn.text))
    .slice(-LIVE_TURNS);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [spoken.length, spoken.at(-1)?.text]);

  if (!spoken.length) return null;

  return (
    <motion.div layout transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 28 }} className="captions" aria-live="polite">
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
    </motion.div>
  );
}
