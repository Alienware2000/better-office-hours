"use client";

import type { StudentInk } from "@/lib/whiteboard/colors";
import { STUDENT_HEX } from "@/lib/whiteboard/colors";

export type BoardTool = "pen" | "highlighter" | "eraser";

export function BoardInkBar({
  tool,
  color,
  onTool,
  onColor,
}: {
  tool: BoardTool;
  color: StudentInk;
  onTool: (tool: BoardTool) => void;
  onColor: (color: StudentInk) => void;
}) {
  return (
    <div className="ink-bar board-ink-bar" role="toolbar" aria-label="Board ink">
      <div className="ink-cluster">
        <ToolButton label="Pen" pressed={tool === "pen"} onClick={() => onTool("pen")}>
          <PenIcon />
        </ToolButton>
        <ToolButton
          label="Highlighter"
          pressed={tool === "highlighter"}
          onClick={() => onTool("highlighter")}
        >
          <MarkerIcon />
        </ToolButton>
        <ToolButton
          label="Eraser"
          pressed={tool === "eraser"}
          onClick={() => onTool("eraser")}
        >
          <EraserIcon />
        </ToolButton>
      </div>
      <div className="ink-cluster" aria-label="Ink color">
        {(["ink", "rust", "gold"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={["ink-swatch", color === value ? "is-on" : ""].filter(Boolean).join(" ")}
            style={{ background: STUDENT_HEX[value] }}
            aria-label={value === "ink" ? "Black ink" : value === "rust" ? "Rust ink" : "Gold ink"}
            aria-pressed={color === value}
            onClick={() => onColor(value)}
          />
        ))}
      </div>
    </div>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={["ink-tool", pressed ? "is-on" : ""].filter(Boolean).join(" ")}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M14.5 5.5 18.5 9.5 9 19H5v-4zM13 7l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 18h12M8 15.5 15.5 8l2.5 2.5-7.5 7.5H8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="m7 15 6-6 5 5-4 4H8zM9.5 12.5l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
