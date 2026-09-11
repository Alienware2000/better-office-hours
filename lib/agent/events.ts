/**
 * Things that happen in the workspace which should make the tutor speak
 * without the student having to prompt it. The client sends a kind, never
 * prose, so nothing it sends can rewrite the tutor's instructions.
 */
export type SessionEventKind = "pset_ready" | "student_mark";

export type SessionEvent = {
  kind: SessionEventKind;
  title?: string;
  pages?: number;
};

const KINDS: SessionEventKind[] = ["pset_ready", "student_mark"];

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
  if (event.kind === "student_mark") return "The student just finished marking the PDF. The fresh page image includes their ink. Briefly acknowledge the specific marked region and ask one focused question about it. Do not solve the graded problem or ask them to describe a mark you can see.";
  if (event.kind === "pset_ready") {
    const named = event.title ? `, titled "${event.title}"` : "";
    const count = event.pages && event.pages > 1 ? ` It has ${event.pages} pages.` : "";
    return [
      `The student just put their problem set${named} on the desk next to you.${count}`,
      "You can see the current page, the same way someone sitting beside them would. Speak now, without waiting to be asked.",
      "Do not ask them to upload a PDF or which assignment it is. That is already in front of you.",
      "In one short line, refer to something actually on the page (a heading, a problem number, a figure) so it is clear you can see their work, then ask which problem they want to start with or whether they would rather walk the set from the top.",
      "Do not summarize the whole document and do not start solving anything.",
    ].join(" ");
  }
  return "";
}
