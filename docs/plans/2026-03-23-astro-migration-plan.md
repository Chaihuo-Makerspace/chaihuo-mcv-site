# Astro Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Incrementally migrate the Chaihuo MCV site from a React SPA (Vite 8) to Astro with Content Collections, React Islands, and Cloudflare Workers deployment.

**Architecture:** Astro SSR via `@astrojs/cloudflare` adapter. Content lives in `src/content/` (Markdown via `glob` loader) and `src/data/` (JSON via `file` loader), both with Zod schemas. Interactive components (3D viewer, carousels, accordions, animations) remain as React Islands with `client:load` or `client:visible` directives. Tailwind CSS v4 via `@tailwindcss/vite` plugin (same as current).

**Tech Stack:** Astro 5.x, @astrojs/react, @astrojs/cloudflare, Tailwind CSS v4, React 19, Framer Motion, React Three Fiber, Zod

---

## Phase 1: Scaffold Astro Project

### Task 1.1: Install Astro and core integrations

**Files:**
- Modify: `package.json`
- Create: `astro.config.mjs`
- Create: `wrangler.jsonc`
- Modify: `tsconfig.json`

**Step 1: Install Astro and integrations**

```bash
pnpm add astro @astrojs/react @astrojs/cloudflare
```

**Step 2: Create `astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
```

**Step 3: Create `wrangler.jsonc`**

```jsonc
{
  "main": "dist/_worker.js/index.js",
  "name": "chaihuo-mcv-site",
  "compatibility_date": "2026-03-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "observability": {
    "enabled": true
  }
}
```

**Step 4: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

Remove Vite-only devDependencies (`@vitejs/plugin-react`, `vite`) and `pnpm.overrides` for Vite. Remove `react-router` from dependencies (Astro uses file-based routing). Keep `vite.config.ts` deletion for later (after full migration).

**Step 5: Update `tsconfig.json`**

Extend Astro's base tsconfig and keep the `@` path alias:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro project with React + Cloudflare adapter"
```

---

### Task 1.2: Create BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

**Step 1: Create the layout**

This wraps all pages with `<html>`, `<head>`, global styles, Navigation, and Footer. Navigation and Footer are React Islands since Navigation has scroll/route state.

```astro
---
import Navigation from '@/app/components/Navigation';
import { Footer } from '@/app/components/Footer';
import '@/styles/index.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '柴火基地车 — 移动 AI 实验室' } = Astro.props;
const pathname = Astro.url.pathname;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} | 柴火基地车</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="min-h-screen bg-surface text-neutral-900">
    <Navigation client:load pathname={pathname} />
    <main>
      <slot />
    </main>
    <Footer client:visible />
  </body>
</html>
```

**Step 2: Refactor Navigation to accept `pathname` as prop**

Currently Navigation uses `useLocation()` from react-router. Change it to accept `pathname: string` as a prop and use that instead. Remove the react-router import.

**Files:**
- Modify: `src/app/components/Navigation.tsx`

Replace:
```typescript
import { useLocation, Link } from 'react-router';
// ...
const location = useLocation();
const isHome = location.pathname === '/';
```

With:
```typescript
// Remove react-router imports entirely
interface NavigationProps {
  pathname: string;
}
export default function Navigation({ pathname }: NavigationProps) {
  const isHome = pathname === '/';
  // Replace <Link to="..."> with <a href="...">
```

**Step 3: Refactor Footer — remove react-router Link if present**

Check Footer.tsx. If it uses `<Link>` from react-router, replace with `<a href>`. Export as default if needed.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add BaseLayout.astro + refactor Navigation to accept pathname prop"
```

---

## Phase 2: Content Layer

### Task 2.1: Set up Content Collections for Markdown content

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/notes/2025-03-12-research.md`
- Create: `src/content/notes/2025-03-01-3d-scan.md`
- Create: `src/content/notes/2025-02-14-solar.md`
- Create: `src/content/docs/` (6 markdown files from Documentation TIMELINE_DATA)

**Step 1: Create `src/content/config.ts`**

```typescript
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    image: z.string().url(),
    tags: z.array(z.string()),
    yuqueUrl: z.string().url().optional(),
  }),
});

