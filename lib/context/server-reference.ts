import { rankCourseChunks } from "./rank";
import type { IndexedCourseChunk, RetrievalRequest } from "./types";

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error("Solution references are available only on the server");
  }
}

export function retrieveServerReferenceChunks(
  index: readonly IndexedCourseChunk[],
  request: RetrievalRequest,
): IndexedCourseChunk[] {
  assertServerRuntime();
  return rankCourseChunks(
    index.filter((item) => item.chunk.isSolution),
    request,
  );
}
