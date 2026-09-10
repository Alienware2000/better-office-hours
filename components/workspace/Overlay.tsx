"use client";

import { useState } from "react";
import type { BBox, StudentAnnotation } from "@/lib/types";

type Draft = { kind: StudentAnnotation["kind"]; bbox: BBox };

export function Overlay({
  highlight,
  annotations,
  onAnnotate,
}: {
  highlight?: BBox;
  annotations: StudentAnnotation[];
  onAnnotate: (kind: StudentAnnotation["kind"], bbox: BBox) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);

  return (
    <div
      className="overlay"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const root = event.currentTarget;
        const origin = root.getBoundingClientRect();
        const x0 = (event.clientX - origin.left) / origin.width;
        const y0 = (event.clientY - origin.top) / origin.height;

        const fromEvent = (point: PointerEvent): Draft | null => {
          const box = boxFromPoints(
            x0,
            y0,
            (point.clientX - origin.left) / origin.width,
            (point.clientY - origin.top) / origin.height,
          );
          return box ? { kind: markKind(box), bbox: box } : null;
        };

        const move = (next: PointerEvent) => {
          setDraft(fromEvent(next));
        };
        const up = (end: PointerEvent) => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
          setDraft(null);
          const next = fromEvent(end);
          if (next) onAnnotate(next.kind, next.bbox);
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      }}
    >
      {highlight ? <Marker key={boxKey(highlight)} bbox={highlight} /> : null}

      {draft ? <Mark className="mark-draft" kind={draft.kind} bbox={draft.bbox} /> : null}

      {annotations.map((mark, index) => (
        <Mark key={`${mark.at}-${index}`} kind={mark.kind} bbox={mark.bbox} />
      ))}
    </div>
  );
}

function Mark({
  kind,
  bbox,
  className,
}: {
  kind: StudentAnnotation["kind"];
  bbox: BBox;
  className?: string;
}) {
  return (
    <span
      className={["mark", kind === "underline" ? "mark-underline" : "mark-circle", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${bbox.x * 100}%`,
        top: `${bbox.y * 100}%`,
        width: `${bbox.w * 100}%`,
        height: kind === "underline" ? undefined : `${bbox.h * 100}%`,
      }}
    />
  );
}

function boxFromPoints(x0: number, y0: number, x1: number, y1: number): BBox | null {
  const bbox: BBox = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0),
  };
  if (bbox.w < 0.01 && bbox.h < 0.01) return null;
  return bbox;
}

function markKind(bbox: BBox): StudentAnnotation["kind"] {
  return bbox.h < 0.018 && bbox.w > 0.04 ? "underline" : "circle";
}

function boxKey(box: BBox) {
  return `${box.x}-${box.y}-${box.w}-${box.h}`;
}

function Marker({ bbox }: { bbox: BBox }) {
  // A thin box is a line of text: draw a highlighter stroke along it. A tall
  // box is a region: fill it, still with the same ink, so it does not read as
  // a selection rectangle.
  const line = bbox.h < 0.04;
  const path = line ? strokePath() : regionPath();

  return (
    <svg
      className="marker"
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      style={{
        left: `${bbox.x * 100}%`,
        top: `${bbox.y * 100}%`,
        width: `${bbox.w * 100}%`,
        height: `${bbox.h * 100}%`,
      }}
      aria-hidden
    >
      <path className="marker-ink" d={path} />
    </svg>
  );
}

function strokePath() {
  return [
    "M 1.2 14.8",
    "C 18 11.2, 38 16.4, 52 13.1",
    "C 68 9.6, 84 15.8, 98.6 12.4",
    "L 99 16.8",
    "C 84 19.6, 67 13.8, 52 17.2",
    "C 36 20.4, 18 15.2, 1.4 18.6",
    "Z",
  ].join(" ");
}

function regionPath() {
  return [
    "M 1.4 3.2",
    "C 22 1.4, 48 4.1, 72 2.2",
    "C 86 1.1, 96 3.6, 98.6 2.8",
    "L 98.8 21.4",
    "C 78 22.8, 54 20.2, 32 22.1",
    "C 16 23.4, 6 21.6, 1.6 21.2",
    "Z",
  ].join(" ");
}
