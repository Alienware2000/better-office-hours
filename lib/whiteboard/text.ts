import { isMathNotation } from './math-source';

export const MATH_FONT = '"Cambria Math", "STIX Two Math", Georgia, serif';
export const LABEL_FONT = '"Source Sans 3", system-ui, sans-serif';
export const isMathText = isMathNotation;

// Color belongs to the authored mark, not to the spelling of its variables.
// Explicit emphasis remains available through the existing DRAW color field.
export function textRuns(text: string, color: string) {
  return [{ text, color }];
}
