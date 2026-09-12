import type { Session } from "next-auth";
import { isAllowedEmail, normalizeEmail } from "./policy";

export type AuthenticatedIdentity = {
  email: string;
  name?: string;
};

export function getAuthenticatedIdentity(
  session: Session | null,
): AuthenticatedIdentity | null {
  const email = session?.user?.email;
  if (!email || !isAllowedEmail(email)) return null;

  const name = session?.user?.name?.trim();
  return {
    email: normalizeEmail(email),
    ...(name ? { name } : {}),
  };
}
