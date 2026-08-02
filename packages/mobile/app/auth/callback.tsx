import { Redirect } from "expo-router";

// Deep-link landing route for the managed-auth broker. Without a matching route
// expo-router briefly shows "Unmatched Route" on Android before we redirect home.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
