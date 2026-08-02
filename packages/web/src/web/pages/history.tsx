import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Clock,
  Heart,
  Trash2,
  Download,
  Share2,
  RotateCcw,
  Loader2,
  Wand2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import {
  useGenerations,
  useDeleteGeneration,
  useToggleFavorite,
  useTogglePublic,
  useRetryGeneration,
  type GenerationRow,
} from "../queries/generations";
import { FramedMedia } from "../components/framed-media";

type Tab = "all" | "favorites" | "published";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isPending } = useAuth();
  const history = useGenerations(isAuthenticated);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (!isPending && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, isPending, navigate]);

  const items = (history.data ?? []).filter((g) =>
    tab === "favorites" ? g.isFavorite : tab === "published" ? g.isPublic : true,
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Your renders</h1>
            <p className="text-sm text-muted-foreground">Everything you've created.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/studio")}
          className="inline-flex items-center gap-2 rounded-full gradient-bg px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          <Wand2 className="h-4 w-4" /> New render
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["all", "favorites", "published"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm capitalize transition ${
              tab === t ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {history.isLoading ? (
        <Grid>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-xl bg-card" />
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-20 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {tab === "all" ? "No renders yet." : `No ${tab} yet.`}
          </p>
          <button
            onClick={() => navigate("/studio")}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/15"
          >
            <Wand2 className="h-4 w-4" /> Create your first
          </button>
        </div>
      ) : (
        <Grid>
          {items.map((g) => (
            <HistoryCard key={g.id} g={g} />
          ))}
        </Grid>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

function HistoryCard({ g }: { g: GenerationRow }) {
  const fav = useToggleFavorite();
  const del = useDeleteGeneration();
  const pub = useTogglePublic();
  const retry = useRetryGeneration();

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card/50">
      <FramedMedia
        videoUrl={g.videoUrl}
        aspectRatio={g.aspectRatio}
        status={g.status}
        progress={g.progress}
        error={g.error}
        hoverPlay={g.status === "completed"}
        rounded={false}
      />
      <div className="p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{g.prompt}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
            {g.resolution} · {g.durationSeconds}s
          </span>
          <div className="flex items-center gap-1">
            {g.status === "completed" && g.videoUrl && (
              <>
                <IconBtn
                  active={g.isFavorite}
                  onClick={() => fav.mutate({ id: g.id })}
                  title="Favorite"
                >
                  <Heart className={`h-4 w-4 ${g.isFavorite ? "fill-current" : ""}`} />
                </IconBtn>
                <IconBtn
                  active={g.isPublic}
                  onClick={() =>
                    pub.mutate(
                      { id: g.id },
                      {
                        onSuccess: (r) =>
                          toast.success(r.isPublic ? "Published to gallery" : "Removed from gallery"),
                      },
                    )
                  }
                  title={g.isPublic ? "Published" : "Publish"}
                >
                  <Share2 className="h-4 w-4" />
                </IconBtn>
                <a
                  href={g.videoUrl}
                  download
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
              </>
            )}
            {g.status === "failed" && (
              <IconBtn onClick={() => retry.mutate({ id: g.id })} title="Retry">
                {retry.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </IconBtn>
            )}
            <IconBtn
              onClick={() => {
                if (confirm("Delete this render?")) del.mutate({ id: g.id });
              }}
              title="Delete"
              danger
            >
              {del.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/5 ${
        active ? "text-gold" : danger ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
