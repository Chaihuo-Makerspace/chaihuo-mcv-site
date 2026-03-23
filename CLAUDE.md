# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

柴火基地车官网 (Chaihuo MCV Site) — a marketing/showcase website for Chaihuo's mobile AI laboratory vehicle "普罗米修斯号". Astro SSR site with five pages, 3D interactive vehicle viewer (React Island), Content Collections for structured data, deployed on Cloudflare Workers.

## Commands

- `pnpm dev` — start Astro dev server
- `pnpm build` — production build (Astro + Cloudflare adapter)
- `pnpm preview` — preview production build locally
- `pnpm install` — install dependencies (**always use pnpm, never npm/yarn**)

No test framework or linter is configured.

## Package Manager

**pnpm only.** Do not use `npm` or `yarn`. `.npmrc` sets `legacy-peer-deps=true` for React 19 compatibility.

## Architecture

**Stack:** Astro 6 + React 19 (Islands) + TypeScript + Tailwind CSS 4 + shadcn/ui (Radix) + Framer Motion + React Three Fiber 9 + Three.js 0.183

**Deployment:** Cloudflare Workers via `@astrojs/cloudflare` adapter. GitHub push triggers auto-deploy. Config in `wrangler.jsonc`.

**Routing:** Astro file-based routing in `src/pages/`:
- `/` → Home (hero carousel, video modal, China route map SVG, mobile lab cards)
- `/deconstruct` → Deconstruct (R3F 3D exploded vehicle view, modification logs, equipment list)
- `/documentation` → Documentation (timeline, category filters)
- `/guide` → Guide (participation guide, FAQ accordion, team)
- `/about` → About (Chaihuo history timeline)

**Key directories:**
- `src/pages/` — Astro page files (`.astro`), each wraps a React Island in `BaseLayout`
- `src/layouts/BaseLayout.astro` — HTML shell, `<head>`, Navigation, Footer
- `src/app/components/` — React Island components (`*Content.tsx` for each page)
- `src/app/components/ui/` — shadcn/ui component library (**do not modify manually**)
- `src/app/components/VehicleExplodedView.tsx` — R3F 3D exploded view (lazy-loaded via React.lazy)
- `src/app/components/Navigation.tsx` — route-aware nav (accepts `pathname` prop from Astro)
- `src/content/` — Astro Content Collections (Markdown files)
- `src/data/` — Structured JSON data files
- `src/styles/` — CSS chain: `index.css` → `fonts.css` + `tailwind.css` + `theme.css` + slick styles

**Content Layer:**
- `src/content.config.ts` — Collection schemas (Zod). Collections: `notes`, `docs`, `equipment`, `team`, `faq`, `partners`, `heroes`
- `src/content/notes/*.md` — 改装手记 (modification logs) — Markdown with frontmatter
- `src/content/docs/*.md` — 时间线文档 (documentation timeline) — Markdown with frontmatter
- `src/data/*.json` — Structured data: equipment, team, faq, partners, heroes, timeline

**To add/edit content:** Edit Markdown files in `src/content/` or JSON files in `src/data/`. Schema validation runs at build time — type errors will fail the build.

**React Islands pattern:** Each Astro page renders a `*Content.tsx` React component with `client:load` or `client:visible`. Data is fetched in the `.astro` frontmatter (via `getCollection()` or JSON import) and passed as props.

**Path alias:** `@` maps to `src/` (in `astro.config.mjs`)

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config` file**; all config in CSS via `@theme inline` in `theme.css`
- Design tokens as CSS custom properties in `theme.css` (`:root` light, `.dark` dark mode)
- `@theme inline { ... }` maps CSS vars to Tailwind tokens (`--color-*`, `--radius-*`)
- Animation: `tw-animate-css` (CSS) + `motion` (Framer Motion JS)
- **Color system** (60-30-10 法则: 60% 中性灰 / 30% 暖黄 / 10% 深灰强调):
  - Brand: `brand` (#f3d230 探险黄), `brand-dark` (#b8960a), `brand-hover` (#e6c22c), `brand-light` (#fef9e7), `brand-foreground` (#333333)
  - Surfaces: `surface` (#F5F5F5 页面背景), `surface-card` (#fff), `surface-dark` (#1a1a1a 深色区块)
  - Neutrals: `neutral-950`~`neutral-50` 七级灰阶 (replaces Tailwind gray-xxx)
  - Use `text-brand`, `bg-surface`, `text-neutral-700` etc. — **avoid hardcoded hex or Tailwind gray-xxx**

## Gotchas

**CJS interop:** `react-slick` is a CJS module. Vite's ESM wrapping nests the default export. Required workaround in `HomeContent.tsx`:
```typescript
import ReactSlick from 'react-slick';
const Slider = ('default' in ReactSlick ? (ReactSlick as any).default : ReactSlick) as typeof ReactSlick;
```

**Asset references:** Use Unsplash URLs or local assets in `src/assets/`.

**3D lazy loading:** `VehicleExplodedView` is loaded via `React.lazy()` in `DeconstructContent.tsx`. Three.js chunk is ~950KB — always lazy-load R3F components.

**Content Collections (Astro 6):** Config file must be at `src/content.config.ts` (NOT `src/content/config.ts`). Import `z` from `astro/zod`, loaders from `astro/loaders`.

**改装手记 "查看全部":** Links to external Yuque page: `https://www.yuque.com/chaihuo-mcv/home`. Future plan: sync from Yuque to local Markdown via `scripts/sync-yuque.ts` (not yet implemented).

## Conventions

- Content is in Simplified Chinese
- Each Astro page wraps a React Island `*Content.tsx` component
- Icons: Lucide React SVGs only — no emoji icons in UI
- Interactive elements must have `cursor-pointer` and `transition-colors duration-200`
- Navigation receives `pathname` from `Astro.url.pathname` (no React Router)
