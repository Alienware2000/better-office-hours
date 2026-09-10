"use client";

import { useRef, useState } from "react";
import type { BBox } from "@/lib/types";
import {
  hitStroke,
  pointsToSvg,
  strokeWidth,
  type InkColor,
  type InkPoint,
  type InkStroke,
  type InkTool,
  INK_HEX,
} from "./ink";

export function Overlay({
  page,
  highlight,
  strokes,
  tool,
  color,
  onStroke,
  onErase,
}: {
  page: number;
  highlight?: BBox;
  strokes: InkStroke[];
  tool: InkTool;
  color: InkColor;
  onStroke: (stroke: InkStroke) => void;
  onErase: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<InkPoint[] | null>(null);
  const draftRef = useRef<InkPoint[]>([]);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const gestureRef = useRef<{
    pointerId: number;
    tool: "pen" | "highlighter" | "eraser";
    color: InkColor;
    origin: DOMRect;
  } | null>(null);

  const eraseAt = (point: InkPoint) => {
    const hits = strokesRef.current
      .filter((stroke) => hitStroke(stroke, point, stroke.tool === "highlighter" ? 0.05 : 0.03))
      .map((stroke) => stroke.id);
    if (hits.length) onErase(hits);
  };

  const pointAt = (event: { clientX: number; clientY: number }, origin: DOMRect): InkPoint => ({
    x: clamp01((event.clientX - origin.left) / origin.width),
    y: clamp01((event.clientY - origin.top) / origin.height),
  });

  const endGesture = () => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    const points = draftRef.current;
    draftRef.current = [];
    setDraft(null);
    if (!gesture || gesture.tool === "eraser" || points.length < 2) return;
    onStroke({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      page,
      tool: gesture.tool,
      color: gesture.color,
      points,
    });
  };

  return (
    <div
      className={["overlay", tool === "hand" ? "is-hand" : `is-${tool}`].join(" ")}
      onPointerDown={(event) => {
        if (event.button !== 0 || tool === "hand") return;
        event.preventDefault();
        if (gestureRef.current) {
          gestureRef.current = null;
          draftRef.current = [];
          setDraft(null);
        }
        const origin = event.currentTarget.getBoundingClientRect();
        const mark = tool === "highlighter" ? "highlighter" : tool === "eraser" ? "eraser" : "pen";
        const pointerId = event.pointerId;
        gestureRef.current = { pointerId, tool: mark, color, origin };
        try {
          event.currentTarget.setPointerCapture(pointerId);
        } catch {
          // Untrusted or already-released pointers still need to draw.
        }
        const start = pointAt(event, origin);
        if (mark === "eraser") {
          eraseAt(start);
        } else {
          draftRef.current = [start];
          setDraft([start]);
        }

        const onMove = (next: PointerEvent) => {
          const gesture = gestureRef.current;
          if (!gesture || next.pointerId !== gesture.pointerId) return;
          const point = pointAt(next, gesture.origin);
          if (gesture.tool === "eraser") {
            eraseAt(point);
            return;
          }
          draftRef.current = [...draftRef.current, point];
          setDraft(draftRef.current);
        };
        const onUp = (next: PointerEvent) => {
          if (next.pointerId !== pointerId) return;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          endGesture();
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      }}
    >
      {highlight ? <Marker key={boxKey(highlight)} bbox={highlight} /> : null}

      <svg className="ink-layer" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
        {strokes.map((stroke) => (
          <polyline
            key={stroke.id}
            className={stroke.tool === "highlighter" ? "ink-high" : "ink-pen"}
            points={pointsToSvg(stroke.points)}
            stroke={INK_HEX[stroke.color]}
            strokeWidth={strokeWidth(stroke.tool)}
          />
        ))}
        {draft && draft.length > 1 && (tool === "pen" || tool === "highlighter") ? (
          <polyline
            className={tool === "highlighter" ? "ink-high" : "ink-pen"}
            points={pointsToSvg(draft)}
            stroke={INK_HEX[color]}
            strokeWidth={strokeWidth(tool)}
          />
        ) : null}
      </svg>
    </div>
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function boxKey(box: BBox) {
  return `${box.x}-${box.y}-${box.w}-${box.h}`;
}

function Marker({ bbox }: { bbox: BBox }) {
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
