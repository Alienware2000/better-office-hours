import type { AgentTurn, DrawCommand } from '@/lib/types';
import { interpretCommand } from '@/lib/whiteboard/geometry';
import { validateAnimation } from '@/lib/whiteboard/animation';

// Local stream metadata, not a new shared AgentTurn contract. The model chooses
// from conversation context; the client never classifies the student's words.
export type TeachingIntent = {
  move: 'elicit' | 'orient' | 'hint' | 'consolidate' | 'explain';
  visual: 'none' | 'notes' | 'diagram' | 'animation';
};
export type TeachingTurn = AgentTurn & { teaching?: TeachingIntent };

export function teachingIntent(attrs: Record<string, string>): TeachingIntent | undefined {
  if (!['elicit', 'orient', 'hint', 'consolidate', 'explain'].includes(attrs.move) ||
      !['none', 'notes', 'diagram', 'animation'].includes(attrs.visual)) return;
  return { move: attrs.move, visual: attrs.visual } as TeachingIntent;
}

export const teachingTag = (intent: TeachingIntent | undefined) => intent
  ? `[TEACH move=${intent.move} visual=${intent.visual}]` : '';

export const canRevealRelationship = (intent?: TeachingIntent) => Boolean(intent &&
  ['hint', 'consolidate', 'explain'].includes(intent.move));

// Structural notation check, independent of topic or spoken trigger phrases.
// Known single quantities and unknown blanks can support an elicitation; a
// symbolic relationship would answer the recall task before the learner tries.
export function isRelationship(text: string): boolean {
  if (typeof text !== 'string') return false;
  if (/\\(?:d?frac|tfrac|sqrt|int|sum|prod|begin)\b/.test(text)) return true;
  const compact = text.replace(/\s+/g, '');
  if (/[∫∑∏]/u.test(compact)) return true;
  const relation = compact.match(/[=≈∝]/u);
  if (!relation) return /[\p{L}][₀-₉²³]*[+×*/−]\d*[\p{L}]/u.test(compact);
  const rhs = compact.slice(relation.index! + 1);
  const unit = '(?:mm|cm|km|m|ms|s|kg|g|N|J|W|Pa|K|C|V|A|Hz|mol|L|rad|°|%)(?:[²³]|\\^[23])?';
  return !new RegExp(`^(?:[+−-]?\\d+(?:\\.\\d+)?|\\?)(?:${unit}(?:[/·]${unit})*)?$`, 'u').test(rhs);
}

export function teachingDraw(command: DrawCommand, intent?: TeachingIntent): DrawCommand | null {
  if (canRevealRelationship(intent)) return command;
  if (command.op === 'text') return isRelationship(command.text) ? null : command;
  if ('label' in command && command.label && isRelationship(command.label)) return { ...command, label: undefined };
  if (command.op === 'axes') return { ...command,
    xLabel: command.xLabel && isRelationship(command.xLabel) ? undefined : command.xLabel,
    yLabel: command.yLabel && isRelationship(command.yLabel) ? undefined : command.yLabel };
  return command;
}

export function needsBoardRepair(turn: TeachingTurn): boolean {
  if (turn.think || !turn.teaching || turn.teaching.visual === 'none') return false;
  const animation = Boolean(validateAnimation(turn.board?.animation));
  const drawn = (turn.board?.commands ?? []).filter((command, i) => interpretCommand(command, i)?.kind === 'draw');
  if (turn.teaching.visual === 'notes') return !animation && !drawn.length;
  // A valid static diagram is an acceptable fallback for a failed animation.
  return !animation && !drawn.some(command => command.op !== 'text');
}

export const TEACHING_GUIDANCE = `<teaching_intent>
Before substantive speech or board commands, choose the next teaching move from the full conversation and current board, and emit one silent [TEACH move=... visual=...] tag. No keyword rules: interpret what the learner understands, has attempted, is asking for, and what would help them think. Choose visual=none, notes, diagram, or animation yourself. A learner can request a visual in any words; also offer one proactively when spatial, causal, temporal, or structural relationships would clarify the idea. Do not fill the board just because it is open.
move=elicit: give the learner a first chance to recall, choose a method, or predict. Ask ONE focused question and wait for their next turn. You may show established givens or an uncompleted setup, but never display, say, highlight, or encode the relationship or conclusion you are asking them to produce. Asking which equation while already writing it defeats this move. A board formula is a hint even if you have not spoken it. If you already showed something, acknowledge it as your scaffold and ask about meaning or application, not pretend they can retrieve it unaided.
move=orient: the learner cannot yet picture the situation. Describe the objects and what changes, draw a small meaningful diagram or qualitative sequence, then ask one noticing/prediction question. Do not immediately demand an equation or an attempt they cannot make. Keep the method and requested result unrevealed. Do not choose an assignment problem they have not selected.
move=hint: after evidence of struggle, an unsuccessful attempt, or an explicit request for help, advance only the smallest useful hint rung. A formula can be appropriate after a recall opportunity and a needed reminder, but do not jump to one if a pointing or conceptual hint suffices. Do not keep repeating an unanswered recall question when the learner needs teaching. Never solve the graded task.
move=consolidate: record a relationship or idea the learner actually supplied and you have checked. A tutor-created note is not evidence the learner produced it. Record only what is established; then ask a new small step.
move=explain: teach a requested concept or an ungraded example at the learner's level. Use the smallest useful visual and then invite a prediction/application. This is not a way to bypass elicitation on graded work.
The declared move governs every surface, including diagram labels and animations. Elicit/orient do not allow new symbolic relationships. Keep hints contingent on the transcript, not how many seconds have passed. When the learner succeeds, fade support. No computed graded result or complete solution in any move. Select visual=none for a turn that only needs conversation. For diagram/animation actually emit geometry in this turn, not a promise. The app may recover an omitted visual using this same move, without adding a new hint.
</teaching_intent>`;
