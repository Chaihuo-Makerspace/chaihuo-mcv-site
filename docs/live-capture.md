# Live Capture and Live Pages

The `/live` feature: an onboard EZVIZ camera on the vehicle, a capture sidecar
service, a public live page, and a members-only admin backend.

## Capture service

A second compose service `capture` runs `scripts/live-capture-loop.mjs` from
the same image (via `scripts/lib/live-capture.mjs`):

- Every `LIVE_INTERVAL_MINUTES` (default 3) it checks the EZVIZ vehicle camera
  and captures one JPEG while the vehicle is online, writing `latest.jpg` /
  `latest.json` / `archive/` into `./data/live` (bind-mounted into both
  containers; web mounts it writable — it manages `featured/`).
- Offline is normal — the round is skipped quietly.
- Archive is pruned after `LIVE_KEEP_DAYS` (default 30).
- The token is cached in `data/live/.token.json` (7-day validity, refreshed
  with <1 day left). The cache is keyed by `appKey`: rotating credentials
  invalidates it automatically (a stale token would otherwise keep querying
  the old account's device list, where the camera reads "offline").
- The camera (`BG9251347` "基地车view") is mounted upright — no rotation
  needed; frames are stored as-is.
- On each capture the service also computes a dHash perceptual hash
  (`scripts/lib/live-similar.mjs`, threshold `LIVE_SIMILAR_THRESHOLD` default
  15, compared against the group's anchor frame to avoid chain drift) and
  groups near-identical consecutive frames into `archive-index.json`
  (backfilled at startup — manual one-shot without EZVIZ creds:
  `node scripts/backfill-live-index.mjs` — pruned in sync with the archive).
- It writes `intervalMinutes`/`keepDays` into `latest.json` for copy
  interpolation, and prunes `featured/trash/` files older than
  `LIVE_KEEP_DAYS`.

`capture` reads credentials from compose `environment:` expansion
(`${VAR:-}` — supply them via the server shell env or a gitignored project
`.env` file; with no credentials the capture container logs once and stays
parked, so deploys never fail on a missing env file):

```
EZVIZ_APP_KEY=…
EZVIZ_APP_SECRET=…
EZVIZ_DEVICE_SERIAL=…
# optional: LIVE_INTERVAL_MINUTES=3, LIVE_KEEP_DAYS=30, LIVE_SIMILAR_THRESHOLD=15
```

Manual one-shot: `docker compose exec capture node scripts/live-capture-loop.mjs --once`.

The web side (`src/pages/live.astro` + endpoints under `src/pages/live/` +
`src/lib/live.ts`) only reads `LIVE_DATA_DIR` (default `./data/live`) and never
sees the EZVIZ credentials.

## Pages

- `/live` is a public, in-nav, indexed page (zh/en) with two blocks only — the
  live frame (dark "monitor" container, static status dot; the page's single
  looping-animation budget goes to the carousel) and the 「一路上」 featured
  carousel (auto-play, dates in mono, hidden entirely when empty). No downloads
  and no archive browsing on the public page.
- `/live/admin` (zh-only, noindex) is the members' backend behind a shared
  password: env `LIVE_ADMIN_PASSWORD` on the web service (unset → admin shows
  "未启用"), HMAC-signed HttpOnly cookie session (7 days, derived from the
  password so rotating it kills all sessions), login rate-limited per IP. It
  offers the Google-Photos-style archive browser (left rail:
  历史抓拍/已入选/回收站 tabs + date filter + 折叠相似 toggle on the dHash
  groups; lightbox with in-group filmstrip), 精选 toggle
  (`POST /api/live/featured/toggle`, copies archive→`featured/` + 1280px WebP;
  un-feature moves to `featured/trash/`, restorable for 30 days), and original
  downloads (`/live/admin/file/<name>`). All `/live/archive/*` endpoints
  require the same session cookie.

Design spec: `docs/superpowers/specs/2026-08-04-live-redesign-design.md`.

## Timing note

The EZVIZ capture round-trip (cloud wakes device → snapshot → OSS upload)
takes 2–6s and the API returns only `picUrl`, so `capturedAt` is recorded when
the capture request is *sent* (closest available point to the real shot). The
page labels it 更新于/Updated — the burned-in OSD timestamp on the frame
itself remains the precise capture time.
