import type { DrawCommand } from "@/lib/types";
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
  open: boolean;
  groups: BoardGroup[];
  student: BoardStroke[];
  studentSince: string;
  pulseId: string | null;
  seq: number;
};

const empty = (): BoardState => ({
  open: false,
  groups: [],
  student: [],
  studentSince: "",
  pulseId: null,
  seq: 0,
});

let state: BoardState = empty();
const listeners = new Set<() => void>();

function emit() {
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
      next = { ...next, groups: [], pulseId: null, student: [], studentSince: "" };
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
    const existing = next.groups.findIndex((group) => group.id === op.group.id);
    const group: BoardGroup = { ...op.group, appear: "pending" };
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
  state = {
    ...state,
    student,
    studentSince: student.length ? state.studentSince || new Date().toISOString() : "",
  };
  emit();
}

export function addStudentStroke(stroke: BoardStroke) {
  state = {
    ...state,
    student: [...state.student, stroke],
    studentSince: new Date().toISOString(),
  };
  emit();
}

export function eraseStudentStrokes(ids: string[]) {
  if (!ids.length) return;
  const skip = new Set(ids);
  const student = state.student.filter((stroke) => !skip.has(stroke.id));
  state = {
    ...state,
    student,
    studentSince: student.length ? state.studentSince : "",
  };
  emit();
}
