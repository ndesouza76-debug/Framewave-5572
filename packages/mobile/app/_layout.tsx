// System-managed layout — extend in place, never rewrite from scratch.
// Keep the provider chain intact: ErrorBoundary → OneDollarStats → SafeArea → QueryClient.
// To switch navigation, replace only the <Slot /> line with <Stack /> or <Tabs />.
import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AutumnProvider } from "autumn-js/react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { OneDollarStatsProvider } from "../lib/__analytics";
import { isWeb, startWebSafeArea } from "../lib/__web-safe-area";
import { authClient, getToken } from "../lib/auth";
import appJson from "../app.json";

const queryClient = new QueryClient();

const applicationId = appJson.expo.extra.applicationId ?? "";
const hostname = applicationId ? `${applicationId}-mobile` : "localhost";
const autumnBackendUrl =
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

// Autumn billing runs cross-origin with a bearer token (no cookies). Keyed on the
// session user so it remounts and picks up a fresh token on sign-in / sign-out.
function Billing({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const token = getToken();
  return (
    <AutumnProvider
      key={session?.user?.id ?? "anon"}
      useBetterAuth
      backendUrl={autumnBackendUrl}
      includeCredentials={false}
      headers={token ? { Authorization: `Bearer ${token}` } : undefined}
    >
      {children}
    </AutumnProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (isWeb) startWebSafeArea();
    // Completes a returning Expo Web managed-auth sign-in; no-op on native.
    void authClient.managedAuth.handleRedirect();
  }, []);

  return (
    <ErrorBoundary>
      {/* Runable analytics provider — do not remove, required for analytics tracking */}
      <OneDollarStatsProvider
        config={{
          hostname,
          collectorUrl: "https://r.lilstts.com/events",
          devmode: true,
        }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Billing>
              <StatusBar style="light" />
              <Slot />
            </Billing>
          </QueryClientProvider>
        </SafeAreaProvider>
      </OneDollarStatsProvider>
    </ErrorBoundary>
  );
}
