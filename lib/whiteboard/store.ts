import { layoutWriting } from "./writing";
import { layoutDiagram } from './diagram-layout';
import { composeDiagram } from './diagram-compose';
import { closedBody, type BodyDot } from "./body";
import { validateAnimation, animationWritingObstacles, type DiagramAnimShape } from "./animation";
import { diagramOptions } from './diagram-command';
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

type BoardStore = { state: BoardState; revision: number; listeners: Set<() => void> };
// Development module replacement must not erase a student's current board and
// let autosave persist that empty replacement. The tab owns this one store.
// Keep the shared object, including subscriptions, so old callbacks remain valid.
const developmentWindow = process.env.NODE_ENV === 'development' && typeof window !== 'undefined'
  ? window as Window & { __bohDevelopmentBoard?: BoardStore } : null;
const boardStore: BoardStore = developmentWindow?.__bohDevelopmentBoard ?? { state: empty(), revision: 0, listeners: new Set() };
if (developmentWindow) developmentWindow.__bohDevelopmentBoard = boardStore;

function emit() {
  boardStore.state = { ...boardStore.state, revision: ++boardStore.revision };
  boardStore.listeners.forEach((fn) => fn());
}

export function getBoardState(): BoardState {
  return boardStore.state;
}

export function subscribeBoard(listener: () => void) {
  boardStore.listeners.add(listener);
  return () => {
    boardStore.listeners.delete(listener);
  };
}

export function openBoard() {
  if (boardStore.state.open) return;
  boardStore.state = { ...boardStore.state, open: true };
  emit();
}

export function resetBoard() {
  boardStore.state = empty();
  emit();
}

function nextPage(current: BoardState): BoardState {
  if (!current.groups.length && !current.student.length && !current.animation) return current;
  const page: BoardPage = { id: current.pageId, groups: layoutDiagram(composeDiagram(current.groups), current.student), student: current.student, animation: current.animation, time: current.time, focus: current.focus };
  return { ...current, pageId: current.pageId + 1, earlierPages: [...current.earlierPages, page], groups: [], student: [], studentPast: [], studentFuture: [], studentSince: '', animation: null, playing: false, time: 0, focus: null, pulseId: null };
}

export function continueBoardPage() {
  const next = nextPage(boardStore.state);
  if (next === boardStore.state) return;
  boardStore.state = next;
  emit();
}

export function applyDrawCommands(commands: DrawCommand[]) {
  if (!commands.length) return;
  let next: BoardState = { ...boardStore.state, open: true, groups: [...boardStore.state.groups] };
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
    // Fixed panel rows and free geometry have different space reservations.
    // Preserve the previous page when switching drawing formats.
    if (next.groups.some(group => (group.source?.op === 'panel') !== (command.op === 'panel'))) next = nextPage(next);
    if (command.op === 'panel' && next.groups.some(group => group.source?.op === 'panel' && group.source.slot === command.slot && group.id !== command.id)) next = nextPage(next);
    const previous = next.groups.find(group => group.id === op.group.id);
    if (op.group.source && previous?.source && JSON.stringify(op.group.source) === JSON.stringify(previous.source)) continue;
    // A new topic continues below the old work, with its student ink intact.
    const previousTopic = next.groups.find(group => group.id === "topic");
    const words = (group: ShapeGroup) => group.drawables.flatMap(mark => mark.kind === "text" ? [mark.text] : []).join(" ").replace(/\s+/g, " ").trim().toLowerCase();
    if (op.group.id === "topic" && previousTopic && words(previousTopic) !== words(op.group)) {
      next = nextPage(next);
    }
    let laidOut = layoutWriting(op.group, next.groups, next.student, next.animation ? animationWritingObstacles(next.animation) : []);
    if (!laidOut) {
      next = nextPage(next);
      laidOut = layoutWriting(op.group, [], []);
    }
    if (!laidOut) continue;
    const existing = next.groups.findIndex((group) => group.id === op.group.id);
    if (existing >= 0 && JSON.stringify(next.groups[existing].drawables) === JSON.stringify(laidOut.drawables)) continue;
    const geometryEdit = command.op !== 'panel' && previous?.source && op.group.source?.op === previous.source.op && previous.appear === 'done' && !previous.unresolved;
    const group: BoardGroup = { ...laidOut, appear: geometryEdit ? 'done' : 'pending', version: geometryEdit ? previous.version : next.seq };
    if (existing >= 0) {
      const groups = next.groups.slice();
      groups[existing] = group;
      next = { ...next, groups };
    } else {
      next = { ...next, groups: [...next.groups, group] };
    }
  }
  boardStore.state = { ...next, groups: layoutDiagram(composeDiagram(next.groups), next.student) };
  emit();
}

export function markGroupShown(id: string) {
  let changed = false;
  const groups = boardStore.state.groups.map((group) => {
    if (group.id !== id || group.appear === "done") return group;
    changed = true;
    return { ...group, appear: "done" as const };
  });
  if (!changed) return;
  boardStore.state = { ...boardStore.state, groups };
  emit();
}

export function setStudentStrokes(student: BoardStroke[]) {
  if (student === boardStore.state.student) return;
  boardStore.state = {
    ...boardStore.state,
    student,
    studentPast: [...boardStore.state.studentPast, boardStore.state.student].slice(-30), studentFuture: [],
    studentSince: student.length ? new Date().toISOString() : "",
  };
  emit();
}

export function addStudentStroke(stroke: BoardStroke) {
  setStudentStrokes([...boardStore.state.student, stroke]);
}

