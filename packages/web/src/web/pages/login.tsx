import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "../lib/auth";
import { useAuth } from "../hooks/use-auth";
import { Logo } from "../components/logo";
import { FramedMedia } from "../components/framed-media";
import { useGallery } from "../queries/gallery";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isPending } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState(false);

  const gallery = useGallery({ sort: "trending" });
  const hero = (gallery.data ?? []).find((g) => g.videoUrl);

  useEffect(() => {
    if (!isPending && isAuthenticated) navigate("/studio");
  }, [isAuthenticated, isPending, navigate]);

  async function onGoogle() {
    setGoogle(true);
    try {
      const result = await authClient.managedAuth.signIn({ provider: "google" });
      if (result.error && result.error.code !== "POPUP_CLOSED") {
        toast.error(result.error.message ?? "Google sign-in failed");
      }
    } catch {
      toast.error("Google sign-in failed");
    } finally {
      setGoogle(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({ name, email, password });
        if (error) return toast.error(error.message ?? "Could not create account");
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) return toast.error(error.message ?? "Invalid email or password");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* form */}
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to keep creating with Framewave."
              : "Start with 50 free credits — no card required."}
          </p>

          <button
            onClick={onGoogle}
            disabled={google}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-card-hover disabled:opacity-60"
          >
            {google ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={UserIcon} placeholder="Full name" value={name} onChange={setName} />
            )}
            <Field
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-bg px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Framewave?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-gold hover:brightness-110"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* visual */}
      <div className="relative hidden items-center justify-center overflow-hidden border-l border-border bg-elevated p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-80px] top-[-40px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(255,61,119,0.18),transparent)] blur-2xl" />
          <div className="absolute bottom-[-60px] left-[-40px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)] blur-2xl" />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <FramedMedia videoUrl={hero?.videoUrl} aspectRatio="16:9" hoverPlay />
          <blockquote className="mt-8 text-2xl font-semibold leading-snug">
            “A whole production studio, <span className="gold-text">condensed into a prompt.</span>”
          </blockquote>
          <p className="mt-3 text-sm text-muted-foreground">
            Text-to-video and image-to-video, powered by Google Veo 3.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: typeof Mail;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label={placeholder}
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
