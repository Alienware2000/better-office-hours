import { boardStyle } from "./style";
export type StudentInk = "ink" | "gold" | "rust";

export const BOARD_CREAM = boardStyle.paper;

export const STUDENT_HEX: Record<StudentInk, string> = {
  ink: "#1c1917",
  gold: "#e0b15a",
  rust: "#c45c26",
};

export const TUTOR_HEX = boardStyle.colors;
