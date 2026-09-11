"use client";

import { useEffect, useRef } from "react";

// A quiet margin cue. No floating label or glow covers the text being read.
// Pixel-sized artwork stays the same size at every document zoom.
export function Pointer({ x, y, reduceMotion }: { x: number; y: number; reduceMotion: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const positionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf = 0;
    const move = () => {
      cancelAnimationFrame(raf);
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const goal = { x: x * width, y: y * height };
      const old = positionRef.current;
      let from = old ? { x: old.x * width, y: old.y * height } : { x: goal.x - 12, y: goal.y };
      let last = performance.now();
      const frame = (now: number) => {
        const fraction = reduceMotion ? 1 : 1 - Math.exp(-Math.max(1, now - last) / 55);
        last = now;
        from = { x: from.x + (goal.x - from.x) * fraction, y: from.y + (goal.y - from.y) * fraction };
        const settled = Math.hypot(goal.x - from.x, goal.y - from.y) < .15;
        if (settled) from = goal;
        headRef.current?.setAttribute('transform', `translate(${from.x} ${from.y})`);
        positionRef.current = { x: from.x / width, y: from.y / height };
        if (!settled) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    const observer = new ResizeObserver(move);
    observer.observe(host);
    move();
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [x, y, reduceMotion]);

  return <div ref={hostRef} className="laser" aria-hidden>
    <svg className="laser-svg" width="100%" height="100%">
      <g ref={headRef} className="laser-head">
        <path d="M -7 -4.5 L -1 0 L -7 4.5" fill="none" stroke="#b95832" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  </div>;
}
