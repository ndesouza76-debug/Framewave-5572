import { useRef, useState } from "react";
import { Play, Loader2, AlertTriangle } from "lucide-react";

interface FramedMediaProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  status?: string;
  progress?: number;
  aspectRatio?: string;
  className?: string;
  /** Autoplay muted loop preview (gallery/history grids). */
  hoverPlay?: boolean;
  rounded?: boolean;
  /** Reason shown under the failed state. */
  error?: string | null;
}

/**
 * Framewave's signature "gallery of frames" media surface — a generated clip
 * presented inside a thin gold art frame with corner ornaments. Handles the
 * queued/processing/failed states inline.
 */
export function FramedMedia({
  videoUrl,
  posterUrl,
  status = "completed",
  progress = 0,
  aspectRatio = "16:9",
  className = "",
  hoverPlay = false,
  rounded = true,
  error = null,
}: FramedMediaProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const ratio = aspectRatio === "9:16" ? "9 / 16" : "16 / 9";
  const isBusy = status === "queued" || status === "processing";

  return (
    <div
      className={`art-frame grain overflow-hidden ${rounded ? "rounded-xl" : ""} ${className}`}
      style={{ aspectRatio: ratio }}
      onMouseEnter={() => {
        if (hoverPlay && ref.current) void ref.current.play().catch(() => {});
      }}
      onMouseLeave={() => {
        if (hoverPlay && ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      }}
    >
      {/* corner ornaments */}
      <Corner className="left-1.5 top-1.5 border-l border-t" />
      <Corner className="right-1.5 top-1.5 border-r border-t" />
      <Corner className="bottom-1.5 left-1.5 border-b border-l" />
      <Corner className="bottom-1.5 right-1.5 border-b border-r" />

      {status === "completed" && videoUrl ? (
        <>
          <video
            ref={ref}
            aria-label="Generated video"
            src={videoUrl}
            poster={posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="metadata"
            controls={playing && !hoverPlay}
            className="h-full w-full object-cover"
          />
          {!hoverPlay && !playing && (
            <button
              onClick={() => {
                setPlaying(true);
                void ref.current?.play();
              }}
              className="absolute inset-0 grid place-items-center bg-black/20 transition hover:bg-black/10"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-gold/90 text-[#14100a] shadow-lg transition-transform hover:scale-105">
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
            </button>
          )}
        </>
      ) : status === "failed" ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertTriangle className="h-7 w-7" />
            <span className="text-sm text-muted-foreground">Generation failed</span>
            {error ? (
              <span className="line-clamp-3 text-xs text-muted-foreground/70">{error}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex w-4/5 max-w-xs flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <div className="w-full">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{status === "queued" ? "In queue" : "Rendering"}</span>
                <span>{isBusy ? `${Math.max(progress, 3)}%` : ""}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full gradient-bg transition-all duration-700"
                  style={{ width: `${Math.max(progress, 3)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={`pointer-events-none absolute z-10 h-3 w-3 border-gold/70 ${className}`} />;
}
