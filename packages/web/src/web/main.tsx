// Entry point referenced by index.html — composition only, real bootstrap
// lives in __main.tsx (template-managed).
import { authClient } from "./lib/auth";
import "./__main";

// Complete a returning managed (Google) sign-in redirect. The reactive session
// (useSession) refreshes itself once this resolves, so the UI updates without a reload.
void authClient.managedAuth.handleRedirect();
