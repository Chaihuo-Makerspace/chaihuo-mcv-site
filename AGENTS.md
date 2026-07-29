# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

柴火基地车官网 (Chaihuo MCV Site) — a bilingual (zh/en) marketing website for Chaihuo's mobile AI laboratory vehicle "普罗米修斯号". Astro SSR site with route map, journals, and Content Collections for structured data.

## Commands

- `pnpm dev` — start Astro dev server
- `pnpm check` — run content/reference validation and Astro type diagnostics
- `pnpm smoke` — run browser route smoke tests against production preview
- `pnpm audit:ui` — run lightweight UI/accessibility semantics audit
- `pnpm visual` — capture desktop/mobile screenshots and verify visual substance, overflow, and runtime errors
- `pnpm harness` — run `pnpm check` and the full Playwright harness
- `pnpm build` — run checks, then production build (Node standalone)
- `pnpm build:astro` — raw Astro build without the pre-build check wrapper
- `pnpm preview` — preview production build locally
- `pnpm start` — run production server (`node ./dist/server/entry.mjs`)
- `./deploy.sh` — Docker build + deploy (one command)

**pnpm only.** Do not use `npm` or `yarn`. `.npmrc` sets `legacy-peer-deps=true` for React 19 compatibility.

No unit test framework or linter is configured. Use `pnpm check` as the main non-browser issue-discovery command, and `pnpm harness` when a change affects rendered behavior.

## Architecture

**Stack:** Astro 7 + React 19 (Islands) + TypeScript + Tailwind CSS 4 + shadcn/ui (Radix) + Framer Motion

**Deployment:** Node.js standalone via `@astrojs/node` adapter. Docker (`Dockerfile` + `docker-compose.yml`). GitHub push triggers Jenkins deploy through repository webhook job `chaihuo-chaihuo-mcv-site`.

**Routing:** Astro file-based routing in `src/pages/`. Chinese is default (no prefix), English under `/en/`:
- `/` `/en/` → Home (hero carousel, video modal, China route map SVG, mobile lab cards)
- `/journals` `/en/journals` → Journals (city journal list, filters, detail pages)
- `/route` `/en/route` → Route (interactive China map, city panels, linked journals)
- `/deconstruct` `/en/deconstruct` → Deconstruct (modification logs, equipment list)
- `/guide` `/en/guide` → Guide (participation guide, FAQ accordion, team)
- `/about` `/en/about` → About (Chaihuo history timeline, GSAP scroll-driven)

**React Islands pattern:** Each Astro page renders a `*Content.tsx` React component with `client:load` or `client:visible`. Data is fetched in `.astro` frontmatter (via `getCollection()` or JSON import), localized, then passed as props.

**Path alias:** `@` maps to `src/` (in `astro.config.mjs`)

## i18n System

**Config:** `astro.config.mjs` has `i18n: { defaultLocale: 'zh', locales: ['zh', 'en'], routing: { prefixDefaultLocale: false } }`

**Translation dictionaries:** `src/i18n/` — one file per page + shared UI:
- `index.ts` — `Locale` type, `getLangFromUrl()`, `t()`, `localize()`, `localePath()`, `getAlternateUrl()`
- `ui.ts` — nav, footer, site-wide strings
- `home.ts`, `journals.ts`, `route.ts`, `deconstruct.ts`, `guide.ts`, `about.ts` — page-specific strings

Each dict exports `Record<Locale, Record<string, string>>`. Astro pages select the dict by locale and pass it as `t` prop to React Islands.

**JSON data bilingualization:** JSON files in `src/data/` use `_en` suffix fields (`title_en`, `name_en`, `bio_en`, etc.). Use `localize(obj, ['field1', 'field2'], locale)` from `src/i18n/index.ts` to pick the right field before passing to React.

**English routes:** `src/pages/en/` mirrors the Chinese pages. Each English page is self-contained (not a thin wrapper) — it imports dicts, localizes data, and renders with the same React Islands.

**To add a new translatable string:**
1. Add zh/en entries to the relevant `src/i18n/*.ts` dict
2. Reference via `t['key.name']` in the React component

**To add a new `_en` field to JSON data:**
1. Add the field to the JSON file
2. Add the optional field to the schema in `src/content.config.ts`
3. Use `localize()` in the `.astro` page frontmatter

## Content Layer

- `src/content.config.ts` — Collection schemas (Zod). Collections: `notes`, `journals`, `equipment`, `team`, `faq`, `partners`, `heroes`
- `src/content/notes/*.md` — 改装手记 (modification logs)
- `src/content/journals/*.md` — 旅途日记 (travel journals)
- `src/data/*.json` — Structured data: equipment, team, faq, partners, heroes, timeline

Schema validation runs at build time — type errors will fail the build.

