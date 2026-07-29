import { ArrowUpRight, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { type Locale, localePath } from '@/i18n/index';
import type { RouteCity } from './types';

/**
 * 故事流 — every journal, in the order it happened.
 *
 * The map answers "where it happened" and the ridge "when"; this answers
 * "what it was like, read straight through". All covers already exist in the
 * repo; before this they were reachable only by clicking a stop and scrolling
 * a panel list.
 */

export interface RiverJournal {
  slug: string;
  title: string;
  date: string;
  status: string;
  city: string;
  href?: string;
  coverImage?: string;
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

export default function StoryRiver({ journals, cities, selectedId, onSelect, t, locale }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const labelById = useMemo(() => new Map(cities.map((c) => [c.id, c.label])), [cities]);
  const ordered = useMemo(
    () => [...journals].sort((a, b) => a.date.localeCompare(b.date)),
    [journals],
  );

  // Bring the selected stop's first story into view — the river is the third
  // surface of one shared selection (map ↔ ridge ↔ river).
  useEffect(() => {
    if (!selectedId || !stripRef.current) return;
    const first = stripRef.current.querySelector<HTMLElement>(`[data-story-city="${selectedId}"]`);
    if (!first) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    stripRef.current.scrollTo({
      left: first.offsetLeft - stripRef.current.offsetLeft - 16,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [selectedId]);

  if (ordered.length === 0) return null;

  return (
    <section className="w-full" aria-label={t['route.river.title'] ?? '故事流'}>
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-[11px] font-bold tracking-wide text-neutral-500">
          {t['route.river.title'] ?? '故事流 · 按时间'}
        </h2>
        <span className="text-[11px] text-neutral-400">
          {selectedId ? (t['route.river.hint'] ?? '点暗色卡片先定位到那座城') : `${ordered.length}`}
        </span>
      </div>
      <div ref={stripRef} className="flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar">
        {ordered.map((j) => {
          // Two-step, and the dim state is what makes it legible:
          //   dimmed  → one click LOCATES the stop (map flies there, ridge and
          //             panel follow); the card is not a link yet
          //   focused → the card is armed, a click opens the journal
          // A dimmed card that navigated straight out was the mismatch: it read
          // as inactive but behaved as a live link.
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
              className={`group w-[104px] flex-none transition-opacity duration-300 ${
                active ? '' : 'opacity-35 hover:opacity-70'
              }`}
            >
              {j.coverImage ? (
                <img
                  src={j.coverImage}
                  alt=""
                  loading="lazy"
                  decoding="async"
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
    </section>
  );
}
