"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Turn } from "@/lib/types";
import { isJunkSpeech } from "./speech";

export function Captions({ turns }: { turns: Turn[] }) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [readingHistory, setReadingHistory] = useState(false);
  const spoken = turns.filter((turn) => turn.text.trim() && !isJunkSpeech(turn.text));
  const lastCaption = spoken.at(-1)?.text;
  const firstCaption = spoken[0]?.at;

  useEffect(() => {
    following.current = true;
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight });
  }, [firstCaption]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller && following.current) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    }
  }, [spoken.length, lastCaption, reduced]);

  function showLatest() {
    following.current = true;
    setReadingHistory(false);
    const scroller = scrollRef.current;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }

  function exportTranscript() {
    const text = ["Better Office Hours", "Session transcript (captions, not an audio recording)", "",
      ...spoken.map(turn => `${turn.role === "tutor" ? "Tutor" : "You"}: ${turn.text}\n`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `office-hours-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!spoken.length) return null;
  return (
    <motion.div layout transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 28 }} className={`captions${readingHistory ? " is-reading" : ""}`}>
      <div className="caption-tools">
        {readingHistory && <button type="button" onClick={showLatest}>Latest ↓</button>}
        <button type="button" onClick={exportTranscript} aria-label="Export session transcript">Export</button>
      </div>
      <div className="captions-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Session transcript"
        onScroll={event => {
          const el = event.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          following.current = atBottom;
          setReadingHistory(!atBottom);
        }}>
        {spoken.map((turn, index) => (
          <p key={`${turn.at}-${index}`} className={turn.role === "tutor" ? "caption caption-tutor" : "caption caption-student"}>
            {turn.text}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