`scripts/validate-site.mjs` runs before build through `pnpm check` and validates cross-file references that Astro schemas cannot see: i18n key parity, zh/en page mirrors, route city IDs, team IDs, equipment IDs, public image paths, journal references, and boarding handoffs.

`playwright.config.ts` and `tests/harness/` provide AI self-iteration browser checks:
- `smoke.spec.ts` verifies core zh/en routes, published journal detail routes, and legacy documentation redirects.
- `ui-audit.spec.ts` verifies document language, landmarks, visible h1, image alt text, interactive accessible names, and link-name consistency.
- `visual.spec.ts` captures screenshots, checks text/layout substance, mobile/desktop overflow, runtime errors, and verifies the deconstruct page does not render the removed vehicle canvas.

See `docs/ai-iteration.md` for the recommended AI change loop.

**Content Collections (Astro 7):** Config file must be at `src/content.config.ts` (NOT `src/content/config.ts`). Import `z` from `astro/zod`, loaders from `astro/loaders`.

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config` file**; all config in CSS via `@theme inline` in `theme.css`
- Design tokens as CSS custom properties in `theme.css` (`:root` light, `.dark` dark mode)
- `@theme inline { ... }` maps CSS vars to Tailwind tokens (`--color-*`, `--radius-*`)
- Animation: `tw-animate-css` (CSS) + `motion` (Framer Motion JS)
- **Color system**: Brand `brand` (#f3d230) as a small-area accent only (deep variant `brand-dark` for emphasis text/completed route), surfaces `surface`/`surface-card`/`surface-dark`, full neutral ramp `neutral-950`~`neutral-50` (all defined in `theme.css`; undefined shades silently do nothing)
- **Use `text-brand`, `bg-surface`, `text-neutral-700` etc. — avoid hardcoded hex or Tailwind gray-xxx**

## Design System

设计规则分三档,详见 `docs/DESIGN.md`,可视化对照页 `/elements`(中)/ `/en/elements`(英)。**开发任何功能(尤其全新功能)前先对照这三档:**

- **🔒 不可破(Invariants):** 颜色/字号/圆角/间距令牌(源:`src/styles/theme.css`)、探险黄只做小面积强调(60-30-10 已废弃)、全页循环动画 ≤1 个、占位内容不外露、`prefers-reduced-motion` 与对比度无障碍底线、中英对等。永远用 `text-brand`/`bg-surface` 等令牌,不硬编码 hex、不用 gray-xxx;中性色只用 `theme.css` 已定义的档位(不存在的档位静默不生效)。
- **🧭 要领会延续(Principles):** 黄是点睛不是底色、视觉焦点即叙事(当前位置一眼可得)、地图/数据可视化用暖纸底+明度阶梯(不做冷灰也不做同饱和度黄褐)、高级克制动效、中文优先英文对等、内容即主体结构扁平。给全新功能(如地图类)用——结构可不同,气质要一致。
- **🎨 自由发挥(Open):** 已有模式(卡片/手风琴/时间线/轮播/地图 feature)仅作参考,`DESIGN.md` 附真实反例清单(黄土地图/HUD 套娃/占位符外露等),新功能可大胆偏离,只要守住前两档、不踩反例。

新功能开发流程:先列本次涉及的 🔒 令牌确保零硬编码 → 想清楚如何延续 🧭 → 复用或自由设计 🎨。

## Gotchas

**CJS interop:** `react-slick` is CJS. Required workaround in `HomeContent.tsx`:
```typescript
import ReactSlick from 'react-slick';
const Slider = ('default' in ReactSlick ? (ReactSlick as any).default : ReactSlick) as typeof ReactSlick;
```

**Astro image imports in React Islands:** `import img from '@/assets/foo.png'` returns `{ src, width, height }` in Astro (not a string). In React components, extract `.src`:
```typescript
import logoImport from '@/assets/logo.png';
const logo = typeof logoImport === 'object' && logoImport !== null && 'src' in logoImport
  ? (logoImport as { src: string }).src : logoImport as string;
```

**Astro 7 behavior changes (from the v6 → v7 upgrade):**
- `compressHTML` now defaults to `'jsx'`: whitespace between inline elements is stripped by JSX rules, so `<span>a</span>\n<em>b</em>` renders as `ab`. If a space goes missing between inline elements, add an explicit `{' '}` (or set `compressHTML: true` in `astro.config.mjs` to restore the v6 behavior).
- The Rust compiler is the only compiler and is strict: unclosed non-void tags are build errors, and invalid HTML nesting (e.g. `<div>` inside `<p>`) is passed through as-is instead of being auto-corrected — check the rendered output when editing templates.

**Astro 7 whitespace:** Astro 7 defaults to `compressHTML: 'jsx'`, which strips whitespace between inline elements using JSX rules (e.g. `<span>a</span>\n<em>b</em>` renders as `ab`, not `a b`). If spaces go missing between inline elements, add an explicit `{" "}` between them. Only set `compressHTML: true` in `astro.config.mjs` if the old HTML-aware behavior is needed globally. The Rust compiler is also strict about unclosed tags — build errors pointing at unexpected tokens usually mean a missing closing tag.

**改装手记 "查看全部":** Links to external Yuque page: `https://www.yuque.com/chaihuo-mcv/home`.

