import { getServerSession } from "next-auth";
import { getAuthenticatedIdentity, getAuthReadiness } from "@/lib/auth";
import { authOptions } from "@/lib/auth/options";
import { SignInPanel } from "./SignInPanel";
import styles from "./sign-in.module.css";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const readiness = getAuthReadiness();
  const session = readiness.ready
    ? await getServerSession(authOptions)
    : null;
  const identity = getAuthenticatedIdentity(session);

  return (
    <main className={styles.page}>
      <SignInPanel
        configured={readiness.ready}
        identity={identity}
        missing={readiness.missing}
      />
    </main>
  );
}
