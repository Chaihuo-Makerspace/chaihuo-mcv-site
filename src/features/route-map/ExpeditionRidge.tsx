import { useEffect, useMemo, useRef, useState } from 'react';
import type { StopTime } from './expedition-timeline';
import type { RouteCity } from './types';

/**
 * 时间-海拔脊 — the map's second view of the same journey.
 *
 * The map answers "where"; this answers "when, how high, and how busy". It is
 * the elevation profile promoted out of the CityPanel card (where it was a
 * 100px matchbox) into a full-width band, plotted against real dates instead
 * of stop order — which is what makes the quiet stretches visible: a month
 * between two stops shows up as a month of empty axis.
 */

// Drawn in real CSS pixels (width measured, height fixed) rather than scaled
// from a fixed viewBox — a width-scaled viewBox would make the band 270px tall
// on a wide screen and squeeze the map it belongs to.
const H = 128;
const PAD_L = 34;
const PAD_R = 16;
const PAD_T = 22;
const PAD_B = 30;
/** Share of the width reserved for undated planned stops on the right. */
const PLANNED_SHARE = 0.12;

interface Props {
  cities: RouteCity[];
  timeline: Map<string, StopTime>;
  journalCounts: Record<string, number>;
  selectedId: string | null;
  onSelect: (label: string) => void;
  t: Record<string, string>;
}

interface RidgePoint {
  city: RouteCity;
  x: number;
  y: number;
  alt: number;
  date: string | null;
  guessed: boolean;
  journals: number;
}

const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const fmt = (iso: string) => iso.slice(5).replace('-', '.');