**Yuque journal sync:** `Sync Yuque Journals` GitHub Actions workflow syncs visible, publicly accessible Yuque `DOC` entries from `https://www.yuque.com/mouseart/mcv` once per day and via manual dispatch. It commits `src/data/yuque-journals.json` and `public/yuque-journals/*` changes back to `main`, which then triggers Jenkins deploy. DOC entries that appear in the Yuque TOC but return 401/403 are skipped until public access is restored.

**Production deployment debugging:** Production is served through Tengine/CDN and Jenkins, not Cloudflare Workers. For normal updates, ignore GitHub's Cloudflare Workers/Pages check; it is an unrelated external status check and is not the source of truth for `mcv.chaihuo.org`. If production is stale, check GitHub webhook deliveries for the Jenkins queue item, then inspect Jenkins job `chaihuo-chaihuo-mcv-site`. See `docs/deployment-yuque-sync.md`.

**Docker pnpm version:** Docker pins `pnpm@11.5.0`. Do not use `pnpm@latest` in Docker because pnpm lockfile validation can change across versions. If `pnpm-workspace.yaml` overrides change, regenerate and verify the lockfile with `corepack pnpm@11.5.0 install --lockfile-only --no-frozen-lockfile` and `corepack pnpm@11.5.0 install --frozen-lockfile --lockfile-only`.

## Conventions

- Content is in Simplified Chinese with English translations via i18n system
- Each Astro page wraps a React Island `*Content.tsx` component
- React components accept `locale` and `t` (dictionary) props for i18n
- Icons: Lucide React SVGs only — no emoji icons in UI
- Interactive elements must have `cursor-pointer` and `transition-colors duration-200`
- Navigation and Footer receive `locale` prop; internal links use `localePath()` helper
- `src/app/components/ui/` — shadcn/ui components — **do not modify manually**

## Current Status

### Active Branches

- None

### Completed Features

