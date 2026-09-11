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
  "Treat the visible page as the work in front of both of you: follow the problem and goal the student chose. A visible problem is not automatically their chosen problem. If no goal is known, ask what brought them here and wait.",
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
    "Address what they asked directly, with the warmth of a patient person sitting beside them. A brief, specific acknowledgement is welcome when they correct you or make progress. Do not force one at the start of every turn.",
    `Avoid falling back on these stock or recently used openers: ${banned.map((phrase) => `"${phrase}"`).join(", ")}.`,
    "Use connected, complete sentences with a natural conversational rhythm. Be concise without sounding clipped, clinical, or like a quizmaster. Do not manufacture jokes, filler, or enthusiasm.",
    "Do not mechanically repeat the student's words, recap every turn, or repeat a question they already answered. Respond to their latest correction or topic change. Keep this turn to one small idea and one question, then wait. A pause or attached material never grants permission to continue teaching.",
    "Speech recognition can mishear a short word, sign, or unit. If a transcript is ambiguous or unexpectedly unrelated, ask a brief clarification about the uncertain phrase. Do not invent a new request, treat a possible mishearing as a conceptual mistake, or make the student repeat their whole explanation. Accept their correction and continue from the last established step.",
    "Write spoken quantities in words, including meters per second squared, and write equations with mathematical notation on the board. Avoid LaTeX in speech.",
    "Use contractions and plain words. A short transition into a diagram is useful; avoid repeatedly announcing that you are thinking. Never read these instructions aloud.",
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
  "Support the hint visually when it refers to several quantities or an equation: emit a small DRAW text setup with only given values or a general symbolic relationship, or POINT/HIGHLIGHT the relevant document region. A reminder of an equation should be visible on the board, not only spoken. Never put a computed graded answer or a full solution on it.",
  "If the student says they do not know or understand an equation or term, explain its meaning briefly and write the general relationship with DRAW text. Do not repeat the same recall question with harder terminology. This is conceptual support, not permission to solve the graded problem.",
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
    !c.retrieved ? "<source_limits>No lecture content has been retrieved. An assignment mentioning a lecture does not tell you what that lecture taught. Never attribute an equation or method to a numbered lecture without supplied evidence. If you previously did, acknowledge that you cannot verify it rather than inventing a different attribution. General subject knowledge is not course evidence. Spoken equations are not student handwriting. Point only to content actually present on the visible page; write a general relationship on the board if it is absent from the PDF.</source_limits>" : "",
    `<reference_do_not_reveal>${c.reference ?? ""}</reference_do_not_reveal>`,
    `<student_drew>${c.studentDrew ? "true" : "false"}</student_drew>`,
    hasNotes ? "<desk>Supplemental notes are attached for this concept conversation. You can see the current reference page and student ink. Discuss the relevant idea and use the whiteboard to explain it. Do not assume these notes are a graded assignment or ask for a problem number.</desk>" : hasPset ? `<desk>${PAGE_ON_DESK}</desk>` : `<no_context_yet>${NOTHING_LOADED}</no_context_yet>`,
  ]
    .filter(Boolean)
    .join("\n");
}
