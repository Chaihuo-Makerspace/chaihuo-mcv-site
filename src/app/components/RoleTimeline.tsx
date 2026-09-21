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

/** 段的最小宽度（%）：只保证 0–1 天的短段在条上还有可见的分隔，不再为容纳标签服务 */
const MIN_LEG_PCT = 1;

/** 省带条本身的高度（px） */
const LEG_BAND_BAR_H = 24;

interface LegSpan {
  startPct: number;
  endPct: number;
}

/**
 * Short legs (a 1–3 day province crossing) collapse to a few px on the 200-day
 * axis, and their borders would vanish between neighbours. So widen the short
 * ones — but around their own real centre, not by pushing everything to the
 * right: the old cascade-and-redistribute version gave every leg a minimum
 * width and took the width back from the long legs proportionally, which
 * accumulated into a 2–3 week early shift mid-route (哈密 ended up drawn under
 * 甘/宁, 西安 under 京, 哈尔滨 under 吉). Widening around the centre keeps
 * every leg within half a minimum width (≈half a day) of its true dates, and
 * the long legs stay exact. Labels are laid out separately (see legLabels) and
 * no longer depend on segment width.
 */
function expandShortLegSpans(rawSpans: LegSpan[], minPct: number): LegSpan[] {
  if (rawSpans.length === 0) return rawSpans;
  const min = Math.min(minPct, 100 / rawSpans.length);

  const spans = rawSpans.map((span, i) => {
    const width = span.endPct - span.startPct;
    if (width >= min) return { ...span };

    const center = (span.startPct + span.endPct) / 2;
    let startPct = Math.max(0, center - min / 2);
    let endPct = Math.min(100, center + min / 2);
    if (endPct - startPct < min) {
      // 顶到边界了，往另一侧补
      if (startPct <= 0) endPct = Math.min(100, min);
      else startPct = Math.max(0, endPct - min);
    }
    // 最后一段的右边缘必须留在今天（今日竖线落在它的右端）
    if (i === rawSpans.length - 1) {
      endPct = span.endPct;
      startPct = Math.max(0, endPct - min);
    }
    return { startPct, endPct };
  });

  // 对称撑开的相邻短段会互相覆盖（8 月连续 1–3 天的省份），后渲染的段会盖住
  // 前一段的分隔边界。重叠区一人一半：边界取重叠区中点，两段都仍在真实日期
  // ±半个最小宽度（≈半天）以内。
  for (let i = 1; i < spans.length; i++) {
    const prev = spans[i - 1];
    const cur = spans[i];
    if (prev.endPct <= cur.startPct) continue;
    const boundary = Math.min((prev.endPct + cur.startPct) / 2, cur.endPct - 0.3);
    if (boundary <= prev.startPct) continue;
    prev.endPct = boundary;
    cur.startPct = boundary;
  }
  return spans;
}

/** 单人车道高度（px）——保持原有观感 */
const LANE_SINGLE_ROW_H = 80;
/** 单独显示的头像保持醒目；只有竖排簇使用较小头像 */
const SINGLE_AVATAR = 36;
/** 「一起在车」的人上下错开时的行距（px） */
const CLUSTER_STEP = 34;
/** 错开时的头像直径（px）；单独在车仍是 32 */
const CLUSTER_AVATAR = 24;
/** 起动日相差不超过这么多天、且任期重叠 → 视为「一起在车」，上下错开而不是左右排开 */
const CLUSTER_DAYS = 10;

interface LaneLayout {
  /** 段 id → 相对车道中线的竖直偏移（px） */
  offsetOf: Map<string, number>;
  /** 段 id → 所在批次的人数（1 = 单独在车） */
  clusterSizeOf: Map<string, number>;
  /** 车道高度（px）：单人 80，一批人上下错开时按批大小略微撑开 */
  laneHeight: number;
}

/**
 * 同一角色同期多人此前被 4% 的防重叠间距一格一格往右推，头像+名字串成一条斜线。
 * 现在：任期重叠且上车日期接近的人只在竖直方向错开，横坐标始终由各自真实
 * 上车日期决定。同日上车的李世雯/潘石/葛子涵天然共用同一个 x；10-08 上海
 * 上车的叶雨与 10-15 无锡上车的关乃莹虽然上下错开，仍分别对齐各自的计划站点。
 * 车道只按批大小略微撑开（3 人 = 100px，不是三倍高度）。
 */
