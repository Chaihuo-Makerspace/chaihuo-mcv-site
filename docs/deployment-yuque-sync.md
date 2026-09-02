# Yuque Journal Sync and Deployment Runbook

This document records the production update path for the travel journal page and the debugging notes from the 2026-06-03 incident.

## Expected Flow

For normal website updates, use this flow directly. Do not wait for or debug the
Cloudflare Workers/Pages GitHub check, because it is not the production deploy
path for `mcv.chaihuo.org`.

1. Yuque book updates at `https://www.yuque.com/mouseart/mcv`.
2. GitHub Actions workflow `Sync Yuque Journals` runs every 10 minutes or by manual dispatch.
3. The workflow runs `node scripts/sync-yuque-journals.mjs`.
4. If `src/data/yuque-journals.json` or `public/yuque-journals/*` changes, the workflow commits to `main` with a message describing what changed, e.g. `新增基地车日记《2026.07.30｜隰县→临汾》 · 基地车抵达临汾` (falls back to `同步基地车日记` when neither step has details, e.g. cover-only changes).
5. GitHub push webhook notifies Jenkins.
6. Jenkins job `chaihuo-chaihuo-mcv-site` builds and deploys the Docker service.
7. `https://mcv.chaihuo.org/journals` serves the new prerendered journal list.

## Current Automation

- GitHub workflow: `.github/workflows/sync-yuque-journals.yml`
- Sync script: `scripts/sync-yuque-journals.mjs`
- Route stop flipper: `scripts/update-route-stops-from-journals.mjs` (flips planned stops to `visited` + `event.date` on journal-confirmed arrival, and mirrors the province into `PROVINCE_VISITED` on first province entry)
- Sync helpers/tests: `scripts/lib/yuque-journal-sync.mjs`, `scripts/yuque-journal-sync.test.mjs`
- Jenkins webhook job: `chaihuo-chaihuo-mcv-site`
- GitHub webhook endpoint: Jenkins generic webhook trigger
- Docker deploy entrypoint in repo: `deploy.sh`

## Important Deployment Notes

- `Dockerfile` must pin pnpm instead of using `pnpm@latest`.
- Current Docker pnpm version is `11.5.0`.
- If `pnpm-workspace.yaml` changes `overrides`, regenerate `pnpm-lock.yaml` with the same pnpm version used by Docker:

```bash
corepack pnpm@11.5.0 install --lockfile-only --no-frozen-lockfile
corepack pnpm@11.5.0 install --frozen-lockfile --lockfile-only
```

- The production response currently comes from Tengine/CDN, not Cloudflare Workers.
- Cloudflare Workers checks in GitHub are not the source of truth for production deploys.
- A red Cloudflare Workers/Pages check on a GitHub commit can be ignored for
  this site unless the hosting path changes. The production update source of
  truth is the Jenkins job `chaihuo-chaihuo-mcv-site` triggered by the GitHub
  webhook.

## Debug Checklist

When a Yuque article does not appear on the site:

1. Confirm Yuque sync data includes the article:

```bash
rg "article-title-or-slug" src/data/yuque-journals.json
```

2. Confirm local build includes the article:

```bash
pnpm run build
rg "article-title-or-slug" dist/client/journals/index.html
```

3. Confirm GitHub Actions ran:

```bash
gh workflow list --all
gh run list --limit 10
gh run view <run-id> --json status,conclusion,jobs,url
```

4. Confirm GitHub webhook reached Jenkins:

```bash
gh api repos/Chaihuo-Makerspace/chaihuo-mcv-site/hooks
gh api repos/Chaihuo-Makerspace/chaihuo-mcv-site/hooks/<hook-id>/deliveries --paginate
```

The webhook response payload includes the Jenkins queue item, for example `queue/item/619/`.

5. Confirm production has updated:

```bash
curl -I https://mcv.chaihuo.org/journals
curl -L https://mcv.chaihuo.org/journals -o /tmp/mcv-journals.html
rg "article-title-or-slug" /tmp/mcv-journals.html
```

If GitHub Actions and webhook delivery are successful but production is stale, inspect the Jenkins console log for `chaihuo-chaihuo-mcv-site`.

## City Inference

How synced journals get attached to route stops
(`scripts/lib/yuque-journal-sync.mjs` `inferCityId`):

1. **Alias table first.** The hand-maintained `CITY_KEYWORDS` table is checked
   for aliases only — small places/transit points fold into route stops
   (定边→榆林, 肃南→张掖, 四川科技馆/绵阳/宜宾→成都, 赫章→毕节,
   格凸河→贵阳, 七百弄/三都→柳州, 浩坤湖/广西科技馆→南宁, etc.).
2. **Auto-derived stop names.** Stop primary names are auto-derived from
   `src/content/stops/*.md` frontmatter `label`s by `loadStopCityKeywords()`
   (sorted by `order` desc, so new stops need zero keyword maintenance; e.g.
   隰县→临汾 via the auto-derived 临汾 label).

Keyword order is priority (later stops first) so "A→B" transit titles attach
to the destination. Titles matching neither source get two more chances in
`sync-yuque-journals.mjs` `inferCityFromDocBody()`:

