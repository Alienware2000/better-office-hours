/**
 * Things that happen in the workspace which should make the tutor speak
 * without the student having to prompt it. The client sends a kind, never
 * prose, so nothing it sends can rewrite the tutor's instructions.
 */
export type SessionEventKind = "pset_ready" | "student_mark" | "notes_ready";

export type SessionEvent = {
  kind: SessionEventKind;
  title?: string;
  pages?: number;
};

const KINDS: SessionEventKind[] = ["pset_ready", "student_mark", "notes_ready"];

export function asSessionEvent(input: unknown): SessionEvent | null {
  if (!input || typeof input !== "object") return null;
  const kind = (input as { kind?: unknown }).kind;
  if (typeof kind !== "string" || !KINDS.includes(kind as SessionEventKind)) {
    return null;
  }
  const title = (input as { title?: unknown }).title;
  const pages = (input as { pages?: unknown }).pages;
  return {
    kind: kind as SessionEventKind,
    title: typeof title === "string" ? title.slice(0, 120) : undefined,
    pages: typeof pages === "number" ? pages : undefined,
  };
}

export function describeEvent(event: SessionEvent): string {
  if (event.kind === "notes_ready") return "The student attached supplemental notes for this concept. You can see the PDF page. Briefly refer to what is actually on it and ask one question about what they want to understand. These are reference notes, not necessarily a graded assignment. Use the whiteboard when a diagram helps.";
  if (event.kind === "student_mark") return "The student just finished marking the PDF. The fresh page image includes their ink. Briefly acknowledge the specific marked region and ask one focused question about it. Do not solve the graded problem or ask them to describe a mark you can see.";
  if (event.kind === "pset_ready") {
    const named = event.title ? `, titled "${event.title}"` : "";
    const count = event.pages && event.pages > 1 ? ` It has ${event.pages} pages.` : "";
    return [
      `The student just put their problem set${named} on the desk next to you.${count}`,
      "You can see the current page, the same way someone sitting beside them would. An upload supplies context, not an agenda.",
      "Do not ask them to upload a PDF or which assignment it is. That is already in front of you.",
      "Do not name a numbered problem, example, figure, or equation unless the student selected it. Ask what they came to work on. If they already stated their goal, stay with it without asking again. Never choose problem one or offer to walk from the top unprompted.",
      "Do not summarize the whole document, explain an equation, or start solving anything. Ask at most one question, then wait for the student. Silence is not a request to continue.",
    ].join(" ");
  }
  return "";
}
