import type { Recap } from "@/lib/types";

export type RecapScope = {
  userId: string;
  courseId: string;
  sessionId: string;
};

export type StoredRecap = {
  scope: RecapScope;
  recap: Recap;
  savedAt: string;
};

/**
 * Proposed persistence boundary for a future server-side adapter.
 *
 * The adapter must derive userId from the authenticated server session, verify
 * that the user owns the course/session, and enforce a unique database key on
 * (userId, courseId, sessionId). save must use an upsert or equivalent
 * transaction so retrying the same completed session cannot create duplicates.
 * Implementations must never trust identity supplied by a browser request.
 */
export interface RecapRepository {
  load(scope: RecapScope): Promise<StoredRecap | null>;
  save(scope: RecapScope, recap: Recap): Promise<StoredRecap>;
}
