import { layoutWriting } from "./writing";
import { layoutDiagram } from './diagram-layout';
import { composeDiagram } from './diagram-compose';
import { closedBody, type BodyDot } from "./body";
import { validateAnimation } from "./animation";
import type { AnimationSpec, DrawCommand } from "@/lib/types";
import type { StudentInk } from "./colors";
import { interpretCommand, type ShapeGroup } from "./geometry";

export type BoardStroke = {
  id: string;
  tool: "pen" | "highlighter";
  color: StudentInk;
  points: { x: number; y: number }[];
};

export type BoardGroup = ShapeGroup & {
  appear: "pending" | "done";
  version?: number;
};

export type BoardPage = {
  id: number;
  groups: BoardGroup[];
  student: BoardStroke[];
  animation: AnimationSpec | null;
  time: number;
  focus: string | null;
};

export type BoardState = {
  revision: number;
  pageId: number;
  earlierPages: BoardPage[];
  open: boolean;
  groups: BoardGroup[];
  student: BoardStroke[];
  studentPast: BoardStroke[][];
  studentFuture: BoardStroke[][];
  studentSince: string;
  pulseId: string | null;
  seq: number;
  animation: AnimationSpec | null;
  time: number;
  playing: boolean;
  focus: string | null;
};

const empty = (): BoardState => ({
  revision: 0,
  pageId: 1, earlierPages: [],
  open: false,
  groups: [],
  student: [],
  studentPast: [], studentFuture: [],
  studentSince: "",
  pulseId: null,
  seq: 0,
  animation: null, time: 0, playing: false, focus: null,
});

let state: BoardState = empty();
let revision = 0;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state, revision: ++revision };
  listeners.forEach((fn) => fn());
}

export function getBoardState(): BoardState {
  return state;
}

