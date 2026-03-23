# Astro Migration Design

> Migrate from React SPA (Vite 8) to Astro with Content Collections, React Islands, and Cloudflare Workers deployment.

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration strategy | Incremental (page-by-page) | Low risk, verifiable at each step |
| Deployment | Cloudflare Workers (SSR-capable) | Already configured, GitHub push triggers deploy |
| Content format | Markdown (notes, docs) + JSON (structured data) | Markdown for content with body; JSON for pure data |
| Animations | Keep Framer Motion as React Islands | Proven, high confidence, no rework |
| Output mode | Hybrid (SSG default, SSR available) | Static pages for performance, SSR option for future Yuque API |

## Project Structure

```
src/
├── content/                   # Astro Content Collections
│   ├── config.ts              # Zod schemas
│   ├── notes/                 # 改装手记 (Markdown)
│   └── docs/                  # 时间线文档 (Markdown)
├── data/                      # Structured JSON data
│   ├── equipment.json
│   ├── team.json
│   ├── faq.json
│   ├── partners.json
│   └── heroes.json
├── pages/                     # Astro file-based routing
│   ├── index.astro
│   ├── deconstruct.astro
│   ├── documentation.astro
│   ├── guide.astro
│   └── about.astro
├── layouts/
│   └── BaseLayout.astro       # HTML shell, <head>, Nav, Footer
├── components/                # React Islands
│   ├── Navigation.tsx         # client:load
│   ├── HeroCarousel.tsx       # client:load
│   ├── VideoModal.tsx         # client:visible
│   ├── ChinaRouteMap.tsx      # client:visible
│   ├── CountUp.tsx            # client:visible
│   ├── CategoryFilter.tsx     # client:load
│   ├── FaqAccordion.tsx       # client:visible
│   ├── TimelineScroll.tsx     # client:visible
│   ├── VehicleExplodedView.tsx # client:visible
│   └── motion.ts
├── styles/                    # Preserved from current project
└── assets/                    # Preserved from current project
```

## Content Collections Schema

### Markdown Collections (src/content/)

**notes** — 改装手记:
- `title: string`
- `date: string` (e.g. "2025/03/12-25")
- `description: string`
- `image: url`
- `tags: string[]`
- `yuqueUrl?: url`

**docs** — 时间线文档:
- `title: string`
- `date: string`
- `category: enum('人物访谈', '纪录片', 'Vlog', '文章')`
- `description: string`
- `readTime?: string`
- `coverImage?: url`
- `videoLinks: url[]`
- `pdfName?: string`

### JSON Data (src/data/)

**equipment.json** — categories[] with icon, title, items[{name, spec}]
**team.json** — [{name, role, image}]
**faq.json** — [{label, items[{question, answer}]}]
**partners.json** — string[]
**heroes.json** — [{image, alt?}]

## React Island Strategy

| Component | Directive | Why |
|-----------|-----------|-----|
| Navigation | `client:load` | Scroll listener + route awareness needed immediately |
| HeroCarousel | `client:load` | Above fold, autoplay on load |
| VideoModal | `client:visible` | Only needed when user scrolls to CTA |
| ChinaRouteMap | `client:visible` | SVG animation below fold |
| CountUp | `client:visible` | Number animation on scroll into view |
| CategoryFilter | `client:load` | Core page interaction for Documentation |
| FaqAccordion | `client:visible` | Below fold interaction |
| TimelineScroll | `client:visible` | Horizontal scroll buttons |
| VehicleExplodedView | `client:visible` | Heavy 3D, lazy load (~950KB) |

## Migration Phases

1. **Scaffold** — Astro project, config, Tailwind, Cloudflare adapter
2. **Content layer** — Content Collections + JSON data + schemas
3. **Layout + Nav** — BaseLayout.astro, Navigation React Island, Footer
4. **Pages (simple first)** — About → Guide → Documentation → Deconstruct → Home
5. **Verify + cleanup** — Remove old Vite/React Router setup, test all routes

## External Links

- 「查看全部」(改装手记) → `https://www.yuque.com/chaihuo-mcv/home`
- Future: Yuque sync script writes to `src/content/notes/`
