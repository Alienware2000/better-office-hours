import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticatedIdentity } from "@/lib/auth";
import { assertCourseAccess } from "@/lib/db/course-access";
import { resolveDatabaseIdentity } from "@/lib/db/identity";
import { requireIdentifier, requireShortText } from "@/lib/db/identifiers";
import { getServerSupabase } from "@/lib/db/supabase";
import { chunkSourceRecords } from "./chunk";
import { retrieveStudentContext } from "./retrieve";
import { retrieveServerReferenceChunks } from "./server-reference";
import type {
  CourseSourceRecord,
  IndexedCourseChunk,
  RetrievalRequest,
  StudentContextChunk,
} from "./types";

export type PersistedCourse = {
  courseId: string;
  courseName: string;
  term: string;
};

type ContextChunkRow = {
  course_id: string;
  chunk_id: string;
  document_id: string;
  document_kind: CourseSourceRecord["documentKind"];
  document_title: string;
  storage_path: string;
  page: number | null;
  content: string;
  is_solution: boolean;
};

function toIndexedChunk(row: ContextChunkRow): IndexedCourseChunk {
  return {
    courseId: row.course_id,
    documentKind: row.document_kind,
    documentTitle: row.document_title,
    storagePath: row.storage_path,
    chunk: {
      id: row.chunk_id,
      documentId: row.document_id,
      text: row.content,
      page: row.page ?? undefined,
      embedding: [],
      isSolution: row.is_solution,
    },
  };
}

export async function persistCourseContext(
  identity: AuthenticatedIdentity,
  courseInput: PersistedCourse,
  sources: CourseSourceRecord[],
  client: SupabaseClient = getServerSupabase(),
): Promise<{ chunkCount: number }> {
  const course = {
    courseId: requireIdentifier(courseInput.courseId, "courseId"),
    courseName: requireShortText(courseInput.courseName, "courseName"),
    term: requireShortText(courseInput.term, "term", 100),
  };
  if (
    sources.length === 0 ||
    sources.length > 500 ||
    sources.some((source) => source.courseId !== course.courseId)
  ) {
    throw new Error("Sources must belong to exactly one non-empty course batch");
  }

  const chunks = chunkSourceRecords(sources);
  if (chunks.length === 0 || chunks.length > 5_000) {
    throw new Error("Course batch must produce between 1 and 5000 chunks");
  }

  const user = await resolveDatabaseIdentity(identity, client);
  const { error: courseError } = await client.from("courses").upsert({
    id: course.courseId,
    name: course.courseName,
    term: course.term,
  });
  if (courseError) throw new Error("Unable to save course");

  const { error: membershipError } = await client
    .from("course_memberships")
    .upsert(
      { user_id: user.userId, course_id: course.courseId },
      { onConflict: "user_id,course_id" },
    );
  if (membershipError) throw new Error("Unable to save course membership");

  const rows = chunks.map((item) => ({
    course_id: item.courseId,
    chunk_id: item.chunk.id,
    document_id: item.chunk.documentId,
    document_kind: item.documentKind,
    document_title: item.documentTitle,
    storage_path: item.storagePath,
    page: item.chunk.page ?? null,
    content: item.chunk.text,
    is_solution: item.chunk.isSolution,
  }));

  for (let start = 0; start < rows.length; start += 200) {
    const { error } = await client
      .from("context_chunks")
      .upsert(rows.slice(start, start + 200), {
        onConflict: "course_id,chunk_id",
      });
    if (error) throw new Error("Unable to save course context");
  }

  return { chunkCount: rows.length };
}

async function loadOwnedCourseIndex(
  identity: AuthenticatedIdentity,
  request: RetrievalRequest,
  client: SupabaseClient,
): Promise<IndexedCourseChunk[]> {
  const courseId = requireIdentifier(request.courseId, "courseId");
  const user = await resolveDatabaseIdentity(identity, client);
  await assertCourseAccess(user.userId, courseId, client);

  const { data, error } = await client
    .from("context_chunks")
    .select(
      "course_id,chunk_id,document_id,document_kind,document_title,storage_path,page,content,is_solution",
    )
    .eq("course_id", courseId)
    .limit(1_000)
    .returns<ContextChunkRow[]>();
  if (error) throw new Error("Unable to load course context");
  return (data ?? []).map(toIndexedChunk);
}

export async function retrievePersistedStudentContext(
  identity: AuthenticatedIdentity,
  request: RetrievalRequest,
  client: SupabaseClient = getServerSupabase(),
): Promise<StudentContextChunk[]> {
  const index = await loadOwnedCourseIndex(identity, request, client);
  return retrieveStudentContext(index, request);
}

export async function retrievePersistedSolutionReferences(
  identity: AuthenticatedIdentity,
  request: RetrievalRequest,
  client: SupabaseClient = getServerSupabase(),
): Promise<IndexedCourseChunk[]> {
  const index = await loadOwnedCourseIndex(identity, request, client);
  return retrieveServerReferenceChunks(index, request);
}