- Home hero carousel has three background slides, including the snow mountain MCV image.
- Yuque journal sync includes the latest public DOC entries, runs every 10 minutes or by manual dispatch without dependency install, and skips inaccessible 401/403 docs.
- Production deployment runbook documents the Yuque sync, Jenkins webhook, and pnpm lockfile debugging path.
- Route map now extends through Lhasa, Golmud, Mangya, Ruoqiang, Korla, Aksu, and Shihezi, with completed route segments shown as solid lines and map pan/zoom gestures enabled.
- Route map now extends from Karamay to Urumqi, with Urumqi highlighted as the latest visited stop.
- Tracker Allen location updates can be checked through `pnpm update:city`; enabling hourly GitHub Actions requires a GitHub credential with `workflow` scope.
- Route map now extends from Urumqi to Hami, with Hami highlighted as the latest visited stop.
- Home "people on the road" timeline shows a province legs band (built from stops via `route-legs.ts`) with the current leg highlighted down through the lanes, role labels in a fixed bilingual gutter, and full-span lane rails.
- Route page redesigned: neutral functional map coloring (brand-dark completed route, brand-light visited provinces), latest-stop pulse as the single focus animation, flat telemetry facts replacing the HUD panel, placeholder stop content scrubbed at load, mobile map framing fixed, and home `RoutePreview` palette synced. Route pages hydrate on `client:idle` and start the maplibre chunk fetch at module scope for faster first paint.
- `docs/DESIGN.md` rewritten after the route redesign pilot: 60-30-10 retired, yellow-as-accent codified, full neutral ramp documented, anti-pattern list added.
- Route extended beyond Xi'an with the confirmed planned leg 临汾 → 太原 → 呼和浩特 → 北京 → 赤峰 (orders 38–42, all `visited: false`); copy updated to 24 省 42 城; `PROVINCE_SHORT` gained 晋/蒙/京; location aliases added.
- The 2026 Year-of-the-Horse motif is the designer's original horse path (`horseRouteD`), inverted and uniformly scaled into `HORSE_TARGET` (80–128°E, 22–50°N — the same fit as the long-running production version, reaching 江浙沪 in the east and 深圳 in the south); out-of-border points are pulled inward individually. Rendered as a background watermark: faint brand fill (0.12) + dashed brand outline with a paper casing, and explained by a map legend (已走过 / 计划段 / 马年愿景线).
- Route CityPanel now links real journals: `getRouteJournals()` (`src/lib/journals.ts`) merges local md journals with `yuque-journals.json` (deduped by city+date, local wins; titles stripped of the "基地车日记｜日期｜" prefix), so recently visited stops (Hami→Xi'an) show real events with cover thumbnails and external Yuque links. Auto-generated filler sentences ("…路线图记录该城市节点") are scrubbed at load, and the elevation profile's vertical scale is computed from data (was hardcoded 1510m, clipping 4000m+ stops). The old "地学事实" right column (big altitude number, climate/terrain prose) was removed: altitude + terrain step live in the profile header, and only the field "challenge" survives — promoted to a one-line brand-ruled quote in the main column.
- Yuque journal city inference (`scripts/lib/yuque-journal-sync.mjs` `CITY_KEYWORDS`) is a stop-level merge table: small places/transit points fold into route stops (定边→榆林, 肃南→张掖, 四川科技馆/绵阳/宜宾→成都, 赫章→毕节, 格凸河→贵阳, 七百弄/三都→柳州, 浩坤湖/广西科技馆→南宁, etc.). Keyword order is priority (later stops first) so "A→B" transit titles attach to the destination; unknown titles still fall back to `city: "yuque"` and are hidden from the route panel. All 50 synced journals currently map to real stops.

## Changelog

| Date | Branch | Description |
| --- | --- | --- |
| 2026-07-28 | main | Wired Yuque journals into the route CityPanel (getRouteJournals merge + covers + external links), scrubbed auto-generated filler stop sentences, fixed the elevation profile scale (dynamic maxAlt instead of hardcoded 1510m), and decluttered the panel: removed the 地学事实 column (altitude/terrain-step folded into the profile header, climate/terrain prose dropped), keeping only the field challenge as a one-line quote. |
| 2026-07-28 | main | Rewrote Yuque city inference as a stop-level merge table (CITY_KEYWORDS): all 50 synced journals now map to real route stops (small places fold into nearest leg stops, transit "A→B" titles attach to the destination), so every visited city's panel shows its real field journals. |
| 2026-07-28 | main | Added the confirmed planned leg Xi'an→Linfen→Taiyuan→Hohhot→Beijing→Chifeng (24 省 42 城, Beijing connects directly to Chifeng), and reworked the horse motif: designer's original horse with the production HORSE_TARGET fit (reaches 江浙沪 and 深圳), outline-only rendering (fill removed — it read as a blob) + casing + legend; zoom control moved clear of the CityPanel. |
| 2026-07-28 | main | Redesigned /route (functional map colors, flat CityPanel, placeholder scrubbing, mobile fitPadding fix, single focus animation), synced RoutePreview palette, fixed route perf (client:idle + module-scope maplibre import + desktop drawer skip), rewrote DESIGN.md, completed the neutral ramp in theme.css, and aligned harness tests with route-only stop filtering. |
| 2026-07-28 | feature/deconstruct-yuque-notes | Replaced the three fake deconstruct-page modification logs with three real Yuque articles (covers downloaded locally, bilingual titles/descriptions/tags), and made note cards link to their Yuque articles. |
| 2026-07-28 | main | Added the route legs band, role label gutter, and lane rails to the home timeline; completed the Astro 7 + Vite 8 upgrade; documented the update-route-stop / update-team-member skills in README. |
| 2026-07-09 | fix/yuque-first-image-cover | Replaced blank Yuque covers with article images, fixed compact journal date sorting, enabled 10-minute automatic sync, and merged into main. |
| 2026-07-08 | fix/yuque-journal-sync | Restored Yuque journal sync by removing the failing dependency install, refreshed 3 public journal cards, skipped inaccessible 401/403 docs, and merged into main. |
| 2026-07-02 | feature/location-auto-update | Added the Tracker Allen location update script, added Hami as stop 27, updated route copy to 28 cities, and merged into main. |
| 2026-06-18 | dev | Extended the route map through Shihezi, added a hidden Korla return route point, and enabled map pan/zoom gestures before merging into main. |
| 2026-06-03 | main | Fixed Yuque journal sync deployment, aligned pnpm lockfile for Docker builds, and documented the production debugging runbook. |
| 2026-06-03 | dev | Synced the latest Yuque journal card, added coverage for unknown-city DOC sync, and merged into main. |
| 2026-06-02 | dev | Added the snow mountain MCV image as the third home hero carousel background and merged into main. |
| 2026-06-20 | fix/route-map-provinces | Updated route map visited provinces with full admin names, added Xizang/Qinghai/Xinjiang, adjusted fill color, and merged into main. |
| 2026-06-26 | feature/add-karamay | Added Karamay (克拉玛依) stop to route map (order 25, zh/en content), synced province fill colors in RoutePreview.tsx, and merged into main. |
| 2026-06-28 | dev | Added Urumqi (乌鲁木齐) stop to the route map after Karamay, updated route copy to 27 cities, and merged into main. |
