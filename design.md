# Framewave — Design

Framewave is an AI video generation platform (web + mobile). Users generate cinematic clips from text or images using Google Veo, browse their history in an ornate "gallery of frames", explore a public community gallery, and manage credits/subscriptions. Visual direction: **dark, premium, gallery-of-art** — near-black canvas, bold oversized display type, generated videos presented like framed artworks with warm gold accents, punctuated by vivid gradient cards. Cinematic, confident, high-contrast.

## Brand & Colors

Dark-first product. The marketing + app UI is always dark; mobile also ships a dark palette.

- **Web & desktop**: CSS variables in `packages/web/src/web/styles.css`.
- **Mobile**: `Colors.light` / `Colors.dark` in `packages/mobile/constants/theme.ts` (both dark-leaning), read via `useColors()`.

| Token | Value | Use |
|-------|-------|-----|
| background | #08080A | Page background (near-black) |
| backgroundElevated | #0F0F13 | Sections, subtle bands |
| card | #141418 | Cards, surfaces |
| cardHover | #1B1B21 | Hovered surfaces |
| foreground | #F5F3EF | Primary text (warm off-white) |
| mutedForeground | #8A8A94 | Secondary text |
| border | #232329 | Hairlines |
| gold | #E7B45A | Signature accent — frames, highlights, primary CTA text-on-dark |
| goldSoft | #C9963F | Gold gradient stop / hover |
| accentFrom | #FF7A45 | Gradient start (warm) |
| accentVia | #FF3D77 | Gradient middle (magenta) |
| accentTo | #8B5CF6 | Gradient end (violet) |
| success | #34D399 | Ready / completed |
| destructive | #EF4444 | Delete / errors |

Signature gradient: `linear-gradient(120deg, #FF7A45, #FF3D77, #8B5CF6)`. Gold is used sparingly for frame borders, the wordmark, and key emphasis — not everywhere.

## Typography

- **Display**: "Clash Display" (bold/semibold) for hero + section headings — big, tight tracking. Self-hosted in `packages/web/public/fonts/`.
- **Body/UI**: "General Sans" for body, labels, buttons. Self-hosted.
- Fallbacks: system-ui, sans-serif. Hierarchy through size + weight; generous line-height (1.5 body). Headlines oversized (clamp up to ~5rem on hero).
- Mobile: system font, weights for hierarchy (custom fonts optional later).

## Signature Components

- **Framed media**: generated videos/thumbnails sit inside a thin gold-bordered frame with a soft inner shadow and small corner ornaments — makes outputs feel like exhibited art. Reusable `<FramedMedia />`.
- **Gradient cards**: feature/pricing highlight cards with the signature gradient border or fill.
- **Pill buttons**: fully rounded primary (gold fill, dark text) and ghost (bordered) buttons.
- **Studio controls**: segmented toggles (mode, aspect ratio), select chips (style/camera presets), sliders.

## Pages & Screens

Web (`packages/web/src/web/`):
- **Landing** (`pages/index.tsx`) — hero headline, framed showcase, model/provider strip, feature sections (alternating media/text), pricing, CTA, footer. Public.
- **Login/Signup** (`pages/login.tsx`) — single page, tabs; email/password + Google. Dark, branded.
- **Studio** (`pages/studio.tsx`) — protected. Generation console: prompt + negative prompt, mode toggle (text→video / image→video with drag-drop upload), aspect ratio / duration / resolution / style preset / camera motion / seed controls, enhance-prompt button, generate button with credit cost, live progress, result frame.
- **History** (`pages/history.tsx`) — protected. Grid of framed generations: play/preview, download, share, favorite, delete, copy prompt, publish-to-gallery toggle.
- **Gallery** (`pages/gallery.tsx`) — public community grid: search, category chips, trending sort, like button.
- **Pricing/Billing** (`pages/pricing.tsx`) — plans, current plan, credit balance, upgrade via Autumn checkout.
- **Video detail** (`pages/video.tsx`, `/v/:id`) — shareable public page for a single video.

Mobile (`packages/mobile/app/`):
- **(tabs)/index** — Studio (generate).
- **(tabs)/history** — user's generations.
- **(tabs)/gallery** — community gallery.
- **(tabs)/account** — plan, credits, sign in/out.
- **login** — auth screen.

## Key User Flows

1. **Generate**: open Studio → pick mode → write/enhance prompt → set controls → Generate (deducts credits) → live progress bar polls job → framed result appears → download/share/favorite/publish.
2. **Browse**: Gallery → filter by category / search / trending → like → open detail → "remix" prefills Studio prompt.
3. **Upgrade**: hit credit limit → Pricing → Autumn checkout → credits refill monthly.

## Motion

Framer Motion (motion/react). One orchestrated landing load: staggered hero reveal, framed items fade/scale in. Studio: progress bar shimmer, result frame reveal. Gallery: hover lift on frames. Keep it purposeful, not scattered.

## Architecture

- **API**: typed oRPC client (`lib/api.ts`) → backend in `@template/web`. Hooks in `queries/` (one file per feature) with TanStack Query + optimistic updates (likes, favorites).
- **Video generation**: server-side Veo (Gemini API) via a modular provider layer (`api/lib/video/`) so Runway/Luma/Kling can be added later. Jobs tracked in `generations` table with status polling; generated MP4s stored in Tigris, served via presigned URLs.
- **Auth**: Better Auth + Runable managed Google login + email/password.
- **Payments/credits**: Autumn (metered `credits` feature; free + paid plans).
