// The opening line is fixed text rather than a model call so the first word
// lands immediately. It varies per session so the tutor does not feel like a
// recording, and it introduces itself briefly before handing over.
const GREETINGS = [
  "Hey David, I'm your office hours tutor. What are we working on today?",
  "Hi David. I'm here for office hours whenever you are. What do you want to look at?",
  "Hey David, good to see you. I'm your tutor for this. Where do you want to start?",
  "Hi David, I'm your office hours tutor. What's on your plate right now?",
];

export function pickGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export const CHIPS = ["Homework", "Explain a concept", "Something else"] as const;

export type OrbState = "idle" | "listening" | "thinking" | "speaking";
