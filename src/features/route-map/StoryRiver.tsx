import { ArrowUpRight, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Locale, localePath } from '@/i18n/index';
import type { RouteCity } from './types';

/** 故事流 — every journal, in the order it happened, at an even pitch. */

export interface RiverJournal {
  slug: string;
  title: string;
  date: string;
  status: string;
  city: string;
  href?: string;
  hasPage?: boolean;
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

  // 选中的日记(armed):点击 dim 卡只是选中它,再点才跳转。
  const [armedSlug, setArmedSlug] = useState<string | null>(null);

  // 外部选中(地图图钉)→ 滚到该城首篇;若选中的日记已属该城则不动。
  useEffect(() => {
    if (!layout) return;
    if (!selectedId) {
      setArmedSlug(null);
      return;
    }
    const idx = layout.dated.findIndex((d) => d.j.city === selectedId);
    if (idx < 0) return;
    const armedIdx = layout.dated.findIndex((d) => d.j.slug === armedSlug);
    const armedCity = armedIdx >= 0 ? layout.dated[armedIdx].j.city : undefined;
    const targetIdx = armedCity === selectedId ? armedIdx : idx;
    if (armedCity !== selectedId) setArmedSlug(layout.dated[idx].j.slug);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    stripRef.current?.scrollTo({
      left: Math.max(0, layout.xs[targetIdx] - 16),
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [selectedId, layout, armedSlug]);

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
          {`${ordered.length} ${t['route.stats.journals'] ?? '篇日记'}`}
        </span>
      </div>
      <div ref={stripRef} className="overflow-x-auto px-4 pb-2 no-scrollbar">
        <div className="relative h-[132px]" style={{ width: layout.trackWidth }}>
          {layout.dated.map((d, i) => {
            const j = d.j;
            const lit = j.city === selectedId;
            const armed = j.slug === armedSlug;
            const cityLabel = labelById.get(j.city) ?? j.city;
            const href =
              j.href ?? (j.hasPage ? localePath(`/journals/${j.slug}`, locale) : undefined);
            return (
              <a
                key={`${j.city}-${j.slug}`}
                href={href}
                {...(armed && j.href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                data-story-city={j.city}
                aria-current={armed ? 'true' : undefined}
                title={`${cityLabel} · ${armed && href ? (t['route.river.open'] ?? '打开日记') : (t['route.river.locate'] ?? '定位到该城')}`}
                onClick={(e) => {
                  if (armed) return;
                  e.preventDefault();
                  setArmedSlug(j.slug);
                  if (!lit) onSelect(cityLabel);
                }}
                className={`group absolute top-4 w-[104px] bg-surface-card cursor-pointer transition-opacity duration-300 ${
                  lit ? '' : 'opacity-40 hover:opacity-100'
                }`}
                style={{ left: layout.xs[i], zIndex: lit ? 40 : i }}
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
                      lit ? 'ring-2 ring-brand ring-offset-1' : ''
                    }`}
                  />
                ) : (
                  <div className="h-[62px] w-[104px] rounded-lg bg-neutral-100" />
                )}
                <div className="mt-1 flex items-center gap-1.5 text-[10px] tabular-nums text-neutral-500">
                  <span className={`font-bold ${armed ? 'text-brand-dark' : 'text-neutral-700'}`}>
                    {cityLabel}
                  </span>
                  <span>{j.date.slice(5)}</span>
                  {armed && href ? (
                    <ArrowUpRight className="ml-auto h-3 w-3 text-brand-dark" />
                  ) : (
                    <MapPin
                      className={`ml-auto h-3 w-3 ${lit ? 'text-brand-dark' : 'text-neutral-400'}`}
                    />
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
