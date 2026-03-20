# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

柴火基地车官网 (Chaihuo MCV Site) — a marketing/showcase website for Chaihuo's mobile AI laboratory vehicle "普罗米修斯号". React SPA with four pages, 3D interactive vehicle viewer, and static content (future Yuque sync planned).

## Commands

- `npm run dev` — start Vite 8 dev server
- `npm run build` — production build (Rolldown)

No test framework or linter is configured.

## Architecture

**Stack:** React 19 + TypeScript + Vite 8 (Rolldown) + Tailwind CSS 4 + shadcn/ui (Radix) + React Three Fiber 9 + Three.js 0.183

**Routing:** React Router v7 with `createBrowserRouter` in `src/app/routes.ts`:
- `/` → Home (hero carousel, video modal, China route map SVG, mobile lab cards)
- `/deconstruct` → Deconstruct (R3F 3D exploded vehicle view, modification logs, equipment list)
- `/documentation` → Documentation (timeline, category filters)
- `/guide` → Guide (participation guide, FAQ accordion, team)

**Key directories:**
- `src/app/pages/` — page components (monolithic, self-contained with inline content)
- `src/app/components/ui/` — shadcn/ui component library (**do not modify manually**)
- `src/app/components/VehicleExplodedView.tsx` — R3F 3D exploded view (lazy-loaded, ~950KB chunk)
- `src/app/components/Navigation.tsx` — route-aware nav (dark on Home `/`, white elsewhere via `useLocation()`)
- `src/styles/` — CSS chain: `index.css` → `fonts.css` + `tailwind.css` + `theme.css` + slick styles

**Path alias:** `@` maps to `src/` (in `vite.config.ts`)

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

**Vite 8 CJS interop:** `react-slick` is a CJS module. Vite 8's ESM wrapping nests the default export. Required workaround:
```typescript
import ReactSlick from 'react-slick';
const Slider = ('default' in ReactSlick ? (ReactSlick as any).default : ReactSlick) as typeof ReactSlick;
```
Apply this pattern to any CJS library with a default export that breaks at runtime.

**Figma asset references:** Some pages (Documentation.tsx) still import `figma:asset/...` which won't resolve. Replace with Unsplash URLs or local assets in `src/assets/`.

**3D lazy loading:** `VehicleExplodedView` is loaded via `React.lazy()` in Deconstruct.tsx to keep the main bundle under 500KB. Three.js chunk is ~950KB — always lazy-load R3F components.

**Content is static:** All page data (logs, equipment, docs, FAQs) lives as arrays inside page components. Future plan: sync from Yuque (语雀) to local Markdown via `scripts/sync-yuque.ts` (not yet implemented).

## Conventions

- Content is in Simplified Chinese
- Pages are monolithic components with all sections inline
- Icons: Lucide React SVGs only — no emoji icons in UI
- Interactive elements must have `cursor-pointer` and `transition-colors duration-200`
- `postcss.config.mjs` is intentionally empty (Tailwind v4 handles PostCSS internally)
