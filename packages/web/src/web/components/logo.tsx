import { Link } from "wouter";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-gold/50 bg-gradient-to-br from-[#1a1a20] to-[#0c0c0f]">
        <span className="h-3 w-3 rounded-[3px] gradient-bg shadow-[0_0_10px_rgba(255,61,119,0.6)]" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        Frame<span className="gold-text">wave</span>
      </span>
    </Link>
  );
}
