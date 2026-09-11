import { layoutWriting } from "./writing";
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
};

export type BoardState = {
  revision: number;
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
    // A new reserved topic begins a new tutor note. Never relabel old givens
    // as the next phase, and never remove the student's separate ink layer.
    const previousTopic = next.groups.find(group => group.id === "topic");
    const words = (group: ShapeGroup) => group.drawables.flatMap(mark => mark.kind === "text" ? [mark.text] : []).join(" ").replace(/\s+/g, " ").trim().toLowerCase();
    if (op.group.id === "topic" && previousTopic && words(previousTopic) !== words(op.group)) {
      next = { ...next, groups: [], animation: null, playing: false, time: 0, focus: null, pulseId: null };
    }
    const existing = next.groups.findIndex((group) => group.id === op.group.id);
    const laidOut = layoutWriting(op.group, next.groups, next.student);
    if (!laidOut) { console.warn("Whiteboard writing has no free space; keep existing content."); continue; }
    const group: BoardGroup = { ...laidOut, appear: "pending" };
    if (existing >= 0) {
      const groups = next.groups.slice();
      groups[existing] = group;
      next = { ...next, groups };
    } else {
      next = { ...next, groups: [...next.groups, group] };
    }
  }
  state = next;
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
  const animation = validateAnimation(input);
  if (!animation) return false;
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
  state = { ...structuredClone(snapshot), studentPast: snapshot.studentPast ?? [], studentFuture: snapshot.studentFuture ?? [], playing: false };
  emit();
}
