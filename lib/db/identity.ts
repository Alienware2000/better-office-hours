import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticatedIdentity } from "@/lib/auth";
import { getServerSupabase } from "./supabase";

export type DatabaseIdentity = {
  userId: string;
  email: string;
  name?: string;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
};

export async function resolveDatabaseIdentity(
  identity: AuthenticatedIdentity,
  client: SupabaseClient = getServerSupabase(),
): Promise<DatabaseIdentity> {
  const displayName = identity.name?.trim() || null;
  const { data, error } = await client
    .from("app_users")
    .upsert(
      {
        email: identity.email,
        display_name: displayName,
      },
      { onConflict: "email" },
    )
    .select("id,email,display_name")
    .single<UserRow>();

  if (error || !data) {
    throw new Error("Unable to resolve authenticated user");
  }

  return {
    userId: data.id,
    email: data.email,
    ...(data.display_name ? { name: data.display_name } : {}),
  };
}
