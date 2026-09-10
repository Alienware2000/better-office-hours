export type TurnContext = {
  courseName?: string;
  term?: string;
  policies?: { collaboration?: string; aiUse?: string };
  studentName?: string;
  courseCodes?: string[];
  psetTitle?: string;
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

const DEMO: TurnContext = {
  courseName: "PHYS 180: University Physics",
  term: "Fall 2024",
  policies: {
    collaboration: "Follow the syllabus collaboration policy.",
    aiUse: "This tutor may not give final answers on graded work.",
  },
  studentName: "David",
  courseCodes: ["PHYS 180", "CPSC 223", "ECON 115"],
  psetTitle: "Problem Set 3",
  psetDueAt: "Friday",
  page: 1,
  pages: 1,
  mode: "orb_only",
  hintState: { question: "", rung: 0, attempts: 0 },
  misconceptionsSeen: [],
  retrieved: "",
  reference: "",
  studentDrew: false,
};

export function buildContextBlock(overrides: TurnContext = {}): string {
  const c = { ...DEMO, ...overrides };
  const policies = [c.policies?.collaboration, c.policies?.aiUse]
    .filter(Boolean)
    .join("; ");

  return [
    `<course>${c.courseName}, ${c.term}</course>`,
    `<policies>${policies}</policies>`,
    `<student>${c.studentName}; courses: ${(c.courseCodes ?? []).join(", ")}</student>`,
    `<pset>${c.psetTitle ?? ""}, due ${c.psetDueAt ?? ""}, on page ${c.page ?? 1} of ${c.pages ?? 1}</pset>`,
    `<last_recap>${c.lastRecap?.stuckOn ?? ""}; ${c.lastRecap?.reviewNext ?? ""}</last_recap>`,
    `<mode>${c.mode ?? "orb_only"}</mode>`,
    `<hint_state>question=${c.hintState?.question ?? ""} rung=${c.hintState?.rung ?? 0} attempts_since_last_hint=${c.hintState?.attempts ?? 0}</hint_state>`,
    `<misconceptions_seen>${(c.misconceptionsSeen ?? []).join(", ")}</misconceptions_seen>`,
    `<retrieved>${c.retrieved ?? ""}</retrieved>`,
    `<reference_do_not_reveal>${c.reference ?? ""}</reference_do_not_reveal>`,
    `<student_drew>${c.studentDrew ? "true" : "false"}</student_drew>`,
  ].join("\n");
}
