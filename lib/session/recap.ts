import type { Recap } from "@/lib/types";

export type RecapValidationIssue = {
  path: string;
  message: string;
};

export type RecapValidationResult =
  | { ok: true; value: Recap }
  | { ok: false; issues: RecapValidationIssue[] };

const LIMITS = {
  stuckOn: 500,
  unlockedBy: 500,
  documentTitle: 200,
  where: 200,
  studentSummary: 1_000,
  spokenText: 1_000,
} as const;

const ANSWER_DISCLOSURE =
  /\b(?:the\s+)?(?:final\s+answer|answer\s+key|complete\s+solution)\s*(?:is|:)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  maximum: number,
  issues: RecapValidationIssue[],
  allowEmpty = false,
): string {
  const value = record[key];
  if (typeof value !== "string") {
    issues.push({ path, message: "must be a string" });
    return "";
  }

  const normalized = value.trim();
  if (!allowEmpty && normalized.length === 0) {
    issues.push({ path, message: "must not be empty" });
  }
  if (normalized.length > maximum) {
    issues.push({ path, message: `must be ${maximum} characters or fewer` });
  }
  return normalized;
}

export function validateRecap(input: unknown): RecapValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ path: "recap", message: "must be an object" }],
    };
  }

  const issues: RecapValidationIssue[] = [];
  const stuckOn = readString(
    input,
    "stuckOn",
    "stuckOn",
    LIMITS.stuckOn,
    issues,
  );
  const unlockedBy = readString(
    input,
    "unlockedBy",
    "unlockedBy",
    LIMITS.unlockedBy,
    issues,
  );
  const studentSummary = readString(
    input,
    "studentSummary",
    "studentSummary",
    LIMITS.studentSummary,
    issues,
  );
  const spokenText = readString(
    input,
    "spokenText",
    "spokenText",
    LIMITS.spokenText,
    issues,
  );

  const review = isRecord(input.reviewNext) ? input.reviewNext : {};
  if (!isRecord(input.reviewNext)) {
    issues.push({ path: "reviewNext", message: "must be an object" });
  }
  const documentTitle = readString(
    review,
    "documentTitle",
    "reviewNext.documentTitle",
    LIMITS.documentTitle,
    issues,
    true,
  );
  const where = readString(
    review,
    "where",
    "reviewNext.where",
    LIMITS.where,
    issues,
    true,
  );

  if (Boolean(documentTitle) !== Boolean(where)) {
    issues.push({
      path: "reviewNext",
      message: "must provide both documentTitle and where, or leave both empty",
    });
  }

  for (const [path, value] of [
    ["stuckOn", stuckOn],
    ["unlockedBy", unlockedBy],
  ] as const) {
    if (ANSWER_DISCLOSURE.test(value)) {
      issues.push({
        path,
        message: "must not disclose an answer key or complete solution",
      });
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      stuckOn,
      unlockedBy,
      reviewNext: { documentTitle, where },
      studentSummary,
      spokenText,
    },
  };
}

export function serializeRecap(recap: Recap): string {
  const result = validateRecap(recap);
  if (!result.ok) {
    throw new Error(
      `Invalid recap: ${result.issues
        .map((issue) => `${issue.path} ${issue.message}`)
        .join("; ")}`,
    );
  }
  return JSON.stringify(result.value);
}

export function deserializeRecap(serialized: string): RecapValidationResult {
  try {
    return validateRecap(JSON.parse(serialized));
  } catch {
    return {
      ok: false,
      issues: [{ path: "recap", message: "must be valid JSON" }],
    };
  }
}
