export const GREETING = "Hey David. What do you want to work on?";

export const CHIPS = ["Homework", "Explain a concept", "Something else"] as const;

export type OrbState = "idle" | "listening" | "thinking" | "speaking";
