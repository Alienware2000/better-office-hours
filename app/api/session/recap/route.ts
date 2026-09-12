import { NextResponse, type NextRequest } from "next/server";
import { getServerIdentity } from "@/lib/auth";
import { isPersistenceConfigured } from "@/lib/db/supabase";
import {
  loadAuthenticatedRecap,
  saveAuthenticatedRecap,
  validateRecap,
} from "@/lib/session";

export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json(
    { error: "Recap persistence is not configured" },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  if (!isPersistenceConfigured()) return unavailable();
  const identity = await getServerIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const courseId = request.nextUrl.searchParams.get("courseId") ?? "";
    const sessionId = request.nextUrl.searchParams.get("sessionId") ?? "";
    const stored = await loadAuthenticatedRecap(
      identity,
      courseId,
      sessionId,
    );
    if (!stored) {
      return NextResponse.json({ error: "Recap not found" }, { status: 404 });
    }
    return NextResponse.json({
      recap: stored.recap,
      savedAt: stored.savedAt,
    });
  } catch (error) {
    const notFound =
      error instanceof Error && error.message === "Course not found";
    return NextResponse.json(
      { error: notFound ? "Course not found" : "Unable to load recap" },
      { status: notFound ? 404 : 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isPersistenceConfigured()) return unavailable();
  const identity = await getServerIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateRecap(body.recap);
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Invalid recap", issues: validation.issues },
        { status: 400 },
      );
    }
    const stored = await saveAuthenticatedRecap(
      identity,
      String(body.courseId ?? ""),
      String(body.sessionId ?? ""),
      validation.value,
    );
    return NextResponse.json({
      recap: stored.recap,
      savedAt: stored.savedAt,
    });
  } catch (error) {
    const notFound =
      error instanceof Error && error.message === "Course not found";
    return NextResponse.json(
      { error: notFound ? "Course not found" : "Unable to save recap" },
      { status: notFound ? 404 : 400 },
    );
  }
}
