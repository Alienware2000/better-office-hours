import "server-only";

import { getServerSession } from "next-auth";
import { getAuthenticatedIdentity, type AuthenticatedIdentity } from "./identity";
import { authOptions } from "./options";

export async function getServerIdentity(): Promise<AuthenticatedIdentity | null> {
  const session = await getServerSession(authOptions);
  return getAuthenticatedIdentity(session);
}
