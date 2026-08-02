import { Link, useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Download, Loader2, Wand2, Gem } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useGalleryItem } from "../queries/gallery";
import { useAuth } from "../hooks/use-auth";
import { FramedMedia } from "../components/framed-media";

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const item = useGalleryItem(id);
  const qc = useQueryClient();
  const detailKey = orpc.gallery.get.queryOptions({ input: { id } }).queryKey;

  const like = useMutation(
    orpc.gallery.toggleLike.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: detailKey }),
    }),
  );

  if (item.isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold" />
      </div>
    );
  }

  if (item.isError || !item.data) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold">Video not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or made private.</p>
        <Link
          to="/gallery"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-medium text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to gallery
        </Link>
      </div>
    );
  }

  const g = item.data;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link
        to="/gallery"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Gallery
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="mx-auto w-full max-w-2xl">
          <FramedMedia videoUrl={g.videoUrl} aspectRatio={g.aspectRatio} />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/20 text-sm font-semibold text-gold">
              {(g.creatorName ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium">{g.creatorName ?? "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(g.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <h1 className="mt-5 text-lg font-semibold leading-snug">{g.prompt}</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {[g.stylePreset, g.cameraMotion, g.resolution, `${g.durationSeconds}s`, g.aspectRatio]
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t as string}
                  className="rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => {
                if (!isAuthenticated) return toast.error("Sign in to like videos");
                like.mutate({ id: g.id });
              }}
              disabled={like.isPending}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition disabled:opacity-60 ${
                g.liked ? "border-gold/40 bg-gold/10 text-gold" : "border-border bg-card hover:bg-card-hover"
              }`}
            >
              <Heart className={`h-4 w-4 ${g.liked ? "fill-current" : ""}`} />
              <span className="tabular-nums">{g.likeCount}</span>
            </button>
            {g.videoUrl && (
              <a
                href={g.videoUrl}
                download
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm transition hover:bg-card-hover"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <div className="flex items-center gap-2 text-gold">
              <Gem className="h-4 w-4" />
              <span className="text-sm font-medium">Make your own</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Turn any idea into cinematic video with Framewave.
            </p>
            <button
              onClick={() => navigate(isAuthenticated ? "/studio" : "/login")}
              className="mt-4 inline-flex items-center gap-2 rounded-full gradient-bg px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              <Wand2 className="h-4 w-4" /> Open Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
