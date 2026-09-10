"use client";

import type { BBox, StudentAnnotation } from "@/lib/types";

export function Overlay({
  highlight,
  annotations,
  onAnnotate,
}: {
  highlight?: BBox;
  annotations: StudentAnnotation[];
  onAnnotate: (kind: StudentAnnotation["kind"], bbox: BBox) => void;
}) {
  return (
    <div
      className="overlay"
      onPointerDown={(event) => {
        const root = event.currentTarget;
        const origin = root.getBoundingClientRect();
        const x0 = (event.nativeEvent.clientX - origin.left) / origin.width;
        const y0 = (event.nativeEvent.clientY - origin.top) / origin.height;

        const up = (end: PointerEvent) => {
          window.removeEventListener("pointerup", up);
          const x1 = (end.clientX - origin.left) / origin.width;
          const y1 = (end.clientY - origin.top) / origin.height;
          const bbox: BBox = {
            x: Math.min(x0, x1),
            y: Math.min(y0, y1),
            w: Math.abs(x1 - x0),
            h: Math.abs(y1 - y0),
          };
          if (bbox.w < 0.01 && bbox.h < 0.01) return;
          const kind: StudentAnnotation["kind"] =
            bbox.h < 0.018 && bbox.w > 0.04 ? "underline" : "circle";
          onAnnotate(kind, bbox);
        };
        window.addEventListener("pointerup", up);
      }}
    >
      {highlight ? <Marker key={boxKey(highlight)} bbox={highlight} /> : null}

      {annotations.map((mark, index) => (
        <span
          key={`${mark.at}-${index}`}
          className={mark.kind === "underline" ? "mark mark-underline" : "mark mark-circle"}
          style={{
            left: `${mark.bbox.x * 100}%`,
            top: `${mark.bbox.y * 100}%`,
            width: `${mark.bbox.w * 100}%`,
            height: mark.kind === "underline" ? undefined : `${mark.bbox.h * 100}%`,
          }}
        />
      ))}
    </div>
  );
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
