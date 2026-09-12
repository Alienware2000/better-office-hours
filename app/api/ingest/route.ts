import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAllowedEmail,
  normalizeEmail,
  type AuthenticatedIdentity,
} from "@/lib/auth";
import {
  persistCourseContext,
  type CourseSourceRecord,
  type PersistedCourse,
} from "@/lib/context";
import { isPersistenceConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";

const DOCUMENT_KINDS = new Set([
  "syllabus",
  "lecture",
  "pset",
  "solution",
  "exam_review",
  "other",
]);

function validToken(actual: string | null): boolean {
  const expected = process.env.INGEST_TOKEN?.trim();
  const supplied = actual?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

function readCourse(value: unknown): PersistedCourse {
  if (!value || typeof value !== "object") throw new Error("course is required");
  const course = value as Record<string, unknown>;
  return {
    courseId: String(course.courseId ?? ""),
    courseName: String(course.courseName ?? ""),
    term: String(course.term ?? ""),
  };
}

function readSources(value: unknown): CourseSourceRecord[] {
  if (!Array.isArray(value)) throw new Error("sources must be an array");
  const sources = value.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("each source must be an object");
    }
    const source = entry as Record<string, unknown>;
    const documentKind = String(source.documentKind ?? "");
    if (!DOCUMENT_KINDS.has(documentKind)) {
      throw new Error("documentKind is invalid");
    }
    if (
      source.page !== undefined &&
      (!Number.isInteger(source.page) || Number(source.page) < 0)
    ) {
      throw new Error("page must be a non-negative integer");
    }
    if (
      typeof source.text !== "string" ||
      source.text.length === 0 ||
      source.text.length > 2_000_000
    ) {
      throw new Error("source text must be between 1 and 2000000 characters");
    }
    return {
      courseId: String(source.courseId ?? ""),
      documentId: String(source.documentId ?? ""),
      documentKind: documentKind as CourseSourceRecord["documentKind"],
      documentTitle: String(source.documentTitle ?? ""),
      storagePath: String(source.storagePath ?? ""),
      page:
        source.page === undefined ? undefined : Number(source.page),
      text: source.text,
      isSolution: source.isSolution === true,
    };
  });
  const totalCharacters = sources.reduce(
    (total, source) => total + source.text.length,
    0,
  );
  if (totalCharacters > 20_000_000) {
    throw new Error("source batch must not exceed 20000000 characters");
  }
  return sources;
}

async function requestIdentity(
  request: NextRequest,
  body: Record<string, unknown>,
): Promise<AuthenticatedIdentity | null> {
  if (!validToken(request.headers.get("authorization"))) return null;

  const userEmail =
    typeof body.userEmail === "string" ? normalizeEmail(body.userEmail) : "";
  if (!isAllowedEmail(userEmail)) return null;
  const name =
    typeof body.userName === "string" ? body.userName.trim() : "";
  return { email: userEmail, ...(name ? { name } : {}) };
}

export async function POST(request: NextRequest) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json(
      { error: "Course persistence is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const identity = await requestIdentity(request, body);
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await persistCourseContext(
      identity,
      readCourse(body.course),
      readSources(body.sources),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid ingest request";
    const clientError =
      message.includes("must") ||
      message.includes("required") ||
      message.includes("batch") ||
      message.includes("Sources");
    return NextResponse.json(
      { error: clientError ? message : "Unable to ingest course context" },
      { status: clientError ? 400 : 500 },
    );
  }
}
