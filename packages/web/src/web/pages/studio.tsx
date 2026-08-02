import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useCustomer } from "autumn-js/react";
import { motion } from "motion/react";
import {
  Wand2,
  Type,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Upload,
  X,
  Gem,
  RotateCcw,
  Download,
  Share2,
  Dices,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import {
  useCreateGeneration,
  useEnhancePrompt,
  useGeneration,
  useGenerations,
  useRetryGeneration,
  useTogglePublic,
} from "../queries/generations";
import { uploadFile } from "../lib/upload";
import { FramedMedia } from "../components/framed-media";
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  DURATIONS,
  STYLE_PRESETS,
  CAMERA_MOTIONS,
  CATEGORIES,
  creditCost,
} from "../lib/constants";

export default function StudioPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isPending } = useAuth();
  const { data: customer } = useCustomer();

  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [duration, setDuration] = useState<number>(8);
  const [style, setStyle] = useState<string | null>(null);
  const [camera, setCamera] = useState<string | null>(null);
  const [category, setCategory] = useState("general");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useCreateGeneration();
  const enhance = useEnhancePrompt();
  const retry = useRetryGeneration();
  const togglePublic = useTogglePublic();
  const history = useGenerations(isAuthenticated);
  const active = useGeneration(activeId);

  useEffect(() => {
    if (!isPending && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, isPending, navigate]);

  const cost = creditCost(duration, resolution);
  const balance = customer?.balances?.credits?.remaining ?? 0;
  const canAfford = balance >= cost;

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    setUploading(true);
    setImagePreview(URL.createObjectURL(file));
    try {
      const key = await uploadFile(file);
      setImageKey(key);
    } catch {
      toast.error("Upload failed, try again");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function onEnhance() {
    if (!prompt.trim()) return toast.error("Write a rough idea first");
    try {
      const res = await enhance.mutateAsync({
        prompt,
        stylePreset: style ?? undefined,
        cameraMotion: camera ?? undefined,
      });
      setPrompt(res.prompt);
      toast.success("Prompt enhanced");
    } catch {
      toast.error("Could not enhance prompt");
    }
  }

  async function onGenerate() {
    if (!prompt.trim()) return toast.error("Describe your video first");
    if (mode === "image" && !imageKey) return toast.error("Upload an image for image-to-video");
    if (!canAfford) return toast.error("Not enough credits — upgrade your plan");
    try {
      const row = await create.mutateAsync({
        mode,
        prompt: buildPrompt(prompt, style, camera),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        durationSeconds: duration,
        resolution,
        stylePreset: style ?? undefined,
        cameraMotion: camera ?? undefined,
        sourceImageKey: mode === "image" ? imageKey ?? undefined : undefined,
        category,
      });
      setActiveId(row.id);
      toast.success("Generation started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start generation");
    }
  }

  const current = active.data ?? history.data?.find((g) => g.id === activeId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold">
          <Wand2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Studio</h1>
          <p className="text-sm text-muted-foreground">Direct your shot and render.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Controls */}
        <div className="space-y-5 rounded-2xl border border-border bg-card/50 p-5">
          {/* mode */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1">
            <ModeBtn active={mode === "text"} onClick={() => setMode("text")} icon={Type} label="Text to video" />
            <ModeBtn active={mode === "image"} onClick={() => setMode("image")} icon={ImageIcon} label="Image to video" />
          </div>

          {/* image upload */}
          {mode === "image" && (
            <div>
              <input
                ref={fileRef}
                aria-label="Upload source image"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <img src={imagePreview} alt="source" className="h-44 w-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 grid place-items-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-gold" />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setImageKey(null);
                      setImagePreview(null);
                    }}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background text-muted-foreground transition hover:border-gold/50 hover:text-foreground"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Upload a starting image</span>
                  <span className="text-xs opacity-70">PNG or JPG</span>
                </button>
              )}
            </div>
          )}

          {/* prompt */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Prompt</span>
              <button
                onClick={onEnhance}
                disabled={enhance.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold transition hover:bg-gold/15 disabled:opacity-60"
              >
                {enhance.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Enhance
              </button>
            </div>
            <textarea
              aria-label="Video prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="A lone astronaut walking across red desert dunes at golden hour, dust drifting in the wind, cinematic wide shot..."
              className="w-full resize-none rounded-xl border border-input bg-background p-3.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          {/* style presets */}
          <Group label="Style">
            {STYLE_PRESETS.map((s) => (
              <Chip
                key={s.value}
                active={style === s.value}
                onClick={() => setStyle(style === s.value ? null : s.value)}
                icon={s.icon}
              >
                {s.label}
              </Chip>
            ))}
          </Group>

          {/* camera */}
          <Group label="Camera motion">
            {CAMERA_MOTIONS.map((c) => (
              <Chip key={c.value} active={camera === c.value} onClick={() => setCamera(camera === c.value ? null : c.value)}>
                {c.label}
              </Chip>
            ))}
          </Group>

          {/* settings */}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Aspect ratio">
              {ASPECT_RATIOS.map((a) => (
                <Segment key={a.value} active={aspectRatio === a.value} onClick={() => setAspectRatio(a.value)}>
                  {a.label}
                </Segment>
              ))}
            </Select>
            <Select label="Resolution">
              {RESOLUTIONS.map((r) => (
                <Segment key={r.value} active={resolution === r.value} onClick={() => setResolution(r.value)}>
                  {r.value}
                </Segment>
              ))}
            </Select>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">Duration</span>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <Segment key={d} active={duration === d} onClick={() => setDuration(d)}>
                  {d}s
                </Segment>
              ))}
            </div>
          </div>

          {/* advanced */}
          <details className="group rounded-xl border border-border bg-background p-3">
            <summary className="cursor-pointer list-none text-sm text-muted-foreground transition hover:text-foreground">
              Advanced
            </summary>
            <div className="mt-3 space-y-3">
              <input
                aria-label="Negative prompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Negative prompt (what to avoid)"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-gold/50"
              />
              <div>
                <span className="mb-1.5 block text-xs text-muted-foreground">Gallery category</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {/* generate */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Gem className="h-4 w-4 text-gold" />
              <span className="font-semibold text-foreground tabular-nums">{cost}</span> credits
              <span className="opacity-60">· {balance} left</span>
            </div>
            <button
              onClick={onGenerate}
              disabled={create.isPending || uploading}
              className="inline-flex items-center gap-2 rounded-full gradient-bg px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(255,61,119,0.8)] transition hover:brightness-110 disabled:opacity-60"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate
            </button>
          </div>
          {!canAfford && (
            <p className="text-center text-xs text-destructive">
              Not enough credits.{" "}
              <button onClick={() => navigate("/pricing")} className="underline">
                Upgrade
              </button>
            </p>
          )}
        </div>

        {/* Preview + recents */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card/50 p-5">
            {current ? (
              <>
                <FramedMedia
                  videoUrl={current.videoUrl}
                  aspectRatio={current.aspectRatio}
                  status={current.status}
                  progress={current.progress}
                  error={current.error}
                />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {current.status === "completed" && current.videoUrl && (
                    <>
                      <a
                        href={current.videoUrl}
                        download
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-card-hover"
                      >
                        <Download className="h-4 w-4" /> Download
                      </a>
                      <button
                        onClick={() =>
                          togglePublic.mutate(
                            { id: current.id, category },
                            {
                              onSuccess: (r) =>
                                toast.success(r.isPublic ? "Published to gallery" : "Removed from gallery"),
                            },
                          )
                        }
                        disabled={togglePublic.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition disabled:opacity-60 ${
                          current.isPublic
                            ? "border border-gold/40 bg-gold/10 text-gold"
                            : "border border-border bg-background hover:bg-card-hover"
                        }`}
                      >
                        <Share2 className="h-4 w-4" /> {current.isPublic ? "Published" : "Publish"}
                      </button>
                    </>
                  )}
                  {current.status === "failed" && (
                    <button
                      onClick={() => retry.mutate({ id: current.id })}
                      disabled={retry.isPending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm transition hover:bg-card-hover disabled:opacity-60"
                    >
                      <RotateCcw className="h-4 w-4" /> Retry
                    </button>
                  )}
                </div>
                {current.prompt && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{current.prompt}</p>
                )}
              </>
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-border text-center">
                <div className="px-6 text-muted-foreground">
                  <Dices className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  <p className="text-sm">Your render will appear here.</p>
                </div>
              </div>
            )}
          </div>

          {/* recents */}
          {(history.data?.length ?? 0) > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Recent renders</h3>
                <button onClick={() => navigate("/history")} className="text-xs text-gold hover:brightness-110">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {history.data!.slice(0, 6).map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => setActiveId(g.id)}
                    whileHover={{ y: -2 }}
                    className={`overflow-hidden rounded-lg ${activeId === g.id ? "ring-2 ring-gold" : ""}`}
                  >
                    <FramedMedia
                      videoUrl={g.videoUrl}
                      aspectRatio={g.aspectRatio}
                      status={g.status}
                      progress={g.progress}
                      hoverPlay
                      rounded={false}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPrompt(prompt: string, style: string | null, camera: string | null): string {
  const extras = [style, camera].filter(Boolean).join(", ");
  return extras ? `${prompt.trim()} — ${extras}` : prompt.trim();
}

function ModeBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Type;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
        active ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof Type;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-gold/50 bg-gold/15 text-gold"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function Select({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border py-2 text-sm transition ${
        active
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
