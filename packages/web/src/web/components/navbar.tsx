import { Link, useLocation } from "wouter";
import { useCustomer } from "autumn-js/react";
import { Sparkles, Wand2, Clock, LayoutGrid, Gem, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { useAuth } from "../hooks/use-auth";
import { authClient } from "../lib/auth";

const NAV = [
  { to: "/studio", label: "Studio", icon: Wand2 },
  { to: "/history", label: "History", icon: Clock },
  { to: "/gallery", label: "Gallery", icon: LayoutGrid },
  { to: "/pricing", label: "Pricing", icon: Gem },
];

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = loc === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                    active
                      ? "bg-white/5 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <CreditPill />
              <Link
                to="/studio"
                className="rounded-full gradient-bg px-4 py-1.5 text-sm font-medium text-white shadow-[0_6px_20px_-8px_rgba(255,61,119,0.7)] transition hover:brightness-110"
              >
                Create
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1 pr-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
                  {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
                </span>
                <button
                  onClick={() => authClient.signOut()}
                  className="text-muted-foreground transition hover:text-destructive"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground transition hover:text-foreground">
                Sign in
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-[#14100a] transition hover:brightness-105"
              >
                <Sparkles className="h-4 w-4" /> Start free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-border pt-3">
              {isAuthenticated ? (
                <button
                  onClick={() => authClient.signOut()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-gold px-4 py-2 text-center text-sm font-semibold text-[#14100a]"
                >
                  Start free
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CreditPill() {
  const { data: customer } = useCustomer();
  const bal = customer?.balances?.credits;
  const remaining = bal?.remaining;
  return (
    <Link
      to="/pricing"
      className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm text-gold transition hover:bg-gold/15"
      title="Credits remaining"
    >
      <Gem className="h-3.5 w-3.5" />
      <span className="font-semibold tabular-nums">{remaining ?? "—"}</span>
    </Link>
  );
}