1. Re-run `inferCityId` over the doc's opening dateline
   ("2026.08.01 | 晴 | 临汾→洪洞→太原 | …"), which names the cities even when
   the title is poetic (e.g. 《双车并进北上路…》 → taiyuan).
2. If keywords still miss, geocode the route-chain tokens from the dateline
   AND the title (`extractRouteTokens()`, destination first, then earlier
   transit points) via Photon (`photon.komoot.io`, free OSM geocoder — the
   Nominatim public instance is DNS-poisoned on the maintainer's CN network,
   Photon works both locally and in CI) and fold each into the nearest stop
   within 100 km (`nearestStop()`, coords from stop frontmatter via
   `loadStopCoordinates()`); same-name ambiguity is resolved by picking the
   candidate closest to any route stop.
3. Last resort: date-based folding (`stopIdAtDate()` over `loadStopTimeline()`
   — visited stops' frontmatter `event.date`, latest stop not later than the
   journal date). For journals whose **title carries no date** (recaps like
   《48天·8000公里·9省：答案在路上》, where the body mentions a whole chain of
   cities and keyword matching misfires) this runs *first*, straight off the
   publish-date fallback; for dated poetic titles it runs after the body and
   geocode layers.

## Journal Dates

A journal card's `date` comes from the title first
(`parseJournalDate()` — accepts both padded `2026.08.17`/`2026.0817` and
unpadded `2026.8.17`). When the title carries no date, the sync falls back to
the doc's Yuque `first_published_at` (more stable than `published_at`, which
refreshes on republish), converted to the Beijing calendar date
(`dateOnlyInShanghai()`). Cards without any date are dropped by
`src/lib/journals.ts` and never reach `/journals` — which is why unpadded
titles previously made journals silently disappear.

Geocode results are cached in `src/data/geocode-cache.json` (committed by the
sync workflow — the script materializes the file even when the cache is empty,
so CI's `file_pattern` never hits a missing pathspec) so runs are
deterministic and the API is not re-hit.

Journals that still fall back to `city: "yuque"` are hidden from the route
panel and are logged loudly plus surfaced as "N 篇日记未匹配到站点" in the CI
commit message. All synced journals currently map to real stops.

## Locked journal cities

`city` on a journal card is what the route map, story river, and arrival
flipper read. The sync must not silently re-home a card after a human has
placed it.

1. **Override file (human source):** `src/data/journal-city-overrides.json`,
   keyed by Yuque slug → `{ city, note }` or a stop-id string. Applied last,
   every run. Never hand-edit `yuque-journals.json` to pin a city — the next
   sync would have overwritten it before this lock existed, and the override
   file is what `pnpm check` validates.
2. **Sticky previous city:** if a slug already has a real stop id (not
   `yuque`) and no override, keep that city even when the title or keyword
   table would now infer something else. Unmatched `yuque` cards are *not*
   sticky, so a later stop/keyword can still catch them.
3. Title, date, cover, and `updatedAt` still refresh from Yuque as usual.

`validate-site.mjs` checks override cities against stop ids, slugs against
`yuque-journals.json`, and that the generated `city` matches the override.

## 2026-08-03 Sync Pipeline Hardening

- CI had been failing at the git-auto-commit step since #33:
  `src/data/geocode-cache.json` was in `file_pattern` but never existed in a
  fresh checkout (the script only wrote it when geocoding actually ran), so
  `git add` died on the missing pathspec and every scheduled run's synced
  journals were never committed. `writeCacheIfChanged` now materializes the
  file even when the cache is empty, so each run commits and triggers the
  Jenkins deploy.
- City inference gained the dateline+title token geocoding described above
  (previously only the dateline's last token was geocoded).

## 2026-06-03 Incident Summary

Symptoms:

- Latest Yuque article `基地车日记｜2026.05.17｜四川科技馆` did not appear on `/journals`.
- Production HTML still had old `Last-Modified` and did not contain slug `tyfswi0moe2b5r5i`.
- Jenkins Docker build failed at `pnpm install --frozen-lockfile`.

Root causes:

- GitHub Actions had been disabled at the repository level, so the Yuque sync workflow stayed queued and did not run.
- Docker used `pnpm@latest`; Jenkins picked up pnpm 11.5.0, which detected that `pnpm-lock.yaml` did not include the workspace `overrides` config.
- The frozen install failed with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.

Fixes:

- Enabled GitHub Actions for the repository.
- Triggered `Sync Yuque Journals`; it successfully committed the latest Yuque data.
- Sorted Yuque journal cards by recency in `normalizeYuqueToc`.
- Regenerated `pnpm-lock.yaml` with pnpm 11.5.0 so `overrides: vite: ^7` is recorded.
- Pinned Docker to `pnpm@11.5.0`.

Verification:

- `corepack pnpm@11.5.0 install --frozen-lockfile --lockfile-only` passed.
- `pnpm run build` passed.
- Jenkins webhook triggered queue item `619`.
- Production `/journals` changed `Content-Length` from `82306` to `83692` and `Last-Modified` to `2026-06-03 09:50:22 UTC`.
- Production HTML contained the latest Yuque article.
