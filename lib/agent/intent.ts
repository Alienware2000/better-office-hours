import type { LayoutState } from "@/lib/types";

const PSET = [
  /\bhome\s*work\b/,
  /\bhw\b/,
  /\bp[ -]?sets?\b/,
  /\bproblem sets?\b/,
  /\bassignments?\b/,
  /\bproblem \d/,
  /\bquestion \d/,
  /\bnumber \d/,
];

const CONCEPT = [
  /\bexplain a concept\b/,
  /\bsomething else\b/,
  /\bhelp me (?:learn|understand)\b/,
  /\bconcept\b/,
  /\blecture\b/,
  /\bteach me\b/,
  /\bgo over\b/,
];

// These are how a student asks a question, not how they change rooms. Only
// use them to leave the orb. Matching them on a pset closed the PDF.
const CONCEPT_FROM_ORB = [
  /\bwhat is\b/,
  /\bwhy does\b/,
  /\bhow does\b/,
  /\b(do not|don'?t) (get|understand)\b/,
];

/**
 * The layout should react to what the student says, not wait for the model to
 * emit [MODE ...]. The non-reasoning model drops that tag often, and the student
 * should never have to touch a chip to get the right workspace.
 */
export function detectMode(
  text: string,
  current: LayoutState = "orb_only",
): Extract<LayoutState, "pset" | "concept"> | null {
  const said = text.toLowerCase().replace(/’/g, "'");
  if (/\b(?:switch|change) (?:the )?(?:topic|subject)\b|\b(?:work on|do|discuss) something else\b/.test(said)) return "concept";
  const namesHomework = PSET.some((pattern) => pattern.test(said));
  if (namesHomework && (current !== "concept" || /^(?:homework|hw|p[ -]?set|problem set)[.!?]?$/.test(said.trim()) || /\b(?:work on|want to do|switch to|go back to|return to|help (?:me )?with)\b/.test(said))) return "pset";
  if (current === "pset") {
    if (/^explain a concept[.!?]?$/.test(said.trim())) {
      return "concept";
    }
    return null;
  }
  if (CONCEPT.some((pattern) => pattern.test(said))) return "concept";
  if (current === "orb_only" && CONCEPT_FROM_ORB.some((pattern) => pattern.test(said))) {
    return "concept";
  }
  return null;
}
