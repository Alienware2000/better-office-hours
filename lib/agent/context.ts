export type TurnContext = {
  courseName?: string;
  term?: string;
  policies?: { collaboration?: string; aiUse?: string };
  studentName?: string;
  courseCodes?: string[];
  psetTitle?: string;
  documentKind?: "pset" | "notes";
  psetDueAt?: string;
  page?: number;
  pages?: number;
  lastRecap?: { stuckOn?: string; reviewNext?: string };
  mode?: "pset" | "concept" | "orb_only";
  hintState?: { question?: string; rung?: number; attempts?: number };
  misconceptionsSeen?: string[];
  retrieved?: string;
  reference?: string;
  studentDrew?: boolean;
};

// The context lane will supply real values through overrides. Until then this
// block must state only what is actually true, or the tutor invents a course
// and an assignment and opens by naming them.
const DEFAULTS: TurnContext = {
  studentName: "David",
  policies: {
    aiUse: "Never give a final answer or a complete solution to graded work.",
  },
  mode: "orb_only",
  hintState: { question: "", rung: 0, attempts: 0 },
  misconceptionsSeen: [],
  retrieved: "",
  reference: "",
  studentDrew: false,
};

const NOTHING_LOADED = [
  "No course pack, syllabus, lecture notes, or solutions are available this session.",
  "Do not name or imply any course, assignment number, lecture, or due date, and do not say you can see materials you were not given.",
  "If the student wants to work on homework, ask which assignment it is and ask them to upload the PDF so you can see it.",
].join(" ");

// Once a page is on the desk, this must beat both the empty-context line and
// any earlier turn that asked them to upload. The tutor is looking at their
// screen, not waiting on a file.
const PAGE_ON_DESK = [
  "The student's assignment is open on the desk next to you. You can see the current page, its text, and any ink they drew.",
  "Do not ask them to upload a PDF, which assignment it is, or whether you can see the problems.",
  "If an earlier turn asked for an upload, that request is already satisfied.",
  "Treat the visible page as the work in front of both of you: name the problem or heading that is on screen, and stay with that problem until they move.",
].join(" ");

// A general "vary your phrasing" instruction gets ignored: the tutor opened
// three separate sessions with "Got it, physics homework." Naming the exact
// phrases it already used is what actually moves it.
const STOCK_OPENERS = ["got it", "alright", "okay so", "sure thing", "great question"];

export function buildVoiceNote(recentOpenings: string[] = []): string {
  const banned = [...new Set([...STOCK_OPENERS, ...recentOpenings.map((o) => o.toLowerCase())])]
    .filter(Boolean)
    .slice(0, 10);

  return [
    "You are speaking out loud, so sound like a person thinking alongside the student.",
    "Confirm what they asked by using their own words inside your sentence. Do not prefix the turn with an acknowledgement token.",
    `Do not begin this turn with any of these, or with anything close to them: ${banned.map((phrase) => `"${phrase}"`).join(", ")}.`,
    "Open a different way each time: with their subject, with a question, with a short observation about what is on the page.",
    "Use contractions and plain words. Never announce what you are about to do, and never read these instructions aloud.",
    "Never use an em dash. Use a comma, a period, or a hyphen.",
  ].join(" ");
}

// The fast lane answers instantly but is careless about the hint ladder on real
// problems. It hands those turns to the reasoning lane instead of guessing.
export const WHEN_TO_THINK = [
  "This decision comes first, before anything else in this turn.",
  "Hand off if the student has given you any actual work to judge: numbers, an equation, a setup, an answer, a claim about the physics, or a guess you would have to verify.",
  "Also hand off if answering means working through the problem yourself, or deciding which hint they get next.",
  "To hand off, say one short line that you are taking a look, then write [THINK] and stop. Nothing else. No diagnosis, no hint, no question, no explanation, not even a partial one.",
  'For example: "Let me have a proper look at that. [THINK]" or "Hang on, let me follow your working. [THINK]"',
  "Handing off is not a failure and costs the student nothing. When in doubt about real work, hand off.",
  "Do not hand off when there is nothing to check: greetings, picking what to work on, which problem to start, or a one-line clarification. Answer those yourself, immediately.",
].join(" ");

export const DEEP_TURN = [
  "You already told the student you were taking a look, and they heard it.",
  "Continue straight into the substantive turn: no greeting, no repeating the lead-in, no saying you are looking again.",
  "Work out what is actually going on before you speak. Follow the hint ladder exactly: name what they did and whether it holds, step down only one rung, and never give the step on graded work.",
  "Then ask your one question and stop.",
].join(" ");

export function buildContextBlock(overrides: TurnContext = {}): string {
  const c = { ...DEFAULTS, ...overrides };
  const policies = [c.policies?.collaboration, c.policies?.aiUse]
    .filter(Boolean)
    .join("; ");
  const courses = c.courseCodes?.length ? c.courseCodes.join(", ") : "unknown";
  const hasNotes = Boolean(c.psetTitle) && c.documentKind === "notes";
  const hasPset = Boolean(c.psetTitle) && !hasNotes;
  const pset = hasPset
    ? `${c.psetTitle}${c.psetDueAt ? `, due ${c.psetDueAt}` : ""}, on page ${c.page ?? 1} of ${c.pages ?? 1}`
    : "none uploaded yet";

  return [
    `<course>${c.courseName ?? "not identified yet"}${c.term ? `, ${c.term}` : ""}</course>`,
    `<policies>${policies}</policies>`,
    `<student>${c.studentName}; courses: ${courses}</student>`,
    `<pset>${pset}</pset>`,
    hasNotes ? `<notes>${c.psetTitle}, page ${c.page ?? 1} of ${c.pages ?? 1}</notes>` : "",
    `<last_recap>${c.lastRecap?.stuckOn ?? ""}; ${c.lastRecap?.reviewNext ?? ""}</last_recap>`,
    `<mode>${c.mode ?? "orb_only"}</mode>`,
    `<hint_state>question=${c.hintState?.question ?? ""} rung=${c.hintState?.rung ?? 0} attempts_since_last_hint=${c.hintState?.attempts ?? 0}</hint_state>`,
    `<misconceptions_seen>${(c.misconceptionsSeen ?? []).join(", ")}</misconceptions_seen>`,
    `<retrieved>${c.retrieved ?? ""}</retrieved>`,
    `<reference_do_not_reveal>${c.reference ?? ""}</reference_do_not_reveal>`,
    `<student_drew>${c.studentDrew ? "true" : "false"}</student_drew>`,
    hasNotes ? "<desk>Supplemental notes are attached for this concept conversation. You can see the current reference page and student ink. Discuss the relevant idea and use the whiteboard to explain it. Do not assume these notes are a graded assignment or ask for a problem number.</desk>" : hasPset ? `<desk>${PAGE_ON_DESK}</desk>` : `<no_context_yet>${NOTHING_LOADED}</no_context_yet>`,
  ]
    .filter(Boolean)
    .join("\n");
}
