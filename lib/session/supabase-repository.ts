import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticatedIdentity } from "@/lib/auth";
import { assertCourseAccess } from "@/lib/db/course-access";
import { resolveDatabaseIdentity } from "@/lib/db/identity";
import { requireIdentifier } from "@/lib/db/identifiers";
import { getServerSupabase } from "@/lib/db/supabase";
import type { Recap } from "@/lib/types";
import type {
  RecapRepository,
  RecapScope,
  StoredRecap,
} from "./persistence";
import { validateRecap } from "./recap";

type RecapRow = {
  recap: unknown;
  saved_at: string;
};

export class SupabaseRecapRepository implements RecapRepository {
  constructor(private readonly client: SupabaseClient = getServerSupabase()) {}

  async load(scopeInput: RecapScope): Promise<StoredRecap | null> {
    const scope = this.validateScope(scopeInput);
    await assertCourseAccess(scope.userId, scope.courseId, this.client);

    const { data, error } = await this.client
      .from("session_recaps")
      .select("recap,saved_at")
      .eq("user_id", scope.userId)
      .eq("course_id", scope.courseId)
      .eq("session_id", scope.sessionId)
      .maybeSingle<RecapRow>();
    if (error) throw new Error("Unable to load recap");
    if (!data) return null;

    const recap = validateRecap(data.recap);
    if (!recap.ok) throw new Error("Stored recap is invalid");
    return { scope, recap: recap.value, savedAt: data.saved_at };
  }

  async save(scopeInput: RecapScope, input: Recap): Promise<StoredRecap> {
    const scope = this.validateScope(scopeInput);
    const recap = validateRecap(input);
    if (!recap.ok) throw new Error("Recap is invalid");
    await assertCourseAccess(scope.userId, scope.courseId, this.client);

    const savedAt = new Date().toISOString();
    const { data, error } = await this.client
      .from("session_recaps")
      .upsert(
        {
          user_id: scope.userId,
          course_id: scope.courseId,
          session_id: scope.sessionId,
          recap: recap.value,
          saved_at: savedAt,
        },
        { onConflict: "user_id,course_id,session_id" },
      )
      .select("recap,saved_at")
      .single<RecapRow>();
    if (error || !data) throw new Error("Unable to save recap");

    return { scope, recap: recap.value, savedAt: data.saved_at };
  }

  private validateScope(scope: RecapScope): RecapScope {
    return {
      userId: requireIdentifier(scope.userId, "userId"),
      courseId: requireIdentifier(scope.courseId, "courseId"),
      sessionId: requireIdentifier(scope.sessionId, "sessionId"),
    };
  }
}

async function authenticatedScope(
  identity: AuthenticatedIdentity,
  courseId: string,
  sessionId: string,
  client: SupabaseClient,
): Promise<RecapScope> {
  const user = await resolveDatabaseIdentity(identity, client);
  return {
    userId: user.userId,
    courseId: requireIdentifier(courseId, "courseId"),
    sessionId: requireIdentifier(sessionId, "sessionId"),
  };
}

export async function loadAuthenticatedRecap(
  identity: AuthenticatedIdentity,
  courseId: string,
  sessionId: string,
  client: SupabaseClient = getServerSupabase(),
): Promise<StoredRecap | null> {
  const scope = await authenticatedScope(identity, courseId, sessionId, client);
  return new SupabaseRecapRepository(client).load(scope);
}

export async function saveAuthenticatedRecap(
  identity: AuthenticatedIdentity,
  courseId: string,
  sessionId: string,
  recap: Recap,
  client: SupabaseClient = getServerSupabase(),
): Promise<StoredRecap> {
  const scope = await authenticatedScope(identity, courseId, sessionId, client);
  return new SupabaseRecapRepository(client).save(scope, recap);
}