export function eraseStudentStrokes(ids: string[]) {
  if (!ids.length) return;
  const skip = new Set(ids);
  const student = boardStore.state.student.filter((stroke) => !skip.has(stroke.id));
  if (student.length !== boardStore.state.student.length) setStudentStrokes(student);
}

export function undoStudentInk() {
  const student = boardStore.state.studentPast.at(-1);
  if (!student) return;
  boardStore.state = { ...boardStore.state, student, studentPast: boardStore.state.studentPast.slice(0, -1), studentFuture: [boardStore.state.student, ...boardStore.state.studentFuture].slice(0, 30), studentSince: student.length ? new Date().toISOString() : "" };
  emit();
}

export function redoStudentInk() {
  const student = boardStore.state.studentFuture[0];
  if (!student) return;
  boardStore.state = { ...boardStore.state, student, studentPast: [...boardStore.state.studentPast, boardStore.state.student].slice(-30), studentFuture: boardStore.state.studentFuture.slice(1), studentSince: student.length ? new Date().toISOString() : "" };
  emit();
}

export function loadAnimation(input: unknown) {
  const validated = validateAnimation(input);
  if (!validated) return false;
  const animation: AnimationSpec = { ...validated, shapes: validated.shapes.map(shape => {
    if (shape.kind === 'axes' || shape.kind === 'text') return shape;
    const source = !boardStore.state.animation || boardStore.state.animation.id === validated.id
      ? boardStore.state.groups.find(group => group.id === shape.id && !group.unresolved)?.source : undefined;
    const previous = boardStore.state.animation?.id === validated.id ? boardStore.state.animation.shapes.find(item => item.id === shape.id) : undefined;
    const label = source && 'label' in source ? source.label : previous && 'label' in previous ? previous.label : undefined;
    // Changing an object's representation should retain its established name.
    // An explicit empty label still lets the tutor remove it deliberately.
    let labeled: DiagramAnimShape = shape.label !== undefined || label === undefined ? shape : { ...shape, label };
    if (labeled.kind === 'arrow' && !labeled.diagram) {
      const options = source ? diagramOptions(source) : (previous as DiagramAnimShape | undefined)?.diagram;
      const target = options?.attach?.to ?? options?.component?.of;
      if (options && (!target || validated.shapes.some(s => s.id === target))) {
        labeled = { ...labeled, diagram: { attach: options.attach, component: options.component, labelSide: options.labelSide } };
      }
    }
    if (labeled.kind !== 'dot') return labeled;
    const appearance = (labeled as BodyDot).appearance ?? (source ? closedBody(source)?.appearance : undefined) ??
      (previous?.kind === 'dot' ? (previous as BodyDot).appearance : undefined);
    return appearance ? { ...labeled, appearance } : labeled;
  }) };
  if (!validateAnimation(animation)) return false;
  // Reusing scene/object IDs explicitly continues this figure. Unrelated
  // animations still get a fresh page, preserving earlier work and ink.
  const shapeIds = new Set(animation.shapes.map(shape => shape.id));
  const continuing = boardStore.state.animation?.id === animation.id ||
    (!boardStore.state.animation && boardStore.state.groups.some(group => group.source && shapeIds.has(group.id)));
  if (!continuing && (boardStore.state.animation || boardStore.state.student.length || boardStore.state.groups.some(group => group.id !== 'topic'))) boardStore.state = nextPage(boardStore.state);
  if (continuing) {
    // The animated object replaces its static counterpart, not the backdrop.
    // Drop source references to replaced shapes rather than leave dependents
    // attached to their old position. Composition marks these unresolved.
    boardStore.state = { ...boardStore.state, groups: layoutDiagram(composeDiagram(boardStore.state.groups.filter(group => !shapeIds.has(group.id))), boardStore.state.student) };
  }
  boardStore.state = { ...boardStore.state, open: true, animation, time: 0, playing: true, focus: null };
  emit();
  return true;
}
export function pauseAnimation() {
  if (!boardStore.state.playing) return;
  boardStore.state = { ...boardStore.state, playing: false };
  emit();
}
export function playAnimation() {
  if (!boardStore.state.animation) return;
  boardStore.state = { ...boardStore.state, playing: true, time: boardStore.state.time >= boardStore.state.animation.duration ? 0 : boardStore.state.time };
  emit();
}
export function seekAnimation(time: number) {
  if (!boardStore.state.animation || !Number.isFinite(time)) return;
  boardStore.state = { ...boardStore.state, time: Math.max(0, Math.min(boardStore.state.animation.duration, time)) };
  emit();
}
export function advanceAnimation(seconds: number) {
  if (!boardStore.state.playing || !boardStore.state.animation) return;
  const time = Math.min(boardStore.state.animation.duration, boardStore.state.time + seconds);
  boardStore.state = { ...boardStore.state, time, playing: time < boardStore.state.animation.duration };
  emit();
}
export function focusAnimation(id: string) {
  if (!boardStore.state.animation?.shapes.some(s => s.id === id)) return;
  boardStore.state = { ...boardStore.state, focus: id };
  emit();
}

// Park each desk independently, always restoring a still frame.
export function restoreBoard(snapshot: BoardState) {
  boardStore.state = { ...structuredClone(snapshot), pageId: snapshot.pageId ?? 1, earlierPages: structuredClone(snapshot.earlierPages ?? []), studentPast: structuredClone(snapshot.studentPast ?? []), studentFuture: structuredClone(snapshot.studentFuture ?? []), playing: false };
  emit();
}
