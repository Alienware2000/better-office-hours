/**
 * Things that happen in the workspace which should make the tutor speak
 * without the student having to prompt it. The client sends a kind, never
 * prose, so nothing it sends can rewrite the tutor's instructions.
 */
export type SessionEventKind = "pset_ready";

export type SessionEvent = {
  kind: SessionEventKind;
  title?: string;
  pages?: number;
};

const KINDS: SessionEventKind[] = ["pset_ready"];

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
  if (event.kind === "pset_ready") {
    const named = event.title ? `, titled "${event.title}"` : "";
    const count = event.pages && event.pages > 1 ? ` It has ${event.pages} pages.` : "";
    return [
      `The student just uploaded their problem set${named} and it is now open on screen next to you.${count}`,
      "You can see page one. Speak now, without waiting to be asked.",
      "Say in one short line that you can see it, referring to something actually on the page so it is clear you read it, then ask which problem they want to start with or whether they would rather walk the set from the top.",
      "Do not summarize the whole document and do not start solving anything.",
    ].join(" ");
  }
  return "";
}
