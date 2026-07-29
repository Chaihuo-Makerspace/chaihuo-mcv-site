import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultViewport, fadeUp, springTransition, stagger } from './motion';

interface Segment {
  id: string;
  role: string;
  crewId: string;
  name: string;
  image: string;
  avatarThumb: string; // 64px WebP — 车道 32px 头像(@2x)
  avatarCard: string; // 256px WebP — "在车上"最大 128px 头像(@2x)
  bio?: string;
  startDate: string;
  endDate: string | null; // null = ongoing
  handoffName: string | null;
  startLocation: string;
  endLocation: string | null;
}

interface RoleLane {
  key: string; // canonical zh role string used as join key
  label: string; // localized label
  sub?: string; // secondary label in the other locale
}

interface RouteLeg {
  key: string;
  label: string; // short label, e.g. 粤 / GD
  fullName: string;
  startDate: string;
  endDate: string;
  planned: boolean; // unvisited — dates are placeholders, laid out right of the today pointer
}

interface MonthMarker {
  label: string; // 'APR', 'MAY' ...
  pct: number; // 0-100
}

interface RoleTimelineProps {
  roles: RoleLane[];
  segments: Segment[];
  monthMarkers: MonthMarker[];
  legs: RouteLeg[];
  projectStart: string;
  projectEnd: string;
  locale: 'zh' | 'en';
  t: Record<string, string>;
}

const DAY_MS = 86_400_000;

function daysBetween(a: string, b: string): number {
  const start = new Date(`${a}T00:00:00Z`).getTime();
  const end = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((end - start) / DAY_MS);
}

function pctOf(date: string, start: string, totalDays: number): number {
  const d = daysBetween(start, date);
  return (d / totalDays) * 100;
}

