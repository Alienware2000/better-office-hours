"use client";

import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import type { AuthenticatedIdentity } from "@/lib/auth";
import styles from "./sign-in.module.css";

type SignInPanelProps = {
  configured: boolean;
  identity: AuthenticatedIdentity | null;
  missing: string[];
};

export function SignInPanel({
  configured,
  identity,
  missing,
}: SignInPanelProps) {
  if (identity) {
    return (
      <section className={styles.card} aria-labelledby="account-title">
        <p className={styles.eyebrow}>Better Office Hours</p>
        <h1 id="account-title">You are signed in</h1>
        <p className={styles.copy}>
          {identity.name ? `${identity.name}, ` : ""}
          {identity.email}
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            Continue to the tutor
          </Link>
          <button
            className={styles.secondary}
            type="button"
            onClick={() => void signOut({ callbackUrl: "/sign-in" })}
          >
            Sign out
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card} aria-labelledby="sign-in-title">
      <p className={styles.eyebrow}>Better Office Hours</p>
      <h1 id="sign-in-title">Bring your course with you</h1>
      <p className={styles.copy}>
        Sign in with your Yale Google account. The tutor will only use course
        and session information that belongs to you.
      </p>
      <button
        className={styles.primary}
        type="button"
        disabled={!configured}
        onClick={() => void signIn("google", { callbackUrl: "/" })}
      >
        Continue with Google
      </button>
      {!configured ? (
        <div className={styles.notice} role="status">
          <strong>Authentication is not configured on this deployment.</strong>
          <span>Missing: {missing.join(", ")}</span>
        </div>
      ) : null}
      <p className={styles.note}>
        Access is limited to Yale email accounts. Judge password access is not
        enabled in this first slice.
      </p>
    </section>
  );
}
