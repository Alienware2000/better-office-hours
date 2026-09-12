export const JUDGE_EMAIL = "judge@betterofficehours.app";

export type AuthReadiness = {
  ready: boolean;
  missing: Array<
    "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "NEXTAUTH_SECRET"
  >;
};

export type ProductionAuthReadiness = {
  ready: boolean;
  missing: Array<
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "NEXTAUTH_SECRET"
    | "NEXTAUTH_URL"
  >;
  callbackUrl?: string;
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

export function getProductionAuthReadiness(
  environment: Record<string, string | undefined> = process.env,
): ProductionAuthReadiness {
  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ] as const;
  const missing = required.filter((name) => !environment[name]?.trim());
  if (missing.length > 0) return { ready: false, missing };

  try {
    const url = new URL(environment.NEXTAUTH_URL!);
    if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) {
      return { ready: false, missing: [] };
    }
    return {
      ready: true,
      missing: [],
      callbackUrl: new URL("/api/auth/callback/google", url).toString(),
    };
  } catch {
    return { ready: false, missing: [] };
  }
}
