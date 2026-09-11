import type { Chunk } from "@/lib/types";
import type { CourseSourceRecord, IndexedCourseChunk } from "./types";

export type ChunkingOptions = {
  maxCharacters?: number;
  overlapCharacters?: number;
};

const DEFAULT_MAX_CHARACTERS = 900;
const DEFAULT_OVERLAP_CHARACTERS = 120;

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function findBreak(text: string, start: number, targetEnd: number): number {
  if (targetEnd >= text.length) return text.length;

  const minimumEnd = start + Math.floor((targetEnd - start) * 0.6);
  for (let index = targetEnd; index >= minimumEnd; index -= 1) {
    if (/[.!?]\s/.test(text.slice(index - 1, index + 1))) return index;
  }
  for (let index = targetEnd; index >= minimumEnd; index -= 1) {
    if (text[index] === " ") return index;
  }
  return targetEnd;
}

function splitText(
  text: string,
  maxCharacters: number,
  overlapCharacters: number,
): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const pieces: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = findBreak(normalized, start, start + maxCharacters);
    const piece = normalized.slice(start, end).trim();
    if (piece) pieces.push(piece);
    if (end >= normalized.length) break;

    const nextStart = Math.max(start + 1, end - overlapCharacters);
    const nextSpace = normalized.indexOf(" ", nextStart);
    start = nextSpace === -1 ? end : nextSpace + 1;
  }
  return pieces;
}

export function chunkSourceRecord(
  source: CourseSourceRecord,
  options: ChunkingOptions = {},
): IndexedCourseChunk[] {
  const maxCharacters = options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const overlapCharacters =
    options.overlapCharacters ?? DEFAULT_OVERLAP_CHARACTERS;

  if (maxCharacters < 100) {
    throw new Error("maxCharacters must be at least 100");
  }
  if (overlapCharacters < 0 || overlapCharacters >= maxCharacters) {
    throw new Error("overlapCharacters must be non-negative and below maxCharacters");
  }

  const isSolution =
    source.documentKind === "solution" || source.isSolution === true;

  return splitText(source.text, maxCharacters, overlapCharacters).map(
    (text, index) => {
      const chunk: Chunk = {
        id: `${source.documentId}:${index}:${stableHash(text)}`,
        documentId: source.documentId,
        text,
        page: source.page,
        embedding: [],
        isSolution,
      };

      return {
        courseId: source.courseId,
        documentKind: source.documentKind,
        documentTitle: source.documentTitle,
        storagePath: source.storagePath,
        chunk,
      };
    },
  );
}

export function chunkSourceRecords(
  sources: CourseSourceRecord[],
  options: ChunkingOptions = {},
): IndexedCourseChunk[] {
  return sources.flatMap((source) => chunkSourceRecord(source, options));
}
