"use client";

import type { BBox, StudentAnnotation } from "@/lib/types";

export function Overlay({
  pointer,
  highlight,
  annotations,
  onAnnotate,
}: {
  pointer?: { x: number; y: number; label?: string };
  highlight?: BBox;
  annotations: StudentAnnotation[];
  onAnnotate: (kind: StudentAnnotation["kind"], bbox: BBox) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-10"
      onPointerDown={(event) => {
        const root = event.currentTarget;
        const start = event.nativeEvent;
        const origin = root.getBoundingClientRect();
        const x0 = (start.clientX - origin.left) / origin.width;
        const y0 = (start.clientY - origin.top) / origin.height;

        const move = (next: PointerEvent) => {
          void next;
        };
        const up = (end: PointerEvent) => {
          window.removeEventListener("pointermove", move);
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
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    >
      {highlight ? (
        <div
          className="pointer-events-none absolute rounded-sm bg-[#C45C26]/10 ring-2 ring-[#C45C26]/80"
          style={{
            left: `${highlight.x * 100}%`,
            top: `${highlight.y * 100}%`,
            width: `${highlight.w * 100}%`,
            height: `${highlight.h * 100}%`,
            transition: "left 0.55s ease, top 0.55s ease, width 0.55s ease, height 0.55s ease",
          }}
        />
      ) : null}

      {annotations.map((mark, index) => (
        <div
          key={`${mark.at}-${index}`}
          className={
            mark.kind === "underline"
              ? "pointer-events-none absolute border-b-2 border-zinc-800"
              : "pointer-events-none absolute rounded-full border-2 border-zinc-800"
          }
          style={{
            left: `${mark.bbox.x * 100}%`,
            top: `${mark.bbox.y * 100}%`,
            width: `${mark.bbox.w * 100}%`,
            height: mark.kind === "underline" ? 0 : `${mark.bbox.h * 100}%`,
          }}
        />
      ))}

      {pointer ? (
        <div
          className="pointer-events-none absolute flex items-center gap-1"
          style={{
            left: `${pointer.x * 100}%`,
            top: `${pointer.y * 100}%`,
            transform: "translate(-50%, -50%)",
            transition:
              "left 0.7s cubic-bezier(0.22, 1, 0.36, 1), top 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <span className="block h-3 w-3 rounded-full bg-[#C45C26] shadow-[0_0_0_6px_rgba(196,92,38,0.22)]" />
          {pointer.label ? (
            <span className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-zinc-700">
              {pointer.label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
