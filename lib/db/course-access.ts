import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertCourseAccess(
  userId: string,
  courseId: string,
  client: SupabaseClient,
): Promise<void> {
  const { data, error } = await client
    .from("course_memberships")
    .select("course_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error("Unable to verify course access");
  if (!data) throw new Error("Course not found");
}
