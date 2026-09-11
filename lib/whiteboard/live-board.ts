import type { BoardSnapshot } from "@/lib/types";

export type LiveBoard = BoardSnapshot & {
  open?: boolean;
};

let live: LiveBoard | null = null;
let snapshotProvider: (() => LiveBoard | null) | null = null;

export function setBoardSnapshotProvider(provider: (() => LiveBoard | null) | null) {
  snapshotProvider = provider;
}

export function setLiveBoard(next: LiveBoard | null) {
  live = next;
}

export function getLiveBoard(): LiveBoard | null {
  return snapshotProvider ? snapshotProvider() : live;
}

export function asLiveBoard(value: unknown): LiveBoard | null {
  if (!value || typeof value !== "object") return null;
  const board = value as Partial<LiveBoard>;
  const open = board.open === true;
  const imageUrl = typeof board.imageUrl === "string" ? board.imageUrl : "";
  const studentShapesSince =
    typeof board.studentShapesSince === "string" ? board.studentShapesSince : "";
  if (!open && !imageUrl) return null;
  return { imageUrl, studentShapesSince, open };
}
