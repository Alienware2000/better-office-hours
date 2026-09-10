import type { LayoutState } from "@/lib/types";

const PSET = [
  /\bhomework\b/,
  /\bhw\b/,
  /\bp-?set\b/,
  /\bproblem set\b/,
  /\bassignment\b/,
  /\bproblem \d/,
  /\bquestion \d/,
  /\bnumber \d/,
];

const CONCEPT = [
  /\bexplain\b/,
  /\bconcept\b/,
  /\blecture\b/,
  /\bteach me\b/,
  /\bgo over\b/,
  /\bwhat is\b/,
  /\bwhy does\b/,
  /\bhow does\b/,
  /\b(do not|don'?t) (get|understand)\b/,
];

/**
 * The layout should react to what the student says, not wait for the model to
 * emit [MODE ...]. The non-reasoning model drops that tag often, and the
 * student should never have to touch a chip to get the right workspace.
 */
export function detectMode(text: string): Extract<LayoutState, "pset" | "concept"> | null {
  const said = text.toLowerCase();
  if (PSET.some((pattern) => pattern.test(said))) return "pset";
  if (CONCEPT.some((pattern) => pattern.test(said))) return "concept";
  return null;
}
