"use client";

import { useEffect, useRef, useState } from "react";

// How much of the remaining distance the head covers each frame. Low enough to
// read as a hand moving, high enough not to lag the tutor's voice.
const EASE = 0.11;
const TRAIL = 22;
const HEAD_R = 5.5;

// Last head, as a fraction of the host. Survives remounts so the laser keeps
// traveling when the tutor points at a new page instead of appearing there.
let lastNorm: { x: number; y: number } | null = null;

/**
 * A trailing laser pointer. The head eases toward the tutor's target every
 * frame and drags a fading tail behind it, so the movement reads as a hand
 * moving across the page rather than a dot teleporting between spots.
 *
 * The tail is drawn as separate segments that fade toward the back. A single
 * gradient-stroked path fades along the page's x axis instead of along the
 * direction of travel, which looks wrong whenever the pointer moves upward.
 *
 * Positions are in pixels, because a percentage-based circle stretches with
 * the page's aspect ratio.
 */
export function Pointer({
  x,
  y,
  label,
  reduceMotion,
}: {
  x: number;
  y: number;
  label?: string;
  reduceMotion: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const segmentRefs = useRef<(SVGLineElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const target = useRef({ x, y });
  target.current = { x, y };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ w: box.width, h: box.height });
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!size.w || !size.h) return;

    const place = (px: number, py: number) => {
      headRef.current?.setAttribute("cx", String(px));
      headRef.current?.setAttribute("cy", String(py));
      glowRef.current?.setAttribute("cx", String(px));
      glowRef.current?.setAttribute("cy", String(py));
      if (labelRef.current) {
        const flip = px > size.w - 140;
        labelRef.current.style.transform = flip
          ? `translate(calc(${px}px - 100% - 12px), ${py - 10}px)`
          : `translate(${px + 14}px, ${py - 10}px)`;
      }
    };

    const goalNow = () => ({
      x: target.current.x * size.w,
      y: target.current.y * size.h,
    });

    if (reduceMotion) {
      const goal = goalNow();
      place(goal.x, goal.y);
      lastNorm = { x: target.current.x, y: target.current.y };
      return;
    }

    const start = goalNow();
    // Arrive from a little below the first target, as if a hand came down the
    // page. Later points continue from wherever the head already was.
    let head = lastNorm
      ? { x: lastNorm.x * size.w, y: lastNorm.y * size.h }
      : { x: start.x, y: start.y + Math.min(56, size.h * 0.1) };
    const trail: { x: number; y: number }[] = [];
    let raf = 0;

    const frame = () => {
      const goal = goalNow();
      head = {
        x: head.x + (goal.x - head.x) * EASE,
        y: head.y + (goal.y - head.y) * EASE,
      };
      lastNorm = { x: head.x / size.w, y: head.y / size.h };

      trail.push({ ...head });
      while (trail.length > TRAIL) trail.shift();

      place(head.x, head.y);

      segmentRefs.current.forEach((line, index) => {
        if (!line) return;
        const from = trail[trail.length - 1 - index];
        const to = trail[trail.length - 2 - index];
        if (!from || !to) {
          line.setAttribute("stroke-opacity", "0");
          return;
        }
        const fade = 1 - index / (TRAIL - 1);
        line.setAttribute("x1", from.x.toFixed(1));
        line.setAttribute("y1", from.y.toFixed(1));
        line.setAttribute("x2", to.x.toFixed(1));
        line.setAttribute("y2", to.y.toFixed(1));
        line.setAttribute("stroke-opacity", (fade * 0.62).toFixed(3));
        line.setAttribute("stroke-width", (1.4 + fade * 3.4).toFixed(2));
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, size.h, size.w]);

  return (
    <div ref={hostRef} className="laser">
      <svg className="laser-svg" width={size.w} height={size.h} aria-hidden>
        {!reduceMotion &&
          Array.from({ length: TRAIL - 1 }, (_, index) => (
            <line
              key={index}
              ref={(node) => {
                segmentRefs.current[index] = node;
              }}
              className="laser-tail"
              stroke="#c45c26"
              strokeOpacity={0}
              strokeLinecap="round"
            />
          ))}
        <circle ref={glowRef} className="laser-glow" r={HEAD_R * 2.8} />
        <circle ref={headRef} className="laser-head" r={HEAD_R} />
      </svg>
      {label ? (
        <span ref={labelRef} className="laser-label">
          {label}
        </span>
      ) : null}
    </div>
  );
}