const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.enum(['人物访谈', '纪录片', 'Vlog', '文章']),
    description: z.string(),
    readTime: z.string().optional(),
    coverImage: z.string().url().optional(),
    videoLinks: z.array(z.string().url()).default([]),
    pdfName: z.string().optional(),
  }),
});

const equipment = defineCollection({
  loader: file('./src/data/equipment.json'),
  schema: z.object({
    id: z.string(),
    icon: z.string(),
    title: z.string(),
    items: z.array(z.object({
      name: z.string(),
      spec: z.string(),
    })),
  }),
});

const team = defineCollection({
  loader: file('./src/data/team.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    image: z.string().url(),
  }),
});

const faq = defineCollection({
  loader: file('./src/data/faq.json'),
  schema: z.object({
    id: z.string(),
    label: z.string(),
    items: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })),
  }),
});

const partners = defineCollection({
  loader: file('./src/data/partners.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

const heroes = defineCollection({
  loader: file('./src/data/heroes.json'),
  schema: z.object({
    id: z.string(),
    image: z.string().url(),
    alt: z.string().optional(),
  }),
});

export const collections = { notes, docs, equipment, team, faq, partners, heroes };
```

**Step 2: Extract inline data from page components into Markdown/JSON files**

Move `modificationLogs[]` from `Deconstruct.tsx` → 3 Markdown files in `src/content/notes/`.
Move `TIMELINE_DATA[]` from `Documentation.tsx` → 6 Markdown files in `src/content/docs/`.

Example `src/content/notes/2025-03-12-research.md`:
```markdown
---
title: 移动创客空间与 DIY 露营车研究
date: "2025/03/12-25"
description: 改装一辆移动创客空间，既不同于普通的房车露营改装，也不同于固定的创客空间搭建。我们需要在有限空间里兼顾工作坊、展示、教学、旅居等多重功能。
image: https://images.unsplash.com/photo-1504222490345-c075b6008014?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80
tags: [调研, 设计]
---
```

**Step 3: Extract structured data into JSON files**

Move `equipmentCategories[]` → `src/data/equipment.json`
Move `teamMembers[]` → `src/data/team.json`
Move `faqGroups[]` → `src/data/faq.json`
Move `PARTNERS[]` → `src/data/partners.json`
Move `heroImages[]` → `src/data/heroes.json`

Each JSON file is an array of objects with an `id` field (required by Astro's `file` loader).

Example `src/data/equipment.json`:
```json
[
  {
    "id": "ai-compute",
    "icon": "Cpu",
    "title": "AI & 计算系统",
    "items": [
      { "name": "AI 推理服务器", "spec": "4×NVIDIA L40 · 80GB VRAM" },
      { "name": "边缘工作站", "spec": "NVIDIA Jetson Orin · 64GB" },
      { "name": "卫星通信", "spec": "Starlink Gen 3 · 低轨卫星" },
      { "name": "边缘路由", "spec": "Mesh WiFi 6E · 全车覆盖" }
    ]
  }
]
```

**Step 4: Run `pnpm dev` to verify Content Collections load without errors**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Content Collections schemas + extract all inline data to content/data files"
```

---

## Phase 3: Migrate Pages (simple → complex)

### Task 3.1: Migrate About page

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/data/timeline.json` (About timeline data)
- Modify: `src/app/pages/About.tsx` → extract interactive `TimelineScroll` component

**Why About first:** Simplest page — timeline scroll is the only interactive element. Good validation target.

**Step 1: Extract About's `TIMELINE_DATA` and `PHASES` into JSON**

Create `src/data/timeline.json` with the 14-year timeline + phases data. Register in content config.

**Step 2: Extract `TimelineScroll` React component**

Pull the horizontal scroll section (with ChevronLeft/Right buttons and `scrollBy`) into a standalone `src/app/components/TimelineScroll.tsx` that accepts `timelineData` and `phases` as props.

**Step 3: Create `src/pages/about.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import TimelineScroll from '@/app/components/TimelineScroll';
import { getCollection } from 'astro:content';
import timeline from '@/data/timeline.json';
import partners from '@/data/partners.json';
---

<BaseLayout title="关于柴火">
  <!-- Hero section: static Astro markup with Tailwind classes -->
  <section class="...">
    <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold text-neutral-900 mb-8 leading-tight">
      柴火 15 年，<br />从创客空间到基地车。
    </h1>
    <p class="...">...</p>
  </section>

  <!-- Timeline: React Island for scroll interaction -->
  <TimelineScroll
    client:visible
    timelineData={timeline.years}
    phases={timeline.phases}
  />

  <!-- Partners: static Astro markup -->
  <section class="...">
    {partners.map(p => <span>{p.name}</span>)}
  </section>
</BaseLayout>
```

**Step 4: Run `pnpm dev` and verify `/about` renders correctly**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: migrate About page to Astro"
```

---

### Task 3.2: Migrate Guide page

**Files:**
- Create: `src/pages/guide.astro`
- Create: `src/app/components/FaqAccordion.tsx` (extracted)

**Step 1: Create `src/pages/guide.astro`**

Static sections: hero, participation cards, team grid.
React Islands: `FaqAccordion` (`client:visible`) — the only stateful interaction (openFAQ state + AnimatePresence).

Load data from `src/data/team.json` and `src/data/faq.json`.

**Step 2: Extract FAQ accordion logic into standalone component**

The `FaqAccordion` receives `faqGroups` as prop, manages its own open/close state internally.

**Step 3: Verify and commit**

```bash
git add -A && git commit -m "feat: migrate Guide page to Astro"
```

---

### Task 3.3: Migrate Documentation page

**Files:**
- Create: `src/pages/documentation.astro`
- Create: `src/app/components/CategoryFilter.tsx` (extracted)

**Step 1: Create `src/pages/documentation.astro`**

Load docs via `getCollection('docs')`. Pass the collection data to `CategoryFilter` React Island.

**Step 2: Extract `CategoryFilter` component**

This component handles category state (`activeCategory`) and renders the filtered timeline. It receives the full docs array and category config as props. This is `client:load` since it's the core page interaction.

**Step 3: Verify and commit**

```bash
git add -A && git commit -m "feat: migrate Documentation page to Astro"
```

---

### Task 3.4: Migrate Deconstruct page

**Files:**
- Create: `src/pages/deconstruct.astro`

**Step 1: Create `src/pages/deconstruct.astro`**

Load notes via `getCollection('notes')`. Load equipment from `src/data/equipment.json`.

Static sections: hero, modification log cards (with "查看全部" linking to `https://www.yuque.com/chaihuo-mcv/home`), equipment grid.

React Island: `VehicleExplodedView` (`client:visible`) — already a standalone lazy component, minimal change needed. Remove the React.lazy wrapper (Astro's `client:visible` handles lazy hydration).

**Step 2: Wire up "查看全部" link**

```html
<a href="https://www.yuque.com/chaihuo-mcv/home"
   target="_blank"
   rel="noopener noreferrer"
   class="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 flex items-center gap-1">
  查看全部
  <ChevronRight className="w-4 h-4" />
</a>
```

**Step 3: Verify and commit**

```bash
git add -A && git commit -m "feat: migrate Deconstruct page to Astro"
```

---

### Task 3.5: Migrate Home page

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/app/components/HeroCarousel.tsx` (extracted)
- Create: `src/app/components/VideoModal.tsx` (extracted)
- Create: `src/app/components/CountUp.tsx` (extracted)
- Modify: `src/app/components/ChinaRouteMap.tsx` (already standalone, ensure no router deps)

**Why last:** Most complex page — carousel (CJS interop), video modal, SVG route map, count-up animations. Multiple React Islands.

**Step 1: Extract interactive components from Home.tsx**

- `HeroCarousel` — wraps react-slick with CJS interop, receives `heroImages` prop
- `VideoModal` — Radix Dialog with Bilibili iframe, manages its own open state
- `CountUp` — number animation, receives target value as prop
- `ChinaRouteMap` — SVG with motion animations, receives `cities` and `routePaths` as props

**Step 2: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import HeroCarousel from '@/app/components/HeroCarousel';
import VideoModal from '@/app/components/VideoModal';
import ChinaRouteMap from '@/app/components/ChinaRouteMap';
import CountUp from '@/app/components/CountUp';
import heroes from '@/data/heroes.json';
---

<BaseLayout title="首页">
  <HeroCarousel client:load images={heroes} />
  <VideoModal client:visible />
  <!-- Stats section with CountUp islands -->
  <CountUp client:visible target={10} suffix="+" label="途经城市" />
  <ChinaRouteMap client:visible />
  <!-- Static card sections -->
</BaseLayout>
```

**Step 3: Verify CJS interop for react-slick still works under Astro's Vite**

The same workaround should work since Astro uses Vite internally:
```typescript
const Slider = ('default' in ReactSlick ? (ReactSlick as any).default : ReactSlick) as typeof ReactSlick;
```

**Step 4: Verify and commit**

```bash
git add -A && git commit -m "feat: migrate Home page to Astro"
```

---

## Phase 4: Cleanup and Verify

### Task 4.1: Remove old SPA infrastructure

**Files:**
- Delete: `src/app/routes.ts`
- Delete: `src/app/App.tsx`
- Delete: `src/app/components/PageTransition.tsx`
- Delete: `src/main.tsx`
- Delete: `index.html` (Astro generates its own)
- Delete: `vite.config.ts`
- Delete: `postcss.config.mjs`
- Modify: `package.json` — remove `react-router` dependency

**Step 1: Remove files**

```bash
rm src/app/routes.ts src/app/App.tsx src/app/components/PageTransition.tsx src/main.tsx index.html vite.config.ts postcss.config.mjs
pnpm remove react-router
```

**Step 2: Verify build**

```bash
pnpm build
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove old Vite SPA infrastructure"
```

---

### Task 4.2: Verify Cloudflare Workers deployment

**Step 1: Build and preview locally**

```bash
pnpm build && pnpm preview
```

Verify all 5 routes render correctly.

**Step 2: Test `wrangler dev` locally**

```bash
npx wrangler dev
```

Verify SSR works on Cloudflare Workers runtime.

**Step 3: Push to GitHub to trigger Cloudflare auto-deploy**

**Step 4: Verify live deployment — all pages, 3D viewer, carousel, FAQ accordion**

**Step 5: Commit any fixes**

---

### Task 4.3: Update CLAUDE.md and project docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

Update to reflect new Astro architecture:
- Commands: `pnpm dev` / `pnpm build` / `pnpm preview` (via Astro)
- Architecture: Astro + Content Collections + React Islands
- Content editing: how to add/edit notes and docs
- Remove references to Vite 8, React Router, SPA

**Commit:**

```bash
git add -A && git commit -m "docs: update CLAUDE.md and README for Astro migration"
```

---

## Migration Order Summary

```
Phase 1: Scaffold
  1.1 Install Astro + integrations + config
  1.2 BaseLayout + refactor Navigation/Footer

Phase 2: Content
  2.1 Content Collections schemas + extract all data

Phase 3: Pages (simple → complex)
  3.1 About
  3.2 Guide
  3.3 Documentation
  3.4 Deconstruct
  3.5 Home

Phase 4: Cleanup
  4.1 Remove old SPA files
  4.2 Verify Cloudflare deployment
  4.3 Update docs
```

Total: 10 tasks, each independently committable and verifiable.
