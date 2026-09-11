"use client";

import type { InkColor, InkTool } from "./ink";
import { INK_HEX } from "./ink";

export function InkBar({
  tool,
  color,
  onTool,
  onColor,
  children,
}: {
  tool: InkTool;
  color: InkColor;
  onTool: (tool: InkTool) => void;
  onColor: (color: InkColor) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="ink-bar" role="toolbar" aria-label="Ink tools">
      <div className="ink-cluster">
        <ToolButton
          label="Move the page"
          pressed={tool === "hand"}
          onClick={() => onTool("hand")}
        >
          <HandIcon />
        </ToolButton>
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
            style={{ background: INK_HEX[value] }}
            aria-label={value === "ink" ? "Black ink" : value === "rust" ? "Rust ink" : "Gold ink"}
            aria-pressed={color === value}
            onClick={() => onColor(value)}
          />
        ))}
      </div>
      {children}
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

function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5.5a1.5 1.5 0 0 1 3 0V11M14 10.5V7.5a1.5 1.5 0 0 1 3 0V13c0 3.2-1.8 6-5.5 6.5S6 17 6 14.5V11a1.5 1.5 0 0 1 3 0v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
