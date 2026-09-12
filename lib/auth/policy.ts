export const JUDGE_EMAIL = "judge@betterofficehours.app";

export type AuthReadiness = {
  ready: boolean;
  missing: Array<
    "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "NEXTAUTH_SECRET"
  >;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return (
    /^[^@\s]+@yale\.edu$/.test(normalized) || normalized === JUDGE_EMAIL
  );
}

export function getAuthReadiness(
  environment: Record<string, string | undefined> = process.env,
): AuthReadiness {
  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
  ] as const;
  const missing = required.filter((name) => !environment[name]?.trim());
  return { ready: missing.length === 0, missing };
}
