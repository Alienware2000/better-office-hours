import { rankCourseChunks } from "./rank";
import type {
  IndexedCourseChunk,
  RetrievalRequest,
  StudentContextChunk,
} from "./types";

function isStudentSafe(
  item: IndexedCourseChunk,
): item is IndexedCourseChunk & {
  documentKind: StudentContextChunk["documentKind"];
} {
  return item.documentKind !== "solution" && !item.chunk.isSolution;
}

export function retrieveStudentContext(
  index: readonly IndexedCourseChunk[],
  request: RetrievalRequest,
): StudentContextChunk[] {
  return rankCourseChunks(index.filter(isStudentSafe), request).map((item) => ({
    documentKind: item.documentKind,
    documentTitle: item.documentTitle,
    page: item.chunk.page,
    text: item.chunk.text,
  }));
}
