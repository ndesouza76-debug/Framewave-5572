# Framewave build

## Decisions
- Managed stack (Bun/Vite/React/Hono/Drizzle/Expo). Not Next/Supabase/Stripe.
- Auth: Better Auth + Runable managed Google + email/password. DONE
- Payments/credits: Autumn. Plans free/starter/pro/studio pushed. DONE
- Video: Google Veo via @google/genai, GEMINI_API_KEY. Modular provider layer.
- Storage: Tigris (S3). credit cost: 720p=2/s, 1080p=3/s.

## Progress
- [x] app_init, deps, design.md
- [x] backend: auth, schema, middleware, autumn, s3, video/veo, credits, routes (upload/ai/generations/gallery), index mount
- [x] web infra: auth client, api bearer, main handleRedirect, provider (Autumn+Toaster), constants, queries, styles, fonts
- [x] components: logo, framed-media, navbar
- [x] web pages: index (landing), login, studio, history, gallery, video detail, pricing
- [x] app.tsx routes + navbar layout
- [ ] web build + typecheck + lint  <-- ACTIVE
- [ ] mobile: auth, tabs (studio/history/gallery/account), login
- [ ] deliver web + mobile

## Notes
- Veo model: veo-3.0-fast-generate-001
- Generation runs async background; client polls generations.get
- creditCost client mirror is positional (dur, res); server is object form — same numbers.
- customer.balances.credits.remaining for credit balance display.

## SESSION UPDATE (resume)
- Lint: CLEAN (fixed a11y issues in studio/gallery/login/framed-media + mobile ErrorBoundary re-export already existed).
- Web + desktop build: PASS.
- NOW: building mobile app (auth managed+email/pw, theme rebrand, tabs studio/history/gallery/account, queries, login).

## SESSION UPDATE (final verification)
- Fixed: autumn check response shape (`check.allowed`, not `check.data.allowed`).
- Fixed: @aws-sdk/s3-request-presigner pinned to 3.1023.0 to match client-s3 (smithy type clash).
- Fixed: Veo model default -> veo-3.1-fast-generate-preview (3.0-fast 404s on this key); durationSeconds now passed to Veo config.
- Added: humanError() mapping for provider errors; error surfaced in web FramedMedia + mobile studio preview.
- Verified: web+mobile typecheck clean, root lint clean, root build pass, expo export (ios) bundles 4.24MB OK.
- Verified live: signup, session, autumn customer auto-create (free 30 credits), gallery.list, generations.create/get/retry/toggleFavorite/delete, ai.enhancePrompt, upload.presign + real PUT to Tigris (200).
- BLOCKER (external): Veo returns 429 RESOURCE_EXHAUSTED — GEMINI_API_KEY has no Veo quota (needs paid tier). Pipeline verified up to provider call.
