import type { Chunk, CourseDocument } from "@/lib/types";

export type CourseSourceRecord = {
  courseId: string;
  documentId: string;
  documentKind: CourseDocument["kind"];
  documentTitle: string;
  storagePath: string;
  page?: number;
  text: string;
  isSolution?: boolean;
};

export type IndexedCourseChunk = {
  courseId: string;
  documentKind: CourseDocument["kind"];
  documentTitle: string;
  storagePath: string;
  chunk: Chunk;
};

export type RetrievalRequest = {
  courseId: string;
  query: string;
  limit?: number;
};

export type StudentContextChunk = {
  documentKind: Exclude<CourseDocument["kind"], "solution">;
  documentTitle: string;
  page?: number;
  text: string;
};
