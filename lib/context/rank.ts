import type { IndexedCourseChunk, RetrievalRequest } from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "in",
  "is",
  "of",
  "on",
  "the",
  "to",
  "what",
  "why",
]);

function terms(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .split(" ")
        .filter((term) => term.length > 1 && !STOP_WORDS.has(term)),
    ),
  ];
}

function score(item: IndexedCourseChunk, queryTerms: string[]): number {
  const body = new Set(terms(item.chunk.text));
  const title = new Set(terms(item.documentTitle));

  return queryTerms.reduce((total, term) => {
    if (title.has(term)) return total + 3;
    if (body.has(term)) return total + 1;
    return total;
  }, 0);
}

export function rankCourseChunks(
  index: readonly IndexedCourseChunk[],
  request: RetrievalRequest,
): IndexedCourseChunk[] {
  const queryTerms = terms(request.query);
  if (!request.courseId.trim() || queryTerms.length === 0) return [];

  const limit = Math.max(1, Math.min(request.limit ?? 5, 20));
  return index
    .filter((item) => item.courseId === request.courseId)
    .map((item) => ({ item, score: score(item, queryTerms) }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.item.chunk.id.localeCompare(right.item.chunk.id),
    )
    .slice(0, limit)
    .map(({ item }) => item);
}
