import { NextResponse, type NextRequest } from "next/server";
import { getServerIdentity } from "@/lib/auth";
import { retrievePersistedStudentContext } from "@/lib/context";
import { isPersistenceConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isPersistenceConfigured()) {
    return NextResponse.json(
      { error: "Course persistence is not configured" },
      { status: 503 },
    );
  }

  const identity = await getServerIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (
      typeof body.query !== "string" ||
      body.query.trim().length === 0 ||
      body.query.length > 2_000
    ) {
      return NextResponse.json(
        { error: "query must be between 1 and 2000 characters" },
        { status: 400 },
      );
    }
    const limit =
      body.limit === undefined ? undefined : Number(body.limit);
    const chunks = await retrievePersistedStudentContext(identity, {
      courseId: String(body.courseId ?? ""),
      query: body.query,
      limit,
    });
    return NextResponse.json({ chunks });
  } catch (error) {
    const notFound =
      error instanceof Error && error.message === "Course not found";
    return NextResponse.json(
      { error: notFound ? "Course not found" : "Unable to retrieve context" },
      { status: notFound ? 404 : 400 },
    );
  }
}
