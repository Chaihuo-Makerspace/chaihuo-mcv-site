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
- `pnpm run images:covers|avatars|heroes|deconstruct` — regenerate image derivatives; all run automatically inside `pnpm dev` and `pnpm build` (details: `docs/image-derivatives.md`)
- `pnpm build` — run checks, generate image derivatives, then production build (Node standalone)
- `pnpm build:astro` — raw Astro build without the pre-build check wrapper
- `pnpm preview` — preview production build locally
- `pnpm start` — run production server (`node ./dist/server/entry.mjs`)
- `./deploy.sh` — Docker build + deploy (one command)

**pnpm only.** Do not use `npm` or `yarn`. `.npmrc` sets `legacy-peer-deps=true` for React 19 compatibility.

No unit test framework or linter is configured. Use `pnpm check` as the main non-browser issue-discovery command, and `pnpm harness` when a change affects rendered behavior.

## Architecture

**Stack:** Astro 7 + React 19 (Islands) + TypeScript + Tailwind CSS 4 + shadcn/ui (Radix) + Framer Motion

**Deployment:** Node.js standalone via `@astrojs/node` adapter. Docker (`Dockerfile` + `docker-compose.yml`). GitHub push triggers Jenkins deploy through repository webhook job `chaihuo-chaihuo-mcv-site`. Runbook: `docs/deployment-yuque-sync.md`.

**Live (`/live` + `/live/admin`):** A second compose service `capture` snapshots the EZVIZ onboard camera every `LIVE_INTERVAL_MINUTES` (default 3) into bind-mounted `./data/live`, groups near-identical frames by dHash, and prunes by `LIVE_KEEP_DAYS` (default 30); missing credentials park the container so deploys never fail. `/live` is a public, in-nav, indexed page (zh/en) with the live frame + 「一路上」 featured carousel. `/live/admin` (zh-only, noindex) is the members' backend behind `LIVE_ADMIN_PASSWORD` (HMAC cookie session, login rate-limited): archive browser with similar-frame folding, featured curation, recycle bin, original downloads. The web side only reads `LIVE_DATA_DIR` and never sees EZVIZ credentials. Full details: `docs/live-capture.md`; spec: `docs/superpowers/specs/2026-08-04-live-redesign-design.md`.

**Routing:** Astro file-based routing in `src/pages/`. Chinese is default (no prefix), English under `/en/`:
- `/` `/en/` → Home (hero carousel, video modal, China route map SVG, mobile lab cards)
- `/journals` `/en/journals` → Journals (city journal list, filters, detail pages)
- `/route` `/en/route` → Route (interactive China map, city panels, linked journals)
- `/deconstruct` `/en/deconstruct` → Deconstruct (modification logs, equipment list)
- `/guide` `/en/guide` → Guide (participation guide, FAQ accordion, team)
- `/about` `/en/about` → About (Chaihuo history timeline, GSAP scroll-driven)
- `/live` `/en/live` → Live (public onboard-camera view, in nav, indexed)
- `/live/admin` → Members' backend (zh-only, `noindex`)

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

**改装手记 "查看全部":** Links to external Yuque page: `https://www.yuque.com/chaihuo-mcv/home`.

**Image derivatives:** large public images (Yuque covers, people avatars, hero carousel, deconstruct cards) are served through small WebP derivatives — **gitignored, rebuilt at dev/build time**, resolved in `.astro` frontmatter with an `existsSync` fallback to the original so a missing derivative degrades instead of 404-ing. Details: `docs/image-derivatives.md`.

**Yuque journal sync:** `Sync Yuque Journals` GitHub Actions workflow syncs visible, publicly accessible Yuque `DOC` entries from `https://www.yuque.com/mouseart/mcv` every 10 minutes and via manual dispatch, then commits back to `main` (triggering Jenkins deploy). Inaccessible 401/403 docs are skipped. City inference attaches journals to route stops via auto-derived stop labels + an alias table + dateline/geocoding fallbacks. Details: `docs/deployment-yuque-sync.md`.

**Production deployment debugging:** Production is served through Tengine/CDN and Jenkins, not Cloudflare Workers — ignore GitHub's Cloudflare Workers/Pages check; it is not the source of truth for `mcv.chaihuo.org`. If production is stale, check GitHub webhook deliveries for the Jenkins queue item, then inspect Jenkins job `chaihuo-chaihuo-mcv-site`. See `docs/deployment-yuque-sync.md`.

**Docker pnpm version:** Docker pins `pnpm@11.5.0`. Do not use `pnpm@latest` in Docker because pnpm lockfile validation can change across versions. If `pnpm-workspace.yaml` overrides change, regenerate and verify the lockfile with `corepack pnpm@11.5.0 install --lockfile-only --no-frozen-lockfile` and `corepack pnpm@11.5.0 install --frozen-lockfile --lockfile-only`.

## Conventions

- Content is in Simplified Chinese with English translations via i18n system
- Each Astro page wraps a React Island `*Content.tsx` component
- React components accept `locale` and `t` (dictionary) props for i18n
- Icons: Lucide React SVGs only — no emoji icons in UI
- Interactive elements must have `cursor-pointer` and `transition-colors duration-200`
- Navigation and Footer receive `locale` prop; internal links use `localePath()` helper
- `src/app/components/ui/` — shadcn/ui components — **do not modify manually**

## Detailed Docs

- `docs/DESIGN.md` — design rules (three tiers) and anti-patterns
- `docs/ai-iteration.md` — recommended AI change loop
- `docs/deployment-yuque-sync.md` — Yuque sync + Jenkins deploy runbook, city inference, incidents
- `docs/live-capture.md` — EZVIZ capture service, `/live` and `/live/admin`
- `docs/image-derivatives.md` — WebP derivative pipeline for public images
- `docs/route-redesign.md` — `/route` page design notes
- `docs/location-city-update.md` — Tracker Allen location updates
- `docs/CHANGELOG.md` — completed features and changelog history (append new entries there, not here)
