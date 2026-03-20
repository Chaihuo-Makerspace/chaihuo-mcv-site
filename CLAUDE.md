# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

基地车网页设计 (Base Vehicle Web Design) — a marketing/showcase website for Chaihuo's "VanCar" project. Originally exported from Figma Make, now a React SPA with four pages.

Figma source: https://www.figma.com/design/MnYomXhMNf8tApTUTPjKTJ/

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build

No test framework or linter is configured.

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Radix primitives)

**Routing:** React Router v7 with `createBrowserRouter` in `src/app/routes.ts`. Four routes:
- `/` → Home
- `/deconstruct` → Deconstruct
- `/documentation` → Documentation
- `/guide` → Guide

**Key directories:**
- `src/app/pages/` — page components (large, self-contained files with inline content)
- `src/app/components/ui/` — shadcn/ui component library (do not modify manually)
- `src/app/components/figma/` — Figma-generated helper components (e.g., `ImageWithFallback`)
- `src/app/components/Navigation.tsx` — shared navigation bar
- `src/styles/` — CSS entry point chain: `index.css` → `fonts.css` + `tailwind.css` + `theme.css` + slick-carousel styles

**Path alias:** `@` maps to `src/` (configured in `vite.config.ts`)

## Styling

- Tailwind CSS v4 with `@tailwindcss/vite` plugin — no `tailwind.config` file; config is in CSS via `@theme inline` in `theme.css`
- Design tokens (colors, radii) defined as CSS custom properties in `theme.css` with light/dark mode support
- Animation via `tw-animate-css` and `motion` (Framer Motion)
- Carousel via `react-slick` / `slick-carousel`

## Conventions

- Content is in Chinese (Simplified)
- Navigation adapts styling based on current route (transparent on Home, white on other pages)
- Pages are monolithic components containing all section markup inline
- The project uses `peerDependencies` for React (expects host to provide `react` and `react-dom`)
