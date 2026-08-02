import { Link } from "wouter";
import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Gauge,
  Clapperboard,
  Play,
  Check,
} from "lucide-react";
import { useGallery } from "../queries/gallery";
import { FramedMedia } from "../components/framed-media";
import { useAuth } from "../hooks/use-auth";
import { PLAN_COPY, PLAN_ORDER } from "../lib/constants";

const MODELS = ["Veo 3", "Cinematic", "Photoreal", "Anime", "3D", "Claymation", "Cyberpunk", "Noir"];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function IndexPage() {
  const { isAuthenticated } = useAuth();
  const gallery = useGallery({ sort: "trending" });
  const showcase = (gallery.data ?? []).filter((g) => g.videoUrl).slice(0, 6);
  const start = isAuthenticated ? "/studio" : "/login";

  return (
    <div className="relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]">
        <div className="absolute left-1/2 top-[-160px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,61,119,0.20),transparent)] blur-2xl" />
        <div className="absolute left-[18%] top-[40px] h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(255,122,69,0.18),transparent)] blur-2xl" />
        <div className="absolute right-[16%] top-[10px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.20),transparent)] blur-2xl" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 text-center md:pt-28">
        <motion.div initial="hidden" animate="show" variants={fade} custom={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Google Veo 3
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fade}
          custom={1}
          className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.03] tracking-tight md:text-7xl"
        >
          Turn a sentence into
          <br />
          <span className="gradient-text">cinematic motion</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fade}
          custom={2}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Framewave generates studio-grade video from text or a single image. Direct the shot, pick a
          style, and render in seconds.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fade}
          custom={3}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to={start}
            className="group inline-flex items-center gap-2 rounded-full gradient-bg px-7 py-3.5 text-base font-medium text-white shadow-[0_12px_40px_-12px_rgba(255,61,119,0.8)] transition hover:brightness-110"
          >
            Start creating
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-7 py-3.5 text-base text-foreground transition hover:bg-card-hover"
          >
            <Play className="h-4 w-4 fill-current" /> Explore gallery
          </Link>
        </motion.div>

        {/* model strip */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fade}
          custom={4}
          className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2"
        >
          {MODELS.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border bg-card/50 px-3.5 py-1.5 text-xs text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Showcase gallery of frames */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">The gallery of frames</h2>
            <p className="mt-2 text-muted-foreground">Fresh renders from the Framewave community.</p>
          </div>
          <Link
            to="/gallery"
            className="hidden items-center gap-1.5 text-sm text-gold transition hover:brightness-110 md:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {gallery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : showcase.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {showcase.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.06, duration: 0.5 }}
              >
                <Link to={`/v/${g.id}`}>
                  <FramedMedia videoUrl={g.videoUrl} aspectRatio={g.aspectRatio} hoverPlay />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            <Clapperboard className="mx-auto mb-3 h-8 w-8 opacity-50" />
            No public videos yet — be the first to publish one.
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={Wand2}
            title="Text to video"
            body="Describe any scene. Our prompt enhancer turns rough ideas into directed, cinematic shots."
          />
          <Feature
            icon={ImageIcon}
            title="Image to video"
            body="Bring a still to life. Upload a frame and animate it with natural, controllable motion."
          />
          <Feature
            icon={Gauge}
            title="Fast & controllable"
            body="Pick aspect, resolution, duration, camera moves and style presets. Render in seconds."
          />
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Simple, credit-based pricing</h2>
          <p className="mt-2 text-muted-foreground">Start free. Upgrade when you need more firepower.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const copy = PLAN_COPY[id];
            const featured = id === "pro";
            return (
              <div
                key={id}
                className={`relative rounded-2xl border p-6 ${
                  featured ? "border-gold/50 bg-card glow-gold" : "border-border bg-card/50"
                }`}
              >
                {featured && (
                  <span className="absolute -top-2.5 left-6 rounded-full gradient-bg px-3 py-0.5 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold capitalize">{id}</h3>
                <p className="mt-1.5 min-h-[40px] text-sm text-muted-foreground">{copy.blurb}</p>
                <ul className="mt-4 space-y-2">
                  {copy.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-medium text-gold transition hover:bg-gold/15"
          >
            See full pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="art-frame grain overflow-hidden rounded-3xl px-8 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl text-4xl font-semibold md:text-5xl">
            Your next <span className="gold-text">masterpiece</span> is one prompt away
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join creators using Framewave to storyboard, prototype, and produce video at the speed of
            thought.
          </p>
          <Link
            to={start}
            className="mt-8 inline-flex items-center gap-2 rounded-full gradient-bg px-8 py-4 text-base font-medium text-white shadow-[0_12px_40px_-12px_rgba(255,61,119,0.8)] transition hover:brightness-110"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Wand2;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card/50 p-7 transition hover:bg-card-hover"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  );
}
