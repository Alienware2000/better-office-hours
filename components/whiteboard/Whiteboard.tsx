"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { StudentInk } from "@/lib/whiteboard/colors";
import { STUDENT_HEX } from "@/lib/whiteboard/colors";
import { getLiveBoard, setLiveBoard } from "@/lib/whiteboard/live-board";
import { snapshotBoard } from "@/lib/whiteboard/snapshot";
import {
  addStudentStroke,
  applyDrawCommands,
  eraseStudentStrokes,
  getBoardState,
  markGroupShown,
  openBoard,
  resetBoard,
  subscribeBoard,
  type BoardStroke,
} from "@/lib/whiteboard/store";
import { BoardInkBar, type BoardTool } from "./BoardInkBar";
import "./whiteboard.css";

export function Whiteboard({ active = true }: { active?: boolean }) {
  const [, setTick] = useState(0);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<StudentInk>("ink");
  const [draft, setDraft] = useState<{ x: number; y: number }[] | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<{ x: number; y: number }[]>([]);
  const reduceMotion = useReducedMotion() ?? false;
  const board = getBoardState();
  const pendingKey = board.groups
    .filter((group) => group.appear === "pending")
    .map((group) => group.id)
    .join(",");

  useEffect(() => subscribeBoard(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as Window & {
      __bohBoard?: {
        openBoard: typeof openBoard;
        applyDrawCommands: typeof applyDrawCommands;
        resetBoard: typeof resetBoard;
        addStudentStroke: typeof addStudentStroke;
        getLiveBoard: typeof getLiveBoard;
      };
    };
    w.__bohBoard = { openBoard, applyDrawCommands, resetBoard, addStudentStroke, getLiveBoard };
    return () => {
      delete w.__bohBoard;
    };
  }, []);

  useEffect(() => {
    const pending = getBoardState().groups.filter((group) => group.appear === "pending");
    if (!pending.length) return;
    if (reduceMotion) {
      pending.forEach((group) => markGroupShown(group.id));
      return;
    }
    const wait = window.setTimeout(() => markGroupShown(pending[0].id), 560);
    return () => window.clearTimeout(wait);
  }, [pendingKey, reduceMotion]);

  useEffect(() => {
    if (!active) {
      setLiveBoard(null);
      return;
    }
    const current = getBoardState();
    if (!current.open) {
      setLiveBoard(null);
      return;
    }
    const hasMarks = current.groups.length > 0 || current.student.length > 0;
    if (!hasMarks) {
      setLiveBoard({ imageUrl: "", studentShapesSince: "", open: true });
      return;
    }
    const paper = paperRef.current;
    if (!paper) return;
    const rect = paper.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    const snap = snapshotBoard(current.groups, current.student, rect.width, rect.height);
    if (!snap) return;
    setLiveBoard({
      imageUrl: snap.imageUrl,
      studentShapesSince: current.studentSince,
      open: true,
    });
  }, [active, board.open, board.groups, board.student, board.studentSince, board.seq]);

  useEffect(() => {
    return () => setLiveBoard(null);
  }, []);

  const enteringId = reduceMotion
    ? null
    : board.groups.find((group) => group.appear === "pending")?.id ?? null;

  return (
    <section
      className={["board-root", board.open ? "is-open" : ""].filter(Boolean).join(" ")}
      aria-hidden={!board.open}
      aria-label="Whiteboard"
    >
      <div className="board-paper" ref={paperRef}>
        {board.open ? (
          <BoardInkBar tool={tool} color={color} onTool={setTool} onColor={setColor} />
        ) : null}
        <div
          className={["board-surface", tool === "eraser" ? "is-eraser" : ""].join(" ")}
          onPointerDown={(event) => {
            if (!board.open || event.button !== 0) return;
            event.preventDefault();
            const origin = event.currentTarget.getBoundingClientRect();
            const pointerId = event.pointerId;
            try {
              event.currentTarget.setPointerCapture(pointerId);
            } catch {
              // Keep drawing if capture is denied.
            }
            const start = pointAt(event, origin);
            if (tool === "eraser") {
              eraseAt(start, getBoardState().student);
            } else {
              draftRef.current = [start];
              setDraft([start]);
            }

            const onMove = (next: PointerEvent) => {
              if (next.pointerId !== pointerId) return;
              const point = pointAt(next, origin);
              if (tool === "eraser") {
                eraseAt(point, getBoardState().student);
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
              const points = draftRef.current;
              draftRef.current = [];
              setDraft(null);
              if (tool === "eraser" || points.length < 2) return;
              addStudentStroke({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                tool,
                color,
                points,
              });
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
          }}
        >
          <svg className="board-layer" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
            {board.groups.map((group) => {
              if (group.appear === "pending" && group.id !== enteringId) return null;
              const enter = group.id === enteringId;
              return (
                <g
                  key={group.id}
                  className={["board-group", board.pulseId === group.id ? "is-pulse" : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {group.drawables.map((mark) => {
                    if (mark.kind === "text") {
                      return (
                        <text
                          key={mark.key}
                          className={["board-label", enter ? "is-entering" : ""]
                            .filter(Boolean)
                            .join(" ")}
                          x={mark.at.x}
                          y={mark.at.y}
                          fill={mark.color}
                          fontSize={mark.size === "m" ? 0.058 : 0.044}
                          textAnchor="middle"
                        >
                          {mark.text}
                        </text>
                      );
                    }
                    return (
                      <path
                        key={mark.key}
                        className={[
                          mark.kind === "head" ? "board-head" : "board-path",
                          mark.kind === "path" && mark.dashed && !enter ? "is-dashed" : "",
                          enter ? "is-entering" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        d={mark.d}
                        pathLength={mark.kind === "path" ? 1 : undefined}
                        stroke={mark.color}
                      />
                    );
                  })}
                </g>
              );
            })}
            {board.student.map((stroke) => (
              <polyline
                key={stroke.id}
                className={["board-student", stroke.tool === "highlighter" ? "is-high" : "is-pen"]
                  .filter(Boolean)
                  .join(" ")}
                points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")}
                stroke={STUDENT_HEX[stroke.color]}
              />
            ))}
            {draft && draft.length > 1 ? (
              <polyline
                className={["board-student", tool === "highlighter" ? "is-high" : "is-pen"].join(
                  " ",
                )}
                points={draft.map((point) => `${point.x},${point.y}`).join(" ")}
                stroke={STUDENT_HEX[color]}
              />
            ) : null}
          </svg>
        </div>
      </div>
    </section>
  );
}

function pointAt(
  event: { clientX: number; clientY: number },
  origin: DOMRect,
): { x: number; y: number } {
  return {
    x: clamp01((event.clientX - origin.left) / origin.width),
    y: clamp01((event.clientY - origin.top) / origin.height),
  };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function eraseAt(point: { x: number; y: number }, strokes: BoardStroke[]) {
  const hits = strokes
    .filter((stroke) => hitStroke(stroke, point, stroke.tool === "highlighter" ? 0.05 : 0.03))
    .map((stroke) => stroke.id);
  if (hits.length) eraseStudentStrokes(hits);
}

function hitStroke(stroke: BoardStroke, point: { x: number; y: number }, radius: number) {
  return stroke.points.some((existing) => {
    const dx = existing.x - point.x;
    const dy = existing.y - point.y;
    return dx * dx + dy * dy <= radius * radius;
  });
}
