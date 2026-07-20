import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getAllowedUserEmail } from "@/lib/auth/allowed-user";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required for server-side admin operations. Use the modern sb_secret_... key (replaces the legacy service_role key)."
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAdminUserId(
  client: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const {
    data: { users },
    error,
  } = await client.auth.admin.listUsers();

  if (error || !users || users.length === 0) {
    return null;
  }

  const allowedEmail = getAllowedUserEmail();
  const match = users.find((u) => (u.email ?? "").trim().toLowerCase() === allowedEmail);
  return match?.id ?? null;
}