import { rankCourseChunks } from "./rank";
import type { IndexedCourseChunk, RetrievalRequest } from "./types";

export function retrieveStudentChunks(
  index: readonly IndexedCourseChunk[],
  request: RetrievalRequest,
): IndexedCourseChunk[] {
  return rankCourseChunks(
    index.filter((item) => !item.chunk.isSolution),
    request,
  );
}
