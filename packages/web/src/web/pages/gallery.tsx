import { useState } from "react";
import { Link } from "wouter";
import { Search, Heart, TrendingUp, Clock, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { useGallery, useToggleLike, type GalleryItem } from "../queries/gallery";
import { FramedMedia } from "../components/framed-media";
import { CATEGORIES } from "../lib/constants";

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"trending" | "recent">("trending");

  const listInput = { search: search || undefined, category, sort };
  const gallery = useGallery(listInput);
  const items = gallery.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold">
          <LayoutGrid className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Gallery</h1>
          <p className="text-sm text-muted-foreground">Discover what the community is making.</p>
        </div>
      </div>

      {/* controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search prompts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full rounded-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1">
          <SortBtn active={sort === "trending"} onClick={() => setSort("trending")} icon={TrendingUp}>
            Trending
          </SortBtn>
          <SortBtn active={sort === "recent"} onClick={() => setSort("recent")} icon={Clock}>
            Recent
          </SortBtn>
        </div>
      </div>

      {/* categories */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
              category === c.value
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <c.icon className="h-3.5 w-3.5" /> {c.label}
          </button>
        ))}
      </div>

      {gallery.isLoading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="mb-4 aspect-video animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-20 text-center text-muted-foreground">
          <LayoutGrid className="mx-auto mb-3 h-8 w-8 opacity-50" />
          No videos match your search yet.
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((g) => (
            <GalleryCard key={g.id} g={g} listInput={listInput} />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryCard({
  g,
  listInput,
}: {
  g: GalleryItem;
  listInput: { search?: string; category?: string; sort: "trending" | "recent" };
}) {
  const { isAuthenticated } = useAuth();
  const like = useToggleLike(listInput);

  return (
    <div className="mb-4 break-inside-avoid">
      <div className="group relative overflow-hidden rounded-xl">
        <Link to={`/v/${g.id}`}>
          <FramedMedia videoUrl={g.videoUrl} aspectRatio={g.aspectRatio} hoverPlay />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <p className="pointer-events-auto line-clamp-2 text-xs text-white/90">{g.prompt}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="truncate text-xs text-muted-foreground">by {g.creatorName ?? "Anonymous"}</span>
        <button
          onClick={() => {
            if (!isAuthenticated) return toast.error("Sign in to like videos");
            like.mutate({ id: g.id });
          }}
          className={`inline-flex items-center gap-1 text-xs transition ${
            g.liked ? "text-gold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${g.liked ? "fill-current" : ""}`} />
          <span className="tabular-nums">{g.likeCount}</span>
        </button>
      </div>
    </div>
  );
}

function SortBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof TrendingUp;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
        active ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}
