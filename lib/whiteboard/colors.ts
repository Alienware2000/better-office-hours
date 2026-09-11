export type StudentInk = "ink" | "gold" | "rust";

export const BOARD_CREAM = "#fffcf6";

export const STUDENT_HEX: Record<StudentInk, string> = {
  ink: "#1c1917",
  gold: "#e0b15a",
  rust: "#c45c26",
};

export const TUTOR_HEX: Record<"ink" | "accent" | "muted" | "warn", string> = {
  ink: "#1c1917",
  accent: "#c45c26",
  muted: "#78716c",
  warn: "#c45c26",
};
