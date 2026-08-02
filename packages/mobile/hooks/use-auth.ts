import { authClient } from "@/lib/auth";

/** Reactive session + auth state for screens. */
export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isPending,
  };
}