function formatShortDate(iso: string, locale: 'zh' | 'en'): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (locale === 'en') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  return `${d.getUTCMonth() + 1}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Minimum gap as % of timeline width to keep two avatars + labels from overlapping */
const MIN_GAP_PCT = 4;

/** Nudge close segment starts within a lane so avatars never collide — stays single-line */
function computeVisualStarts(
  segments: Segment[],
  projectStart: string,
  totalDays: number,
): Map<string, number> {
  const sorted = [...segments].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const visualMap = new Map<string, number>();
  let lastOccupied = -Infinity;

  for (const seg of sorted) {
    const actualStart = pctOf(seg.startDate, projectStart, totalDays);
    const visualStart = Math.max(actualStart, lastOccupied);
    visualMap.set(seg.id, visualStart);
    lastOccupied = visualStart + MIN_GAP_PCT;
  }

  return visualMap;
}

export default function RoleTimeline({
  roles,
  segments,
  monthMarkers,
  legs,
  projectStart,
  projectEnd,
  locale,
  t,
}: RoleTimelineProps) {
  const totalDays = useMemo(
    () => daysBetween(projectStart, projectEnd),
    [projectStart, projectEnd],
  );

  // Today position. Computed on client to stay accurate; SSR uses projectStart as a placeholder.
  const [todayPct, setTodayPct] = useState<number | null>(null);
  const [todayIso, setTodayIso] = useState<string>(projectStart);

  useEffect(() => {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const pct = Math.max(0, Math.min(100, pctOf(todayStr, projectStart, totalDays)));
    setTodayPct(pct);
    setTodayIso(todayStr);
  }, [projectStart, totalDays]);

  // Mobile horizontal scroll: auto-scroll to today on mount
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (todayPct === null || !scrollerRef.current) return;
    const el = scrollerRef.current;
    const target = (el.scrollWidth * todayPct) / 100 - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [todayPct]);

  // Group segments by role for lane rendering
  const segmentsByRole = useMemo(() => {
    const map = new Map<string, Segment[]>();
    for (const role of roles) map.set(role.key, []);
    for (const seg of segments) {
      const list = map.get(seg.role);
      if (list) list.push(seg);
    }
    return map;
  }, [roles, segments]);

  // Per-role visual start positions to prevent avatar/label overlap (single-line nudge)
  const visualStartsByRole = useMemo(() => {
    const result = new Map<string, Map<string, number>>();
    for (const [role, segs] of segmentsByRole) {
      result.set(role, computeVisualStarts(segs, projectStart, totalDays));
    }
    return result;
  }, [segmentsByRole, projectStart, totalDays]);

  // Role key → localized label lookup
  const roleLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles) map.set(r.key, r.label);
    return map;
  }, [roles]);

  // Active members (currently aboard), ordered by role then boarding date
  const activeSegments = useMemo(() => {
    const roleIndex = new Map(roles.map((r, i) => [r.key, i] as const));
    return segments
      .filter((s) => s.endDate === null)
      .sort((a, b) => {
        const ai = roleIndex.get(a.role) ?? 99;
        const bi = roleIndex.get(b.role) ?? 99;
        if (ai !== bi) return ai - bi;
        return a.startDate.localeCompare(b.startDate);
      });
  }, [segments, roles]);

  // Active members grouped by role for the "currently aboard" cards
  const activeGroups = useMemo(() => {
    const groups = new Map<string, Segment[]>();
    for (const segment of activeSegments) {
      const members = groups.get(segment.role);
      if (members) members.push(segment);
      else groups.set(segment.role, [segment]);
    }
    return Array.from(groups, ([role, members]) => ({ role, members }));
  }, [activeSegments]);

  // Last leg that has actually started — planned legs (unvisited) carry placeholder
  // dates and are laid out right of the today pointer instead of by date.
  const lastVisitedIdx = useMemo(() => {
    for (let i = legs.length - 1; i >= 0; i--) if (!legs[i].planned) return i;
    return -1;
  }, [legs]);

  // The leg the journey is currently in — its column carries down through the lanes
  const currentLegIdx = useMemo(() => {
    if (todayPct === null || lastVisitedIdx < 0) return null;
    const idx = legs.findIndex(
      (leg) => !leg.planned && todayIso >= leg.startDate && todayIso < leg.endDate,
    );
    // Between dated stops the exact leg may not contain today — fall back to the
    // most recent visited leg.
    return idx >= 0 ? idx : lastVisitedIdx;
  }, [todayPct, todayIso, legs, lastVisitedIdx]);

  const currentLegRange = useMemo(() => {
    if (todayPct === null || currentLegIdx === null) return null;
    const leg = legs[currentLegIdx];
    const startPct = Math.max(0, pctOf(leg.startDate, projectStart, totalDays));
    // The current leg is still in progress — the column reaches today, not the last stop
    const legEndPct = pctOf(leg.endDate, projectStart, totalDays);
    const endPct = Math.min(100, Math.max(startPct + 0.5, Math.max(legEndPct, todayPct)));
    return { startPct, endPct };
  }, [todayPct, currentLegIdx, legs, projectStart, totalDays]);

  // Planned legs start where the today pointer stands (SSR: end of the last visited leg).
  const plannedAnchorPct = useMemo(() => {
    if (todayPct !== null) return todayPct;
    if (lastVisitedIdx >= 0) {
      return Math.min(
        100,
        Math.max(0, pctOf(legs[lastVisitedIdx].endDate, projectStart, totalDays)),
      );
    }
    return 0;
  }, [todayPct, lastVisitedIdx, legs, projectStart, totalDays]);

  // Planned legs are near-term (weeks, not months) — they share the rest of the
  // current month instead of stretching across the whole remaining timeline.
  // Minimum span keeps the short labels readable when today is near month end.
  const plannedEndPct = useMemo(() => {
    const d = new Date(`${todayIso}T00:00:00Z`);
    const nextMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
      .toISOString()
      .slice(0, 10);
    const monthEndPct = Math.min(100, pctOf(nextMonth, projectStart, totalDays));
    return Math.min(100, Math.max(monthEndPct, plannedAnchorPct + 12));
  }, [todayIso, projectStart, totalDays, plannedAnchorPct]);

  const plannedCount = useMemo(() => legs.filter((leg) => leg.planned).length, [legs]);

  return (
    <section className="relative bg-gradient-to-b from-neutral-50 via-white to-white py-24 md:py-36 px-6 border-t border-neutral-100/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="mb-12 md:mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <motion.p
              variants={fadeUp}
              transition={springTransition}
              className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3"
            >
              {t['timeline.eyebrow']}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              transition={springTransition}
              className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight"
            >
              {t['timeline.title']}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={springTransition}
              className="text-neutral-500 mt-3 max-w-md"
            >
              {t['timeline.body']}
            </motion.p>
          </div>
          <motion.div
            variants={fadeUp}
            transition={springTransition}
            className="text-xs font-mono tabular-nums text-neutral-400 flex md:flex-col md:items-end gap-3 md:gap-1"
          >
            <span className="uppercase tracking-[0.2em]">
              {formatShortDate(projectStart, locale)} → {formatShortDate(projectEnd, locale)}
            </span>
            <span className="text-neutral-300">·</span>
            <span>{t['timeline.totalDays'].replace('{days}', String(totalDays))}</span>
          </motion.div>
        </motion.div>

        {/* Timeline scroller — horizontal scroll on mobile, full width on desktop */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          transition={springTransition}
          className="relative"
        >
          <div className="flex">
            {/* Gutter — role labels in a fixed column, stays put while the timeline scrolls */}
            <div className="w-24 md:w-28 shrink-0 border-r border-neutral-200">
              {/* Spacers mirroring the month scale + legs band heights */}
              <div className="h-7 mb-3 border-b border-neutral-200" />
              <div className="h-6 mb-3" />
              {roles.map((role) => (
                <div
                  key={role.key}
                  className="h-20 flex flex-col items-end justify-center pr-3 md:pr-4 border-b border-neutral-100 last:border-b-0"
                >
                  <span className="text-[13px] font-semibold text-neutral-800 whitespace-nowrap">
                    {role.label}
                  </span>
                  {role.sub && (
                    <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-neutral-400 mt-0.5 whitespace-nowrap">
                      {role.sub}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div
              ref={scrollerRef}
              className="flex-1 min-w-0 overflow-x-auto md:overflow-visible pb-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="relative min-w-[720px] md:min-w-0 pl-4">
                {/* Month scale */}
                <div className="relative h-7 mb-3 border-b border-neutral-200">
                  {monthMarkers.map((m) => (
                    <div
                      key={m.label}
                      className="absolute top-0 bottom-0 flex items-end pl-1.5"
                      style={{ left: `${m.pct}%` }}
                    >
                      <span className="absolute left-0 top-0 h-full w-px bg-neutral-200" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-400 pb-1">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Journey legs + lanes share a wrapper so the today line spans both */}
                <div className="relative">
                  {/* Current leg column — carries the province down through the lanes */}
                  {currentLegRange && (
                    <div
                      className="absolute top-0 bottom-0 bg-brand/[0.06] pointer-events-none"
                      style={{
                        left: `${currentLegRange.startPct}%`,
                        width: `${currentLegRange.endPct - currentLegRange.startPct}%`,
                      }}
                    />
                  )}

                  {/* Today vertical line — from the legs band down through all lanes */}
                  {todayPct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-brand z-20 pointer-events-none"
                      style={{ left: `${todayPct}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand" />
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.15em] text-brand-dark bg-white px-1.5">
                        {t['timeline.today']} · {formatShortDate(todayIso, locale)}
                      </div>
                    </div>
                  )}

                  {legs.length > 0 && (
                    <div className="relative h-6 mb-3">
                      {(() => {
                        let plannedSeen = 0;
                        return legs.map((leg, i) => {
                          const isCurrent = i === currentLegIdx;
                          let startPct: number;
                          let endPct: number;
                          if (leg.planned) {
                            // Planned legs have no real dates — fan them out evenly
                            // across the rest of the current month, right of today.
                            const plannedIdx = plannedSeen++;
                            const span = Math.max(0, plannedEndPct - plannedAnchorPct);
                            startPct = plannedAnchorPct + (span * plannedIdx) / plannedCount;
                            endPct = plannedAnchorPct + (span * (plannedIdx + 1)) / plannedCount;
                          } else {
                            startPct = Math.max(0, pctOf(leg.startDate, projectStart, totalDays));
                            // The last visited leg is still in progress — extend it to today
                            const legEndPct = pctOf(leg.endDate, projectStart, totalDays);
                            endPct = Math.min(
                              100,
                              Math.max(
                                startPct + 0.5,
                                i === lastVisitedIdx && todayPct !== null
                                  ? Math.max(legEndPct, todayPct)
                                  : legEndPct,
                              ),
                            );
                          }
                          return (
                            <div
                              key={leg.key}
                              title={leg.fullName}
                              className={`absolute top-0 bottom-0 flex items-center justify-center overflow-hidden rounded-sm ${
                                isCurrent
                                  ? 'bg-brand/25'
                                  : leg.planned
                                    ? 'bg-brand/10'
                                    : 'bg-neutral-100'
                              }`}
                              style={{
                                left: `calc(${startPct}% + 1px)`,
                                width: `calc(${endPct - startPct}% - 2px)`,
                              }}
                            >
                              <span
                                className={`text-[10px] whitespace-nowrap ${
                                  isCurrent
                                    ? 'font-semibold text-neutral-800'
                                    : leg.planned
                                      ? 'font-medium text-neutral-400'
                                      : 'font-medium text-neutral-500'
                                }`}
                              >
                                {leg.label}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* Lanes */}
                  <div className="relative">
                    {roles.map((role) => {
                      const laneSegments = segmentsByRole.get(role.key) ?? [];
                      const visualStarts = visualStartsByRole.get(role.key);

                      return (
                        <div
                          key={role.key}
                          className="relative h-20 flex items-center border-b border-neutral-100 last:border-b-0"
                        >
                          {/* Full-span rail — anchors segments so lanes with late starts don't float */}
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-neutral-100" />

                          {/* Segments */}
                          <div className="relative w-full h-full">
                            {laneSegments.map((seg) => {
                              const actualStartPct = pctOf(seg.startDate, projectStart, totalDays);
                              const startPct = visualStarts?.get(seg.id) ?? actualStartPct;
                              const endPctRaw = seg.endDate
                                ? pctOf(seg.endDate, projectStart, totalDays)
                                : (todayPct ?? startPct + 0.5);
                              const endPct = Math.max(endPctRaw, startPct + 0.5);
                              const widthPct = endPct - startPct;
                              const isOngoing = !seg.endDate;
                              const futureFadeWidthPct =
                                isOngoing && todayPct !== null && widthPct > 0
                                  ? (Math.max(0, 100 - endPct) / widthPct) * 100
                                  : 0;

                              return (
                                <div
                                  key={seg.id}
                                  className="absolute top-1/2 -translate-y-1/2 h-7 group"
                                  style={{
                                    left: `${startPct}%`,
                                    width: `${widthPct}%`,
                                  }}
                                >
                                  {/* Bar */}
                                  <div
                                    className={`absolute inset-y-2 left-0 right-0 rounded-full ${
                                      isOngoing
                                        ? 'bg-gradient-to-r from-brand to-brand/70'
                                        : 'bg-neutral-300'
                                    }`}
                                  />

                                  {/* Future fade for ongoing segments — extends past today */}
                                  {isOngoing && todayPct !== null && (
                                    <div
                                      className="absolute inset-y-2 left-full rounded-r-full"
                                      style={{
                                        width: `${futureFadeWidthPct}%`,
                                        background:
                                          'linear-gradient(to right, rgb(243 210 48 / 0.5), rgb(243 210 48 / 0))',
                                      }}
                                    />
                                  )}

                                  {/* Avatar at segment start */}
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full overflow-hidden ring-2 ring-white bg-neutral-100 z-10">
                                    <img
                                      src={seg.avatarThumb}
                                      alt={seg.name}
                                      width={32}
                                      height={32}
                                      className="w-full h-full object-cover"
                                      style={
                                        seg.crewId === 'ye-kaiwei'
                                          ? {
                                              transform: 'translateX(25%) scale(1.45)',
                                              transformOrigin: '26% 35%',
                                            }
                                          : undefined
                                      }
                                    />
                                  </div>

                                  {/* Name label — muted for alumni segments */}
                                  <div
                                    className={`absolute top-full left-0 mt-1 text-[11px] whitespace-nowrap pl-1 ${
                                      isOngoing
                                        ? 'font-medium text-neutral-700'
                                        : 'text-neutral-400'
                                    }`}
                                  >
                                    {seg.name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile scroll hint */}
          <p className="md:hidden mt-10 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            {t['timeline.scrollHint']}
          </p>
        </motion.div>

        {/* Currently aboard — grouped by role */}
        {activeGroups.length > 0 && (
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="mt-16 md:mt-20 pt-10 border-t border-neutral-200"
          >
            <motion.h3
              variants={fadeUp}
              transition={springTransition}
              className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-8"
            >
              {t['timeline.currentlyAboard']}
            </motion.h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {activeGroups.map(({ role, members }) => {
                const isSharedRole = members.length > 1;
                const memberNames = members.map((m) => m.name).join(' & ');
                const isTriple = members.length >= 3;
                const avatarClass = isTriple
                  ? 'w-20 h-20 md:w-24 md:h-24'
                  : isSharedRole
                    ? 'w-24 h-24 md:w-28 md:h-28'
                    : 'w-32 h-32';
                const gapClass = isTriple ? 'gap-2' : isSharedRole ? 'gap-4' : '';

                return (
                  <motion.div
                    key={role}
                    variants={fadeUp}
                    transition={springTransition}
                    className="group"
                  >
                    <div
                      className={`h-32 flex items-center justify-center mb-4 ${
                        isSharedRole ? gapClass : ''
                      }`}
                    >
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className={`rounded-full overflow-hidden bg-neutral-100 ring-1 ring-neutral-200 ${avatarClass}`}
                        >
                          <img
                            src={member.avatarCard}
                            alt={member.name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            style={
                              member.crewId === 'ye-kaiwei'
                                ? {
                                    transform: 'translateX(25%) scale(1.45)',
                                    transformOrigin: '26% 35%',
                                  }
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-brand-dark font-semibold mb-1.5 text-center">
                      {roleLabel.get(role) ?? role}
                    </p>
                    <h4 className="text-lg font-bold text-neutral-900 leading-tight mb-2 text-center">
                      {memberNames}
                    </h4>
                    {members[0].bio && (
                      <p className="text-sm text-neutral-600 leading-relaxed">{members[0].bio}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