export default function ExpeditionRidge({
  cities,
  timeline,
  journalCounts,
  selectedId,
  onSelect,
  t,
}: Props) {
  const wrapRef = useRef<HTMLElement>(null);
  const [W, setW] = useState(900);
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setW(Math.max(320, Math.round(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { points, maxAlt, gap, firstDated, lastDated } = useMemo(() => {
    const dated = cities.filter((c) => timeline.get(c.id)?.date);
    const undated = cities.filter((c) => !timeline.get(c.id)?.date);
    const maxAltitude = Math.max(1, ...cities.map((c) => parseFloat(c.altitude) || 0));

    const t0 = dated.length ? ms(timeline.get(dated[0].id)?.date as string) : 0;
    const t1 = dated.length ? ms(timeline.get(dated[dated.length - 1].id)?.date as string) : 1;
    const span = Math.max(1, t1 - t0);
    const datedWidth = (W - PAD_L - PAD_R) * (undated.length ? 1 - PLANNED_SHARE : 1);
    const yOf = (alt: number) => H - PAD_B - (alt / maxAltitude) * (H - PAD_T - PAD_B);

    const pts: RidgePoint[] = dated.map((c) => {
      const info = timeline.get(c.id) as StopTime;
      const alt = parseFloat(c.altitude) || 0;
      return {
        city: c,
        x: PAD_L + ((ms(info.date as string) - t0) / span) * datedWidth,
        y: yOf(alt),
        alt,
        date: info.date,
        guessed: info.guessed,
        journals: journalCounts[c.id] ?? 0,
      };
    });

    // Undated stops are the planned tail: spaced evenly in the reserved strip,
    // never given a date the content doesn't have.
    undated.forEach((c, i) => {
      const alt = parseFloat(c.altitude) || 0;
      const step = (W - PAD_R - (PAD_L + datedWidth)) / (undated.length + 0.5);
      pts.push({
        city: c,
        x: PAD_L + datedWidth + step * (i + 1),
        y: yOf(alt),
        alt,
        date: null,
        guessed: false,
        journals: journalCounts[c.id] ?? 0,
      });
    });

    // The longest silent stretch — measured between stops whose dates are
    // AUTHORED, not interpolated: the stops inside a silent leg have guessed
    // dates precisely because nothing was published from them, and counting
    // those as milestones would shred one quiet month into a dozen short hops.
    const anchors = pts.map((p, i) => ({ p, i })).filter(({ p }) => p.date && !p.guessed);
    let widest: { from: RidgePoint; to: RidgePoint; days: number } | null = null;
    for (let k = 0; k < anchors.length - 1; k++) {
      const a = anchors[k];
      const b = anchors[k + 1];
      const between = pts.slice(a.i + 1, b.i + 1);
      if (between.some((p) => p.journals > 0)) continue;
      const days = Math.round((ms(b.p.date as string) - ms(a.p.date as string)) / 86_400_000);
      if (days >= 14 && (!widest || days > widest.days)) {
        widest = { from: a.p, to: b.p, days };
      }
    }

    return {
      points: pts,
      maxAlt: maxAltitude,
      gap: widest,
      firstDated: pts[0] ?? null,
      lastDated: dated.length ? pts[dated.length - 1] : null,
    };
  }, [cities, timeline, journalCounts, W]);

  if (points.length === 0) return null;

  const visited = points.filter((p) => p.city.visited);
  const planned = points.filter((p) => !p.city.visited);
  const line = (arr: RidgePoint[]) =>
    arr.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const gridAlts = [4000, 2000].filter((a) => a < maxAlt);
  const barUnit = Math.min(4, (H - PAD_T - PAD_B) / 24);

  const caption = (t['route.ridge.caption'] ?? '{from} → {to} · {days} 天 · 最高 {alt}m')
    .replace(
      '{from}',
      firstDated ? `${firstDated.city.label} ${fmt(firstDated.date as string)}` : '',
    )
    .replace('{to}', lastDated ? `${lastDated.city.label} ${fmt(lastDated.date as string)}` : '')
    .replace(
      '{days}',
      String(
        firstDated?.date && lastDated?.date
          ? Math.round((ms(lastDated.date) - ms(firstDated.date)) / 86_400_000)
          : 0,
      ),
    )
    .replace('{alt}', String(Math.round(maxAlt)));

  return (
    <section
      ref={wrapRef}
      className="w-full"
      aria-label={t['route.ridge.title'] ?? '时间 · 海拔 · 故事密度'}
    >
      <div className="flex items-baseline justify-between px-4 pb-1 text-[11px] text-neutral-500">
        <span className="font-semibold tracking-wide">
          {t['route.ridge.title'] ?? '时间 · 海拔 · 故事密度'}
        </span>
        <span className="tabular-nums truncate pl-3">{caption}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block w-full select-none"
        role="img"
        aria-label={t['route.ridge.title'] ?? '时间 · 海拔 · 故事密度'}
      >
        <title>{t['route.ridge.title'] ?? '时间 · 海拔 · 故事密度'}</title>

        {gap && (
          <>
            <rect
              x={gap.from.x}
              y={PAD_T - 4}
              width={Math.max(0, gap.to.x - gap.from.x)}
              height={H - PAD_B - PAD_T + 4}
              fill="var(--neutral-100)"
              opacity={0.6}
            />
            <text
              x={(gap.from.x + gap.to.x) / 2}
              y={PAD_T - 9}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--neutral-500)"
            >
              {(t['route.ridge.gap'] ?? '{days} 天，零篇日记（{from} → {to}）')
                .replace('{days}', String(gap.days))
                .replace('{from}', gap.from.city.label)
                .replace('{to}', gap.to.city.label)}
            </text>
          </>
        )}

        {gridAlts.map((alt) => {
          const y = H - PAD_B - (alt / maxAlt) * (H - PAD_T - PAD_B);
          return (
            <g key={alt}>
              <line
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="var(--neutral-200)"
                strokeDasharray="3 4"
              />
              <text x={4} y={y + 3.5} fontSize={9} fill="var(--neutral-400)">
                {alt}m
              </text>
            </g>
          );
        })}

        {visited.length > 1 && (
          <path
            d={`${line(visited)} L ${visited[visited.length - 1].x.toFixed(1)} ${H - PAD_B} L ${visited[0].x.toFixed(1)} ${H - PAD_B} Z`}
            fill="var(--neutral-100)"
          />
        )}
        {visited.length > 1 && (
          <path d={line(visited)} fill="none" stroke="#5c4d08" strokeWidth={2} />
        )}
        {planned.length > 0 && visited.length > 0 && (
          <path
            d={line([visited[visited.length - 1], ...planned])}
            fill="none"
            stroke="var(--neutral-400)"
            strokeWidth={1.6}
            strokeDasharray="4 4"
          />
        )}
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--neutral-300)" />

        {points.map((p) => {
          const selected = p.city.id === selectedId;
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: the accessible control is the city button on the map; this SVG tick is a redundant pointer affordance
            <g
              key={p.city.id}
              className="cursor-pointer"
              onClick={() => onSelect(p.city.label)}
              data-ridge-stop={p.city.id}
            >
              <title>{`${p.city.label} · ${p.alt}m${p.date ? ` · ${fmt(p.date)}` : ''} · ${p.journals}`}</title>
              {p.journals > 0 && (
                <rect
                  x={p.x - 2.4}
                  y={H - PAD_B - p.journals * barUnit}
                  width={4.8}
                  height={p.journals * barUnit}
                  rx={1.6}
                  fill={selected ? 'var(--brand-dark)' : '#c8b357'}
                />
              )}
              {p.guessed && (
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={H - PAD_B}
                  stroke="var(--neutral-300)"
                  strokeDasharray="2 3"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={selected ? 4.5 : 2.6}
                fill={selected ? 'var(--brand)' : p.city.visited ? '#5c4d08' : 'var(--neutral-400)'}
                stroke="#ffffff"
                strokeWidth={1}
              />
              <rect
                x={p.x - 7}
                y={PAD_T - 14}
                width={14}
                height={H - PAD_T - PAD_B + 20}
                fill="transparent"
              />
            </g>
          );
        })}

        {[firstDated, lastDated].map((p, i) =>
          p ? (
            <text
              key={p.city.id}
              x={p.x}
              y={H - 12}
              textAnchor={i === 0 ? 'start' : 'end'}
              fontSize={9.5}
              fill="var(--neutral-500)"
            >
              {`${p.date ? fmt(p.date) : ''} ${p.city.label} ${p.alt}m`}
            </text>
          ) : null,
        )}
      </svg>
    </section>
  );
}