export function subscribeBoard(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openBoard() {
  if (state.open) return;
  state = { ...state, open: true };
  emit();
}

export function resetBoard() {
  state = empty();
  emit();
}

function nextPage(current: BoardState): BoardState {
  if (!current.groups.length && !current.student.length && !current.animation) return current;
  const page: BoardPage = { id: current.pageId, groups: current.groups, student: current.student, animation: current.animation, time: current.time, focus: current.focus };
  return { ...current, pageId: current.pageId + 1, earlierPages: [...current.earlierPages, page], groups: [], student: [], studentPast: [], studentFuture: [], studentSince: '', animation: null, playing: false, time: 0, focus: null, pulseId: null };
}

export function continueBoardPage() {
  const next = nextPage(state);
  if (next === state) return;
  state = next;
  emit();
}

export function applyDrawCommands(commands: DrawCommand[]) {
  if (!commands.length) return;
  let next: BoardState = { ...state, open: true, groups: [...state.groups] };
  for (const command of commands) {
    const op = interpretCommand(command, next.seq + 1);
    if (!op) continue;
    next = { ...next, seq: next.seq + 1 };
    if (op.kind === "clear") {
      next = { ...next, groups: [], animation: null, playing: false, time: 0, focus: null, pulseId: null };
      continue;
    }
    if (op.kind === "remove") {
      next = {
        ...next,
        groups: next.groups.filter((group) => group.id !== op.id),
        pulseId: next.pulseId === op.id ? null : next.pulseId,
      };
      continue;
    }
    if (op.kind === "highlight") {
      next = { ...next, pulseId: op.id };
      continue;
    }
    const previous = next.groups.find(group => group.id === op.group.id);
    if (op.group.source && previous?.source && JSON.stringify(op.group.source) === JSON.stringify(previous.source)) continue;
    // A new topic continues below the old work, with its student ink intact.
    const previousTopic = next.groups.find(group => group.id === "topic");
    const words = (group: ShapeGroup) => group.drawables.flatMap(mark => mark.kind === "text" ? [mark.text] : []).join(" ").replace(/\s+/g, " ").trim().toLowerCase();
    if (op.group.id === "topic" && previousTopic && words(previousTopic) !== words(op.group)) {
      next = nextPage(next);
    }
    let laidOut = layoutWriting(op.group, next.groups, next.student);
    if (!laidOut) {
      next = nextPage(next);
      laidOut = layoutWriting(op.group, [], []);
    }
    if (!laidOut) continue;
    const existing = next.groups.findIndex((group) => group.id === op.group.id);
    if (existing >= 0 && JSON.stringify(next.groups[existing].drawables) === JSON.stringify(laidOut.drawables)) continue;
    const geometryEdit = previous?.source && op.group.source?.op === previous.source.op && previous.appear === 'done' && !previous.unresolved;
    const group: BoardGroup = { ...laidOut, appear: geometryEdit ? 'done' : 'pending', version: geometryEdit ? previous.version : next.seq };
    if (existing >= 0) {
      const groups = next.groups.slice();
      groups[existing] = group;
      next = { ...next, groups };
    } else {
      next = { ...next, groups: [...next.groups, group] };
    }
  }
  state = { ...next, groups: layoutDiagram(composeDiagram(next.groups), next.student) };
  emit();
}

export function markGroupShown(id: string) {
  let changed = false;
  const groups = state.groups.map((group) => {
    if (group.id !== id || group.appear === "done") return group;
    changed = true;
    return { ...group, appear: "done" as const };
  });
  if (!changed) return;
  state = { ...state, groups };
  emit();
}

export function setStudentStrokes(student: BoardStroke[]) {
  if (student === state.student) return;
  state = {
    ...state,
    student,
    studentPast: [...state.studentPast, state.student].slice(-30), studentFuture: [],
    studentSince: student.length ? new Date().toISOString() : "",
  };
  emit();
}

export function addStudentStroke(stroke: BoardStroke) {
  setStudentStrokes([...state.student, stroke]);
}

export function eraseStudentStrokes(ids: string[]) {
  if (!ids.length) return;
  const skip = new Set(ids);
  const student = state.student.filter((stroke) => !skip.has(stroke.id));
  if (student.length !== state.student.length) setStudentStrokes(student);
}

export function undoStudentInk() {
  const student = state.studentPast.at(-1);
  if (!student) return;
  state = { ...state, student, studentPast: state.studentPast.slice(0, -1), studentFuture: [state.student, ...state.studentFuture].slice(0, 30), studentSince: student.length ? new Date().toISOString() : "" };
  emit();
}

export function redoStudentInk() {
  const student = state.studentFuture[0];
  if (!student) return;
  state = { ...state, student, studentPast: [...state.studentPast, state.student].slice(-30), studentFuture: state.studentFuture.slice(1), studentSince: student.length ? new Date().toISOString() : "" };
  emit();
}

export function loadAnimation(input: unknown) {
  const validated = validateAnimation(input);
  if (!validated) return false;
  const animation: AnimationSpec = { ...validated, shapes: validated.shapes.map(shape => {
    if (shape.kind === 'axes' || shape.kind === 'text') return shape;
    const source = !state.animation || state.animation.id === validated.id
      ? state.groups.find(group => group.id === shape.id && !group.unresolved)?.source : undefined;
    const previous = state.animation?.id === validated.id ? state.animation.shapes.find(item => item.id === shape.id) : undefined;
    const label = source && 'label' in source ? source.label : previous && 'label' in previous ? previous.label : undefined;
    // Changing an object's representation should retain its established name.
    // An explicit empty label still lets the tutor remove it deliberately.
    const labeled = shape.label !== undefined || label === undefined ? shape : { ...shape, label };
    if (labeled.kind !== 'dot') return labeled;
    const appearance = (labeled as BodyDot).appearance ?? (source ? closedBody(source)?.appearance : undefined) ??
      (previous?.kind === 'dot' ? (previous as BodyDot).appearance : undefined);
    return appearance ? { ...labeled, appearance } : labeled;
  }) };
  // Reusing scene/object IDs explicitly continues this figure. Unrelated
  // animations still get a fresh page, preserving earlier work and ink.
  const shapeIds = new Set(animation.shapes.map(shape => shape.id));
  const continuing = state.animation?.id === animation.id ||
    (!state.animation && state.groups.some(group => group.source && shapeIds.has(group.id)));
  if (!continuing && (state.animation || state.student.length || state.groups.some(group => group.id !== 'topic'))) state = nextPage(state);
  if (continuing) {
    // The animated object replaces its static counterpart, not the backdrop.
    // Drop source references to replaced shapes rather than leave dependents
    // attached to their old position. Composition marks these unresolved.
    state = { ...state, groups: layoutDiagram(composeDiagram(state.groups.filter(group => !shapeIds.has(group.id))), state.student) };
  }
  state = { ...state, open: true, animation, time: 0, playing: true, focus: null };
  emit();
  return true;
}
export function pauseAnimation() {
  if (!state.playing) return;
  state = { ...state, playing: false };
  emit();
}
export function playAnimation() {
  if (!state.animation) return;
  state = { ...state, playing: true, time: state.time >= state.animation.duration ? 0 : state.time };
  emit();
}
export function seekAnimation(time: number) {
  if (!state.animation || !Number.isFinite(time)) return;
  state = { ...state, time: Math.max(0, Math.min(state.animation.duration, time)) };
  emit();
}
export function advanceAnimation(seconds: number) {
  if (!state.playing || !state.animation) return;
  const time = Math.min(state.animation.duration, state.time + seconds);
  state = { ...state, time, playing: time < state.animation.duration };
  emit();
}
export function focusAnimation(id: string) {
  if (!state.animation?.shapes.some(s => s.id === id)) return;
  state = { ...state, focus: id };
  emit();
}

// Park each desk independently, always restoring a still frame.
export function restoreBoard(snapshot: BoardState) {
  state = { ...structuredClone(snapshot), pageId: snapshot.pageId ?? 1, earlierPages: structuredClone(snapshot.earlierPages ?? []), studentPast: structuredClone(snapshot.studentPast ?? []), studentFuture: structuredClone(snapshot.studentFuture ?? []), playing: false };
  emit();
}
