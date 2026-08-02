import { authClient } from "../lib/auth";

/** Reactive session — updates after sign-in/out without a reload. */
export function useAuth() {
  const { data, isPending } = authClient.useSession();
  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isPending,
  };
}
