import { ChevronLeft, MapPin, PanelRightOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CityPanel, countThemes, MapLibreCanvas, ThemeFilter } from '@/features/route-map';
import { buildTimeline, expeditionStats } from '@/features/route-map/expedition-timeline';
import type { MapViewMode } from '@/features/route-map/MapLibreCanvas';
import StoryRiver from '@/features/route-map/StoryRiver';
import type { ThemeType } from '@/features/route-map/theme';
import { isRouteOnlyCity, type RouteCity } from '@/features/route-map/types';
import type { Locale } from '@/i18n/index';

interface SerializedJournal {
  slug: string;
  title: string;
  date: string;
  status: string;
  city: string;
  href?: string;
  coverImage?: string;
  coverThumb?: string;
  coverCard?: string;
}

interface Props {
  cities: RouteCity[];
  journals: SerializedJournal[];
  locale?: Locale;
  t: Record<string, string>;
}

// Desktop: full-width map under a slim topbar. Keep the route clear of the
// floating view/theme chip group at the top-left and, when it is open, the
// right CityPanel card (360 + margin). A collapsed panel is only a 48px strip,
// so the map reclaims the space; with no panel the right inset collapses too —
// otherwise the map is shoved left and 400px of empty sea sits where east China
// should be. The river band lives outside the map box, so no extra bottom inset.
const FIT_PADDING_WITH_PANEL = { top: 130, bottom: 40, left: 56, right: 400 };
const FIT_PADDING_COLLAPSED = { top: 130, bottom: 40, left: 56, right: 80 };
const FIT_PADDING_NO_PANEL = { top: 130, bottom: 40, left: 56, right: 56 };