function computeLaneLayout(segments: Segment[]): LaneLayout {
  const sorted = [...segments].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const clusters: Segment[][] = [];
  let clusterStart = '';
  let clusterEnd = '';

  for (const seg of sorted) {
    const end = seg.endDate ?? '9999-12-31';
    const joinsCurrent =
      clusters.length > 0 &&
      seg.startDate < clusterEnd &&
      daysBetween(clusterStart, seg.startDate) <= CLUSTER_DAYS;
    if (!joinsCurrent) {
      clusters.push([seg]);
      clusterStart = seg.startDate;
      clusterEnd = end;
      continue;
    }
    clusters[clusters.length - 1].push(seg);
    if (end > clusterEnd) clusterEnd = end;
  }

  const offsetOf = new Map<string, number>();
  const clusterSizeOf = new Map<string, number>();
  let laneHeight = LANE_SINGLE_ROW_H;

  for (const cluster of clusters) {
    const size = cluster.length;
    for (let i = 0; i < size; i++) {
      offsetOf.set(cluster[i].id, (i - (size - 1) / 2) * CLUSTER_STEP);
      clusterSizeOf.set(cluster[i].id, size);
    }
    if (size > 1) {
      laneHeight = Math.max(laneHeight, (size - 1) * CLUSTER_STEP + CLUSTER_AVATAR + 8);
    }
  }

  return { offsetOf, clusterSizeOf, laneHeight };
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

  // 客户端拿到今天之前（SSR / 首帧）沿用「无下车日 = 在车」的旧判定，避免闪烁。
  const hasToday = todayPct !== null;

  // Mobile horizontal scroll: auto-scroll to today on mount
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (todayPct === null || !scrollerRef.current) return;
    const el = scrollerRef.current;
    const target = (el.scrollWidth * todayPct) / 100 - el.clientWidth / 2;
    // Respect prefers-reduced-motion: jump straight to today instead of smooth-scrolling.
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: Math.max(0, target), behavior: reduce ? 'auto' : 'smooth' });
  }, [todayPct]);

  // 时间轴刻度区的像素宽度：省带标签要不要上移，取决于「这一段放不放得下这个名字」，
  // 这需要把 % 换算成 px，所以量一下（SSR 时为 0，先按条内渲染）。
  const axisRef = useRef<HTMLDivElement>(null);
  const [axisWidthPx, setAxisWidthPx] = useState(0);
  useEffect(() => {
    const el = axisRef.current;
    if (!el) return;
    const measure = () => setAxisWidthPx(Math.max(0, el.clientWidth - 16)); // 容器带 pl-4
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // 车道布局：一起上车的一批人共用一条线、只在竖直方向错开（见 computeLaneLayout）
  const laneLayout = useMemo(() => {
    const result = new Map<string, LaneLayout>();
    for (const [role, segs] of segmentsByRole) {
      result.set(role, computeLaneLayout(segs));
    }
    return result;
  }, [segmentsByRole]);

  // Role key → localized label lookup
  const roleLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles) map.set(r.key, r.label);
    return map;
  }, [roles]);

  // Active members (currently aboard), ordered by role then boarding date.
  // A segment counts as aboard only when today falls inside it: a member with a scheduled future
  // disembarkAt is still aboard today, and one scheduled to board later is not aboard yet.
  // Before hydration (todayPct === null) keep the endDate-only rule so SSR output stays stable.
  const activeSegments = useMemo(() => {
    const roleIndex = new Map(roles.map((r, i) => [r.key, i] as const));
    return segments
      .filter((s) =>
        todayPct === null
          ? s.endDate === null
          : s.startDate <= todayIso && (s.endDate === null || s.endDate > todayIso),
      )
      .sort((a, b) => {
        const ai = roleIndex.get(a.role) ?? 99;
        const bi = roleIndex.get(b.role) ?? 99;
        if (ai !== bi) return ai - bi;
        return a.startDate.localeCompare(b.startDate);
      });
  }, [segments, roles, todayPct, todayIso]);

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

  // Dated legs drawn at true dates (short ones widened around their own centre so
  // labels/borders stay visible — see expandShortLegSpans), planned legs included
  // so the band and the 「已排定」 people below line up.
  const legSpans = useMemo(() => {
    const lastIdx = legs.length - 1;
    const raw: LegSpan[] = legs.map((leg, i) => {
      const startPct = Math.max(0, pctOf(leg.startDate, projectStart, totalDays));
      const legEndPct = pctOf(leg.endDate, projectStart, totalDays);
      let endPct = legEndPct;
      // 已走的最后一段拉到今天；已排定的最后一段拉到时间轴末端（项目结束）。
      // 中间那些已排定的段直接按自己的日期画 —— 和下面「已排定」的人对齐。
      if (i === lastVisitedIdx && todayPct !== null) endPct = Math.max(legEndPct, todayPct);
      if (i === lastIdx && leg.planned) endPct = 100;
      return { startPct, endPct: Math.min(100, Math.max(startPct + 0.5, endPct)) };
    });
    const spans = new Map<number, LegSpan>();
    expandShortLegSpans(raw, MIN_LEG_PCT).forEach((span, i) => {
      spans.set(i, span);
    });
    return spans;
  }, [legs, projectStart, totalDays, lastVisitedIdx, todayPct]);

  // 省带标签落位：所有省名都在条内同一行，不上移。条是相连的一整条，所以标签不被
  // 自己的段裁剪——窄段的标签横向滑到邻居段的空白处（8 月「蒙/京/黑/吉/辽」连续
  // 1–3 天的短省按真实日期比例挤在 ~100px 里，向左右的晋/津宽段借位排开）。
  // 每个标签尽量对准自己段的中心，防碰撞只往右推。
  const legLabels = useMemo(() => {
    const map = new Map<number, { leftPct: number; centerPct: number }>();
    const pxToPct = (px: number) => (axisWidthPx > 0 ? (px / axisWidthPx) * 100 : 0);
    const gapPct = pxToPct(3);
    let prevRight = Number.NEGATIVE_INFINITY; // 上一个标签占到的右缘

    legs.forEach((leg, i) => {
      const span = legSpans.get(i);
      if (!span) return;
      const ascii = /^[\x20-\x7f]+$/.test(leg.label);
      const textPct = pxToPct(leg.label.length * (ascii ? 8 : 12) + 4);
      const centerPct = (span.startPct + span.endPct) / 2;
      const leftPct = Math.min(
        Math.max(centerPct - textPct / 2, prevRight + gapPct, 0),
        100 - textPct,
      );
      prevRight = Math.max(prevRight, leftPct + textPct);
      map.set(i, { leftPct, centerPct });
    });

    return { map };
  }, [legs, legSpans, axisWidthPx]);

  const legBandHeightPx = LEG_BAND_BAR_H;

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
    const span = legSpans.get(currentLegIdx);
    if (!span) return null;
    // Keep the (linear) today line inside the column even after warping
    return {
      startPct: Math.min(span.startPct, Math.max(0, todayPct - 0.5)),
      endPct: Math.min(100, Math.max(span.endPct, todayPct)),
    };
  }, [todayPct, currentLegIdx, legSpans]);

  // Planned legs are drawn at their own dates now, so they need no separate anchor.

  return (
    <section className="relative bg-gradient-to-b from-neutral-50 via-white to-white pt-16 md:pt-24 pb-24 md:pb-36 border-t border-neutral-100/50">
      <div className="page-rail">
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
            <span className="text-neutral-300" aria-hidden="true">
              ·
            </span>
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
              <div className="mb-3" style={{ height: legBandHeightPx }} />
              {roles.map((role) => (
                <div
                  key={role.key}
                  className="flex flex-col items-end justify-center pr-3 md:pr-4 border-b border-neutral-100 last:border-b-0"
                  style={{ height: laneLayout.get(role.key)?.laneHeight ?? LANE_SINGLE_ROW_H }}
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
              <div className="relative min-w-[720px] md:min-w-0 pl-4" ref={axisRef}>
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
                    <div className="relative mb-3" style={{ height: legBandHeightPx }}>
                      {/* 省带条：真实日期比例，段与段相连成一整条（窄段以真实中心为准对称撑开） */}
                      <div
                        className="absolute inset-x-0 bottom-0 overflow-hidden rounded-md"
                        style={{ height: LEG_BAND_BAR_H }}
                      >
                        {legs.map((leg, i) => {
                          const isCurrent = i === currentLegIdx;
                          // 真实日期比例（含已排定的段；窄段已对称撑开，见 expandShortLegSpans）
                          const span = legSpans.get(i);
                          const startPct = span?.startPct ?? 0;
                          const endPct = span?.endPct ?? startPct + 0.5;
                          return (
                            <div
                              key={`${leg.key}-${leg.startDate}`}
                              title={leg.fullName}
                              data-route-leg-start-date={leg.startDate}
                              data-route-leg-planned={leg.planned ? 'true' : 'false'}
                              className={`absolute inset-y-0 ${
                                i > 0 ? 'border-l border-white' : ''
                              } ${
                                isCurrent
                                  ? 'bg-brand/25'
                                  : leg.planned
                                    ? 'bg-brand/10'
                                    : 'bg-neutral-100'
                              }`}
                              style={{
                                left: `${startPct}%`,
                                width: `${endPct - startPct}%`,
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* 标签层：所有省名在条内同一行，不被段裁剪；窄段的标签横向滑到邻居空白处 */}
                      <div
                        className="absolute inset-x-0 bottom-0 pointer-events-none"
                        style={{ height: LEG_BAND_BAR_H }}
                      >
                        {legs.map((leg, i) => {
                          const placement = legLabels.map.get(i);
                          if (!placement) return null;
                          const isCurrent = i === currentLegIdx;
                          return (
                            <span
                              key={`label-${leg.key}-${leg.startDate}`}
                              className={`absolute top-1/2 -translate-y-1/2 text-[11px] whitespace-nowrap ${
                                isCurrent
                                  ? 'font-semibold text-neutral-800'
                                  : leg.planned
                                    ? 'font-medium text-neutral-400'
                                    : 'font-medium text-neutral-600'
                              }`}
                              style={{ left: `${placement.leftPct}%` }}
                            >
                              {leg.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lanes */}
                  <div className="relative">
                    {roles.map((role) => {
                      const laneSegments = segmentsByRole.get(role.key) ?? [];
                      const layout = laneLayout.get(role.key);
                      const laneHeight = layout?.laneHeight ?? LANE_SINGLE_ROW_H;
                      const railTop = laneHeight / 2;
                      return (
                        <div
                          key={role.key}
                          className="relative border-b border-neutral-100 last:border-b-0"
                          style={{ height: laneHeight }}
                        >
                          {/* 一条基线：一起上车的人共用这条线，只在竖直方向上下错开 */}
                          <div
                            className="absolute inset-x-0 -translate-y-1/2 h-1.5 rounded-full bg-neutral-100"
                            style={{ top: railTop }}
                          />

                          {/* Segments */}
                          <div className="relative w-full h-full">
                            {laneSegments.map((seg) => {
                              const startPct = pctOf(seg.startDate, projectStart, totalDays);
                              const endPctRaw = seg.endDate
                                ? pctOf(seg.endDate, projectStart, totalDays)
                                : (todayPct ?? startPct + 0.5);
                              const endPct = Math.max(endPctRaw, startPct + 0.5);
                              const widthPct = endPct - startPct;

                              // 任期三态：今天落在段内 = 在车（黄bar，今天之后渐隐）；段已走完 = 卸任（灰）；
                              // 段还没开始 = 已排定（淡黄）。旧写法只看 endDate === null，于是给在车成员
                              // 排定未来下车日后（黄夏 10-08、叶雨/关乃莹 10-31），他会当场被画成已卸任。
                              const isPastTerm = hasToday
                                ? seg.endDate !== null && seg.endDate <= todayIso
                                : seg.endDate !== null;
                              const isFutureTerm = hasToday && seg.startDate > todayIso;
                              const isCurrentTerm = !isPastTerm && !isFutureTerm;
                              // 任期重叠且上车日期接近的人只在竖直方向错开；横坐标保留真实日期
                              const avatarOffset = layout?.offsetOf.get(seg.id) ?? 0;
                              const inCluster = (layout?.clusterSizeOf.get(seg.id) ?? 1) > 1;
                              // 奇数人数的中间头像落在 bar 中线上；姓名移到半行空档，避免压在线上。
                              const clusterNameOffset =
                                inCluster && avatarOffset === 0 ? CLUSTER_STEP / 2 : 0;
                              const solidEndPct =
                                isCurrentTerm && todayPct !== null
                                  ? Math.min(endPct, todayPct)
                                  : endPct;
                              const solidWidthPct =
                                widthPct > 0 ? ((solidEndPct - startPct) / widthPct) * 100 : 100;
                              // 已排定的未来任期：今天之后的部分渐隐（未定结束日的渐隐延伸到轴末端）
                              const termFadeWidthPct =
                                isCurrentTerm && widthPct > 0
                                  ? (Math.max(0, endPct - solidEndPct) / widthPct) * 100
                                  : 0;
                              const futureFadeWidthPct =
                                isCurrentTerm && !seg.endDate && todayPct !== null && widthPct > 0
                                  ? (Math.max(0, 100 - endPct) / widthPct) * 100
                                  : 0;

                              // 悬停浮层：上车/下车的地点与时间此前从未渲染（handoffName / endLocation 传了但没用）
                              const hasHandoff = Boolean(seg.handoffName);
                              const endPart = !seg.endDate
                                ? locale === 'en'
                                  ? 'still aboard'
                                  : '至今在车'
                                : `${seg.endLocation ?? ''} ${formatShortDate(seg.endDate as string, locale)}${
                                    hasHandoff
                                      ? locale === 'en'
                                        ? ` (handed over to ${seg.handoffName})`
                                        : ` · 交接给 ${seg.handoffName}`
                                      : locale === 'en'
                                        ? ' (term ended)'
                                        : ' · 任期结束'
                                  }`;
                              const segmentTitle = `${seg.name} · ${seg.role}${locale === 'en' ? ': ' : '：'}${
                                seg.startLocation
                              } ${formatShortDate(seg.startDate, locale)} → ${endPart}${
                                isFutureTerm
                                  ? locale === 'en'
                                    ? ' (scheduled, not aboard yet)'
                                    : '（已排定，尚未上车）'
                                  : ''
                              }`;

                              // 不能用 -translate-y-1/2 居中：transform 会让段容器成为堆叠上下文，
                              // 把头像的 z-30 困在本段内，同日上车、后渲染的兄弟段（如葛子涵）的
                              // 黄条会盖住中间成员（潘石）的头像。改用 top 直接定位（h-7 = 28px，
                              // 半高 14），头像的 z-30 在车道层面生效，始终压过同车道的黄条。
                              return (
                                <div
                                  key={seg.id}
                                  title={segmentTitle}
                                  data-timeline-start-date={seg.startDate}
                                  data-timeline-crew-id={seg.crewId}
                                  data-timeline-clustered={inCluster ? 'true' : 'false'}
                                  className="absolute h-7 group"
                                  style={{
                                    left: `${startPct}%`,
                                    width: `${widthPct}%`,
                                    top: railTop - 14,
                                  }}
                                >
                                  {/* Bar — 已排定的未来任期：淡黄底，表示还没上车 */}
                                  {isFutureTerm ? (
                                    <div
                                      data-timeline-bar
                                      className="absolute inset-y-2 left-0 right-0 rounded-full bg-brand/15"
                                    />
                                  ) : (
                                    <div
                                      data-timeline-bar
                                      className={`absolute inset-y-2 left-0 rounded-full ${
                                        isPastTerm
                                          ? 'bg-neutral-300'
                                          : 'bg-gradient-to-r from-brand to-brand/70'
                                      }`}
                                      style={{ width: isPastTerm ? '100%' : `${solidWidthPct}%` }}
                                    />
                                  )}

                                  {/* 今天之后的已排定任期：渐隐；未定结束日的渐隐延伸到轴末端 */}
                                  {isCurrentTerm && todayPct !== null && (
                                    <>
                                      {termFadeWidthPct > 0 && (
                                        <div
                                          className="absolute inset-y-2 right-0 rounded-r-full"
                                          style={{
                                            left: `${solidWidthPct}%`,
                                            background:
                                              'linear-gradient(to right, rgb(243 210 48 / 0.5), rgb(243 210 48 / 0))',
                                          }}
                                        />
                                      )}
                                      {futureFadeWidthPct > 0 && (
                                        <div
                                          className="absolute inset-y-2 left-full rounded-r-full"
                                          style={{
                                            width: `${futureFadeWidthPct}%`,
                                            background:
                                              'linear-gradient(to right, rgb(243 210 48 / 0.5), rgb(243 210 48 / 0))',
                                          }}
                                        />
                                      )}
                                    </>
                                  )}

                                  {/* Avatar + 名字：同一批一起上车的人上下错开；横条仍在同一条线上 */}
                                  <div
                                    className="absolute left-0 z-30"
                                    style={{ top: `calc(50% + ${avatarOffset}px)` }}
                                  >
                                    <div
                                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 rounded-full overflow-hidden ring-2 ring-white bg-neutral-100 ${
                                        inCluster ? 'w-6 h-6' : 'w-9 h-9'
                                      }`}
                                    >
                                      <img
                                        src={seg.avatarThumb}
                                        alt={seg.name}
                                        width={inCluster ? CLUSTER_AVATAR : SINGLE_AVATAR}
                                        height={inCluster ? CLUSTER_AVATAR : SINGLE_AVATAR}
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
                                      data-timeline-name
                                      className={`absolute whitespace-nowrap ${
                                        inCluster
                                          ? '-translate-y-1/2 rounded-sm bg-surface-card/90 px-1 py-0.5 text-[10px]'
                                          : 'pl-1 text-[11px]'
                                      } ${
                                        isCurrentTerm
                                          ? 'font-medium text-neutral-700'
                                          : 'text-neutral-400'
                                      }`}
                                      style={
                                        inCluster
                                          ? { left: 14, top: clusterNameOffset }
                                          : { left: 0, top: 20 }
                                      }
                                    >
                                      {seg.name}
                                    </div>
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
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
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
                    className="group w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(25%-1.5rem)]"
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
                            className="w-full h-full object-cover"
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
