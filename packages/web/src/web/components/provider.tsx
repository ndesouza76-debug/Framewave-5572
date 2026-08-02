import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AutumnProvider } from "autumn-js/react";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1 },
  },
});

interface ProviderProps {
  children: React.ReactNode;
}

// App-level providers. QueryClientProvider must stay (all API calls run through
// TanStack Query). AutumnProvider (useBetterAuth) powers credits/subscriptions.
export function Provider({ children }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AutumnProvider useBetterAuth>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#141418",
              border: "1px solid #232329",
              color: "#f5f3ef",
            },
          }}
        />
      </AutumnProvider>
    </QueryClientProvider>
  );
}