export default function RouteContent({ cities, journals, locale = 'zh', t }: Props) {
  const sortedCities = useMemo(() => [...cities].sort((a, b) => a.order - b.order), [cities]);
  const visibleCities = useMemo(
    () => sortedCities.filter((c) => !isRouteOnlyCity(c)),
    [sortedCities],
  );

  const timeline = useMemo(() => buildTimeline(sortedCities), [sortedCities]);
  const stats = useMemo(
    () => expeditionStats(sortedCities, journals, timeline),
    [sortedCities, journals, timeline],
  );

  const lastVisited = useMemo(
    () => [...visibleCities].reverse().find((c) => c.visited) ?? null,
    [visibleCities],
  );

  // Panel starts closed: the map's current-position pulse carries "where are
  // we now"; the panel opens on pin/marker/river click.
  const [selectedCityKey, setSelectedCityKey] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const [activeTheme, setActiveTheme] = useState<ThemeType | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('track');
  const themeCounts = useMemo(() => countThemes(visibleCities), [visibleCities]);

  const selectedCity = useMemo(
    () => visibleCities.find((c) => c.label === selectedCityKey) ?? null,
    [visibleCities, selectedCityKey],
  );
  const fitPadding = !selectedCity
    ? FIT_PADDING_NO_PANEL
    : isPanelCollapsed
      ? FIT_PADDING_COLLAPSED
      : FIT_PADDING_WITH_PANEL;

  // Mobile Drawer expanded state
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  // The mobile bottom drawer is display:none on desktop (lg:hidden) but was still
  // mounted, doubling the CityPanel render cost during hydration. Mount it only
  // below the lg breakpoint. Initial false matches SSR (drawer present).
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleCitySelect = useCallback((key: string) => {
    setSelectedCityKey(key);
    setIsPanelCollapsed(false);
    // Auto expand drawer on mobile when clicking a city
    setIsDrawerExpanded(true);
  }, []);
  const clearSelection = useCallback(() => {
    setSelectedCityKey(null);
    setIsPanelCollapsed(false);
  }, []);

  const getT = (key: string, fallback: string) => t[key] ?? fallback;

  // Drawer Animation Variants
  const drawerVariants = {
    peek: { y: 'calc(100% - 120px)' },
    expanded: { y: 0 },
  };

  const pageTitle = getT('route.pageTitle', '行程路线');
  const pageDesc = getT('route.pageDesc', '柴火基地车在中国地图上走过的路。');
  const backHref = locale === 'zh' ? '/' : '/en';

  // All five numbers are derived from the stops + journals — nothing here is
  // hand-maintained copy that can drift out of date.
  const statItems: { value: string; label: string }[] = [
    {
      value: stats.days ? String(stats.days) : '—',
      label: getT('route.stats.days', '天在路上'),
    },
    {
      value: `${stats.visitedKm}+`,
      label: getT('route.stats.km', '公里'),
    },
    {
      value: `${stats.visitedCities}/${stats.cities}`,
      label: getT('route.stats.cities', '城'),
    },
    {
      value: String(stats.journals),
      label: getT('route.stats.journals', '篇日记'),
    },
    {
      value: Math.round(stats.maxAltitude).toLocaleString('en-US'),
      label: getT('route.stats.maxAlt', '最高海拔(m)'),
    },
  ];

  const viewModes: { id: MapViewMode; label: string }[] = [
    { id: 'track', label: getT('route.view.track', '足迹') },
    { id: 'vision', label: getT('route.view.vision', '愿景') },
  ];

  // 视图模式互斥:一次只讲一件事。愿景模式里马年线才第一次看得清。
  const viewToggle = (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: 这是视图切换按钮组,不是表单字段集;<fieldset> 会带来错误的表单语义 */}
      <div
        className="flex gap-1.5"
        role="group"
        aria-label={getT('route.view.ariaGroup', '地图视图模式')}
      >
        {viewModes.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={viewMode === m.id}
            title={m.id === 'vision' ? getT('route.view.visionHint', '') : undefined}
            onClick={() => setViewMode(m.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
              viewMode === m.id
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {viewMode === 'vision' && (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          {getT('route.view.visionHint', '2026 全年路程走成一匹马')}
        </p>
      )}

      {viewMode === 'track' && (
        <div className="mt-2">
          <ThemeFilter counts={themeCounts} active={activeTheme} onSelect={setActiveTheme} t={t} />
        </div>
      )}
    </>
  );

  return (
    <div className="relative bg-neutral-50 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      {/* ── Desktop topbar: page identity + derived numbers in one slim row
          under the site nav. Replaces the floating 320px left rail, so the map
          spans the full width. Mobile keeps the in-flow header card below. ── */}
      <header className="hidden lg:flex lg:items-baseline lg:gap-6 lg:px-6 lg:pt-20 lg:pb-2 lg:border-b lg:border-neutral-200 lg:bg-surface-card lg:z-20">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="whitespace-nowrap text-lg font-extrabold tracking-tight text-neutral-900">
            {pageTitle}
          </h1>
          <p className="truncate text-xs font-medium text-neutral-500">{pageDesc}</p>
        </div>
        <dl className="ml-auto flex flex-none items-baseline gap-6">
          {statItems.map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <dd className="text-sm font-extrabold tabular-nums leading-none text-neutral-900">
                {s.value}
              </dd>
              <dt className="text-[10px] leading-tight text-neutral-500">{s.label}</dt>
            </div>
          ))}
        </dl>
        <a
          href={backHref}
          className="inline-flex flex-none items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-600 shadow-sm transition-colors duration-200 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>{getT('route.action.backHome', '返回首页')}</span>
        </a>
      </header>

      <div className="relative lg:min-h-0 lg:flex-1">
        {/* ── Mobile in-flow header card (desktop uses the topbar above) ── */}
        <header className="relative z-20 mx-4 mt-20 mb-2 rounded-2xl border border-neutral-200/70 bg-surface-card/85 p-4 shadow-lg backdrop-blur-md sm:mx-6 lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 md:text-2xl">
                {pageTitle}
              </h1>
              <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-500">
                {pageDesc}
              </p>
            </div>
            <a
              href={backHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 shadow-sm transition-colors duration-200 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{getT('route.action.backHome', '返回首页')}</span>
            </a>
          </div>

          <dl className="mt-3 grid grid-cols-5 gap-2 border-y border-neutral-200 py-2.5">
            {statItems.map((s) => (
              <div key={s.label}>
                <dd className="text-[15px] font-extrabold tabular-nums leading-none text-neutral-900">
                  {s.value}
                </dd>
                <dt className="mt-1 text-[10px] leading-tight text-neutral-500">{s.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-3">{viewToggle}</div>
        </header>

        {/* ── Desktop: view-mode toggle + theme lens as a compact floating chip
            group at the map's top-left (the rail's controls, nothing else). ── */}
        <div className="hidden lg:absolute lg:left-6 lg:top-4 lg:z-20 lg:block lg:w-[248px] lg:rounded-2xl lg:border lg:border-neutral-200/70 lg:bg-surface-card/85 lg:p-3 lg:shadow-lg lg:backdrop-blur-md">
          {viewToggle}
        </div>

        {/* ── Map: mobile = in-flow 45vh below header; desktop = fills the row ── */}
        <div className="mt-4 h-[45vh] min-h-[300px] w-full lg:absolute lg:inset-0 lg:mt-0 lg:h-auto lg:min-h-0 lg:z-0">
          <MapLibreCanvas
            cities={cities}
            selectedKey={selectedCityKey}
            onSelect={handleCitySelect}
            activeTheme={activeTheme}
            journals={journals}
            viewMode={viewMode}
            fitPadding={fitPadding}
            t={t}
          />
        </div>

        {/* ── Desktop: CityPanel appears on selection and can be dismissed or
            collapsed to a 48px strip, so the map's east half is not permanently
            covered. ── */}
        {selectedCity && !isPanelCollapsed && (
          <div className="hidden lg:absolute lg:bottom-6 lg:right-6 lg:top-4 lg:z-20 lg:block lg:w-[360px] lg:overflow-y-auto lg:rounded-2xl lg:bg-surface-card lg:shadow-xl">
            <CityPanel
              city={selectedCity}
              cities={visibleCities}
              totalLegs={visibleCities.length - 1}
              isLatest={selectedCity.label === lastVisited?.label}
              t={t}
              locale={locale}
              hero={false}
              onSelectCity={handleCitySelect}
              onClose={clearSelection}
              onCollapse={() => setIsPanelCollapsed(true)}
              journals={journals}
              timeline={timeline}
            />
          </div>
        )}
        {selectedCity && isPanelCollapsed && (
          <div className="hidden lg:absolute lg:bottom-6 lg:right-6 lg:top-4 lg:z-20 lg:flex lg:w-12 lg:flex-col lg:items-center lg:gap-3 lg:rounded-2xl lg:border lg:border-neutral-200/70 lg:bg-surface-card lg:py-3 lg:shadow-xl">
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(false)}
              aria-label={getT('route.action.expand', '展开面板')}
              title={getT('route.action.expand', '展开面板')}
              className="rounded-full p-1 text-neutral-400 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
            <span className="select-none text-xs font-bold tracking-widest text-neutral-700 [writing-mode:vertical-rl]">
              {selectedCity.label}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom band: every story in the order — and at the time — it
          happened. ── */}
      <div className="relative z-10 mt-4 border-t border-neutral-200 bg-surface-card pt-3 pb-2 lg:mt-0 lg:flex-none">
        <StoryRiver
          journals={journals}
          cities={visibleCities}
          selectedId={selectedCity?.id ?? null}
          onSelect={handleCitySelect}
          t={t}
          locale={locale}
        />
      </div>

      {/* ── Mobile: bottom drawer (desktop uses the floating card above) ── */}
      {selectedCity && !isDesktop && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-3xl border-t border-neutral-300 bg-surface-card/95 shadow-2xl backdrop-blur-md lg:hidden"
          style={{ height: '75vh' }}
          variants={drawerVariants}
          animate={isDrawerExpanded ? 'expanded' : 'peek'}
          drag="y"
          dragConstraints={{ top: -500, bottom: 500 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            // Expand if dragged upwards significantly, collapse if dragged down
            if (info.offset.y < -50) {
              setIsDrawerExpanded(true);
            } else if (info.offset.y > 50) {
              setIsDrawerExpanded(false);
            }
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        >
          {/* Drawer Drag Handle bar (120px Peek height including padding) */}
          {/* biome-ignore lint/a11y/useSemanticElements: 把手内含 h4/图标等块级内容,原生 <button> 不能容纳;role="button" + tabIndex + onKeyDown 是恰当的可访问模式 */}
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isDrawerExpanded}
            className="flex w-full flex-shrink-0 cursor-pointer flex-col justify-between border-b border-neutral-300/50 px-6 py-3"
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsDrawerExpanded(!isDrawerExpanded);
              }
            }}
          >
            {/* Central pill handle */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300" />

            {/* Peek Content Bar */}
            <div className="flex h-[60px] w-full items-center justify-between">
              <div className="text-left">
                <h4 className="flex items-center gap-1.5 text-xl font-bold text-neutral-900">
                  <MapPin className="h-4 w-4 text-brand" />
                  <span>{selectedCity.label}</span>
                </h4>
                <p className="mt-0.5 text-xs font-medium tabular-nums text-neutral-500">
                  {[
                    timeline.get(selectedCity.id)?.day
                      ? (t['route.panel.day'] ?? '第 {n} 天').replace(
                          '{n}',
                          String(timeline.get(selectedCity.id)?.day),
                        )
                      : null,
                    `${selectedCity.altitude}m`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              {/* Status indicator chip */}
              <div>
                {selectedCity.isOrigin ? (
                  <span className="inline-flex rounded border border-neutral-300/50 bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-neutral-700">
                    {getT('route.status.origin', '出发点')}
                  </span>
                ) : selectedCity.label === lastVisited?.label ? (
                  <span className="inline-flex items-center gap-1 rounded bg-brand px-2.5 py-1 text-[10px] font-bold tracking-wider text-brand-foreground">
                    {getT('route.status.latest', '最新')}
                  </span>
                ) : selectedCity.visited ? (
                  <span className="inline-flex rounded border border-neutral-300/50 bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-neutral-700">
                    {getT('route.status.visited', '已抵达')}
                  </span>
                ) : (
                  <span className="inline-flex rounded border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-neutral-500">
                    {getT('route.status.planned', '计划中')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Expanded Details */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-12">
            <CityPanel
              city={selectedCity}
              cities={visibleCities}
              totalLegs={visibleCities.length - 1}
              isLatest={selectedCity.label === lastVisited?.label}
              t={t}
              locale={locale}
              hero={false}
              onSelectCity={handleCitySelect}
              journals={journals}
              timeline={timeline}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
