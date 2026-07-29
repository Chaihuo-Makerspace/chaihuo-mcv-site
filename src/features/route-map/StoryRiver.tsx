import { ArrowUpRight, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Locale, localePath } from '@/i18n/index';
import type { RouteCity } from './types';

/**
 * 故事流 — every journal, in the order it happened.
 *
 * The map answers "where it happened"; this answers "what it was like, read
 * straight through". Cards run at an even pitch — a time-true spacing was
 * tried (2026-07-29) and rejected in review: the silent stretch read as
 * wasted empty track and dense weeks piled into an illegible stack.
 */

export interface RiverJournal {
  slug: string;
  title: string;
  date: string;
  status: string;
  city: string;
  href?: string;
  coverImage?: string;
  coverThumb?: string;
}

interface Props {
  journals: RiverJournal[];
  cities: RouteCity[];
  selectedId: string | null;
  /** Locate a stop (by label) — the first click on a dimmed card. */
  onSelect: (label: string) => void;
  t: Record<string, string>;
  locale: Locale;
}

const CARD_W = 104;
/** Even pitch between card left edges — card + gutter. */
const PITCH = CARD_W + 16;

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export default function StoryRiver({ journals, cities, selectedId, onSelect, t, locale }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const labelById = useMemo(() => new Map(cities.map((c) => [c.id, c.label])), [cities]);
  const ordered = useMemo(
    () => [...journals].sort((a, b) => a.date.localeCompare(b.date)),
    [journals],
  );

  // Track width follows the container but never shrinks below n × PITCH.
  const [containerW, setContainerW] = useState(1280);
  useEffect(() => {
    const node = stripRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const dated = ordered
      .map((j) => ({ j, ms: toMs(j.date) }))
      .filter((d) => Number.isFinite(d.ms));
    if (dated.length === 0) return null;

    const xs = dated.map((_, i) => i * PITCH);
    const trackWidth = Math.max(containerW, xs[xs.length - 1] + CARD_W);

    return { dated, xs, trackWidth };
  }, [ordered, containerW]);

  // Bring the selected stop's first story into view — the river is the second
  // surface of one shared selection (map ↔ river).
  useEffect(() => {
    if (!selectedId || !stripRef.current || !layout) return;
    const idx = layout.dated.findIndex((d) => d.j.city === selectedId);
    if (idx < 0) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    stripRef.current.scrollTo({
      left: Math.max(0, layout.xs[idx] - 16),
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [selectedId, layout]);

  // No selection on load: open on the latest stories, not the oldest.
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current || !stripRef.current || !layout) return;
    didInitialScroll.current = true;
    if (!selectedId) {
      stripRef.current.scrollTo({ left: layout.trackWidth, behavior: 'auto' });
    }
  }, [layout, selectedId]);

  if (!layout) return null;

  return (
    <section className="w-full" aria-label={t['route.river.title'] ?? '故事流'}>
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-[11px] font-bold tracking-wide text-neutral-500">
          {t['route.river.title'] ?? '故事流 · 按时间'}
        </h2>
        <span className="text-[11px] text-neutral-400">
          {selectedId
            ? (t['route.river.hint'] ?? '点暗色卡片先定位到那座城')
            : `${ordered.length} ${t['route.stats.journals'] ?? '篇日记'}`}
        </span>
      </div>
      <div ref={stripRef} className="overflow-x-auto px-4 pb-2 no-scrollbar">
        <div className="relative h-[132px]" style={{ width: layout.trackWidth }}>
          {layout.dated.map((d, i) => {
            const j = d.j;
            // Two-step, and the dim state is what makes it legible:
            //   dimmed  → one click LOCATES the stop (map flies there, panel
            //             follows); the card is not a link yet
            //   focused → the card is armed, a click opens the journal
            // A dimmed card that navigated straight out was the mismatch: it
            // read as inactive but behaved as a live link.
            const active = j.city === selectedId;
            const cityLabel = labelById.get(j.city) ?? j.city;
            const href = j.href ?? localePath(`/journals/${j.slug}`, locale);
            const actionLabel = active
              ? (t['route.river.open'] ?? '打开日记')
              : (t['route.river.locate'] ?? '定位到该城');
            return (
              <a
                key={`${j.city}-${j.slug}`}
                href={href}
                {...(active && j.href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                data-story-city={j.city}
                data-story-armed={active ? 'true' : 'false'}
                aria-current={active ? 'true' : undefined}
                title={`${cityLabel} · ${actionLabel}`}
                onClick={(e) => {
                  if (active) return; // armed — let the link through
                  e.preventDefault();
                  onSelect(cityLabel);
                }}
                className={`group absolute top-4 w-[104px] bg-surface-card transition-opacity duration-300 ${
                  active ? '' : 'opacity-40 hover:opacity-100'
                }`}
                style={{ left: layout.xs[i], zIndex: active ? 40 : i }}
              >
                {j.coverImage ? (
                  <img
                    src={j.coverThumb ?? j.coverImage}
                    alt=""
                    width={104}
                    height={62}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className={`h-[62px] w-[104px] rounded-lg object-cover bg-neutral-100 transition-shadow duration-200 group-hover:shadow-md ${
                      active ? 'ring-2 ring-brand ring-offset-1' : ''
                    }`}
                  />
                ) : (
                  <div className="h-[62px] w-[104px] rounded-lg bg-neutral-100" />
                )}
                <div className="mt-1 flex items-center gap-1.5 text-[10px] tabular-nums text-neutral-500">
                  <span className={`font-bold ${active ? 'text-brand-dark' : 'text-neutral-700'}`}>
                    {cityLabel}
                  </span>
                  <span>{j.date.slice(5)}</span>
                  {/* The icon states what this click will do: locate, or open. */}
                  {active ? (
                    <ArrowUpRight className="ml-auto h-3 w-3 text-brand-dark" />
                  ) : (
                    <MapPin className="ml-auto h-3 w-3 text-neutral-400" />
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-700 group-hover:text-neutral-900">
                  {j.title}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
