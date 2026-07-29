import { ArrowUpRight, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Locale, localePath } from '@/i18n/index';
import type { RouteCity } from './types';

/**
 * 故事流 — every journal, in the order it happened, WHERE it happened in time.
 *
 * The map answers "where it happened"; this answers "what it was like, read
 * straight through" — and, by spacing cards on real dates, "how fast". Dense
 * weeks pile cards into an overlapping stack; a quiet month (拉萨 → 乌鲁木齐)
 * stays as literal empty track, marked by a single striped gap band.
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
/** Minimum horizontal pitch between card left edges after the overlap pass. */
const MIN_SEP = 40;
/** Track is at least this wide per card, so dense journals never collapse to zero. */
const PER_CARD = 44;
/** A silent stretch this long earns the striped gap band. */
const GAP_MIN_DAYS = 10;

const dayMs = 86_400_000;
const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

interface RiverGap {
  fromLabel: string;
  toLabel: string;
  days: number;
  x0: number;
  x1: number;
}

/** The longest silent stretch between consecutive journals, or null. */
function findGap(
  dated: { j: RiverJournal; ms: number }[],
  xs: number[],
  labelById: Map<string, string>,
): RiverGap | null {
  let gap: RiverGap | null = null;
  for (let i = 0; i < dated.length - 1; i++) {
    const days = Math.round((dated[i + 1].ms - dated[i].ms) / dayMs);
    if (days < GAP_MIN_DAYS) continue;
    if (gap && days <= gap.days) continue;
    const fromCity = dated[i].j.city;
    const toCity = dated[i + 1].j.city;
    gap = {
      fromLabel: labelById.get(fromCity) ?? fromCity,
      toLabel: labelById.get(toCity) ?? toCity,
      days,
      x0: xs[i] + CARD_W,
      x1: xs[i + 1],
    };
  }
  return gap && gap.x1 - gap.x0 >= 56 ? gap : null;
}

export default function StoryRiver({ journals, cities, selectedId, onSelect, t, locale }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const labelById = useMemo(() => new Map(cities.map((c) => [c.id, c.label])), [cities]);
  const ordered = useMemo(
    () => [...journals].sort((a, b) => a.date.localeCompare(b.date)),
    [journals],
  );

  // Track width follows the container but never shrinks below n × PER_CARD.
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

    const t0 = dated[0].ms;
    const t1 = dated[dated.length - 1].ms;
    const span = Math.max(1, t1 - t0);
    const baseWidth = Math.max(containerW, dated.length * PER_CARD);

    // Time-true x, then one left-to-right pass that only pushes overlapping
    // cards right — genuine gaps stay as literal empty track.
    const xs = dated.map((d) => ((d.ms - t0) / span) * Math.max(0, baseWidth - CARD_W));
    for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + MIN_SEP);
    const trackWidth = Math.max(baseWidth, xs[xs.length - 1] + CARD_W);

    // The longest silent stretch between consecutive journals.
    const gap = findGap(dated, xs, labelById);

    return { dated, xs, trackWidth, gap, first: dated[0].j, last: dated[dated.length - 1].j };
  }, [ordered, containerW, labelById]);

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

  const gapLabel = layout.gap
    ? (t['route.river.gap'] ?? '{from} → {to} · {days} 天')
        .replace('{from}', layout.gap.fromLabel)
        .replace('{to}', layout.gap.toLabel)
        .replace('{days}', String(layout.gap.days))
    : null;

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
        <div className="relative h-[96px]" style={{ width: layout.trackWidth }}>
          {/* Date ticks at the track ends. */}
          <span className="absolute left-0 top-0 text-[10px] tabular-nums text-neutral-400">
            {layout.first.date}
          </span>
          <span className="absolute right-0 top-0 text-[10px] tabular-nums text-neutral-400">
            {layout.last.date}
          </span>

          {/* The longest silent stretch, drawn as empty striped track. */}
          {layout.gap && gapLabel && (
            <div
              className="absolute top-4 bottom-0 border-x border-dashed border-neutral-300"
              style={{
                left: layout.gap.x0,
                width: layout.gap.x1 - layout.gap.x0,
                backgroundImage:
                  'repeating-linear-gradient(45deg, var(--neutral-100) 0 6px, transparent 6px 12px)',
              }}
            >
              <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface-card px-1.5 text-[10px] tabular-nums text-neutral-500">
                {gapLabel}
              </span>
            </div>
          )}

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
                  active ? '' : 'opacity-40 hover:z-50 hover:opacity-100'
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
                {/* 文字只讲给"被指向"的卡:叠放的卡只露封面(疏密即密度),
                    悬停/选中时文字以浮层出现,叠放区不再互相糊字。 */}
                <div
                  className={
                    active
                      ? ''
                      : 'absolute left-0 top-full z-50 hidden w-[104px] rounded-b-lg bg-surface-card/95 px-0.5 pb-1 shadow-md group-hover:block'
                  }
                >
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] tabular-nums text-neutral-500">
                    <span
                      className={`font-bold ${active ? 'text-brand-dark' : 'text-neutral-700'}`}
                    >
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
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
