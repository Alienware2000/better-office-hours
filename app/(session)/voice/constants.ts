// Immediate opening speech needs no model call. Names come from the app's
// verified account or connected Canvas profile, never a developer default.
const GREETINGS = [
  "I'm your office hours tutor. What are we working on today?",
  "What would you like to work through today?",
  "I'm here for office hours. Where would you like to start?",
];
export function pickGreeting(studentName?: string): string {
  const first = studentName?.trim().split(/\s+/)[0].slice(0, 60);
  return `${first ? `Hi ${first}. ` : 'Hi. '}${GREETINGS[Math.floor(Math.random() * GREETINGS.length)]}`;
}
export const CHIPS = ["Homework", "Explain a concept", "Something else"] as const;
export type OrbState = "idle" | "listening" | "thinking" | "speaking";
