import { ChevronLeft, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CityPanel, countThemes, MapLibreCanvas, ThemeFilter } from '@/features/route-map';
import ExpeditionRidge from '@/features/route-map/ExpeditionRidge';
import {
  buildTimeline,
  countJournalsByCity,
  expeditionStats,
} from '@/features/route-map/expedition-timeline';
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
}

interface Props {
  cities: RouteCity[];
  journals: SerializedJournal[];
  locale?: Locale;
  t: Record<string, string>;
}

// Desktop: full-viewport map. Keep the route clear of the left rail (320 + margin)
// and, when it is open, the right CityPanel card (360 + margin). With no panel
// the right inset collapses — otherwise the map is shoved left and 400px of
// empty sea sits where east China should be. The ridge/river band lives outside
// the map box, so no extra bottom inset is needed.
const FIT_PADDING_WITH_PANEL = { top: 120, bottom: 40, left: 380, right: 400 };
const FIT_PADDING_NO_PANEL = { top: 120, bottom: 40, left: 380, right: 56 };

export default function RouteContent({ cities, journals, locale = 'zh', t }: Props) {
  const sortedCities = useMemo(() => [...cities].sort((a, b) => a.order - b.order), [cities]);
  const visibleCities = useMemo(
    () => sortedCities.filter((c) => !isRouteOnlyCity(c)),
    [sortedCities],
  );

  const timeline = useMemo(() => buildTimeline(sortedCities), [sortedCities]);
  const journalCounts = useMemo(() => countJournalsByCity(journals), [journals]);
  const stats = useMemo(
    () => expeditionStats(sortedCities, journals, timeline),
    [sortedCities, journals, timeline],
  );

  // Default to the latest visited city (visited === true and largest order)
  const lastVisited = useMemo(
    () => [...visibleCities].reverse().find((c) => c.visited) ?? null,
    [visibleCities],
  );

  const [selectedCityKey, setSelectedCityKey] = useState<string | null>(lastVisited?.label ?? null);

  const [activeTheme, setActiveTheme] = useState<ThemeType | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('track');
  const themeCounts = useMemo(() => countThemes(visibleCities), [visibleCities]);

  const selectedCity = useMemo(
    () => visibleCities.find((c) => c.label === selectedCityKey) ?? null,
    [visibleCities, selectedCityKey],
  );
  const fitPadding = selectedCity ? FIT_PADDING_WITH_PANEL : FIT_PADDING_NO_PANEL;

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
    // Auto expand drawer on mobile when clicking a city
    setIsDrawerExpanded(true);
  }, []);
  const clearSelection = useCallback(() => setSelectedCityKey(null), []);

  const getT = (key: string, fallback: string) => t[key] ?? fallback;

  // Drawer Animation Variants
  const drawerVariants = {
    peek: { y: 'calc(100% - 120px)' },
    expanded: { y: 0 },
  };

  const pageTitle = getT('route.pageTitle', '行程路线');
  const pageDesc = getT('route.pageDesc', '跟随柴火基地车，穿越中国 24 省 42 城。');
  const backHref = locale === 'zh' ? '/' : '/en';

  const statItems: { value: string; label: string }[] = [
    {
      value: stats.days ? String(stats.days) : '—',
      label: getT('route.stats.days', '天在路上'),
    },
    {
      value: stats.visitedKm.toLocaleString('en-US'),
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
  ];

  const viewModes: { id: MapViewMode; label: string }[] = [
    { id: 'track', label: getT('route.view.track', '足迹') },
    { id: 'vision', label: getT('route.view.vision', '愿景') },
  ];

  return (
    <div className="relative bg-neutral-50 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <div className="relative lg:min-h-0 lg:flex-1">
        {/* ── Left rail: page identity + derived numbers + view switch + theme lens.
            Mobile: an in-flow card above the map. Desktop: floats over the map's
            empty west side instead of covering the route through the middle. ── */}
        <header className="relative z-20 mt-20 mx-4 mb-2 rounded-2xl border border-neutral-200/70 bg-surface-card/85 backdrop-blur-md shadow-lg p-4 sm:mx-6 lg:absolute lg:top-24 lg:left-6 lg:mx-0 lg:mt-0 lg:mb-0 lg:w-[320px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-medium leading-relaxed">
                {pageDesc}
              </p>
            </div>
            <a
              href={backHref}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{getT('route.action.backHome', '返回首页')}</span>
            </a>
          </div>

          {/* All four numbers are derived from the stops + journals — nothing here
              is hand-maintained copy that can drift out of date. */}
          <dl className="mt-3 grid grid-cols-4 gap-2 border-y border-neutral-200 py-2.5">
            {statItems.map((s) => (
              <div key={s.label}>
                <dd className="text-[15px] font-extrabold tabular-nums leading-none text-neutral-900">
                  {s.value}
                </dd>
                <dt className="mt-1 text-[10px] leading-tight text-neutral-500">{s.label}</dt>
              </div>
            ))}
          </dl>

          {/* 视图模式互斥:一次只讲一件事。愿景模式里马年线才第一次看得清。 */}
          {/* biome-ignore lint/a11y/useSemanticElements: 这是视图切换按钮组,不是表单字段集;<fieldset> 会带来错误的表单语义 */}
          <div
            className="mt-3 flex gap-1.5"
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
              <ThemeFilter
                counts={themeCounts}
                active={activeTheme}
                onSelect={setActiveTheme}
                t={t}
              />
            </div>
          )}
        </header>

        {/* ── Map: mobile = in-flow 45vh below header; desktop = fills the row ── */}
        <div className="w-full h-[45vh] min-h-[300px] mt-4 lg:mt-0 lg:absolute lg:inset-0 lg:h-auto lg:min-h-0 lg:z-0">
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

        {/* ── Desktop: CityPanel appears on selection and can be dismissed, so the
            map's east half is not permanently covered. ── */}
        {selectedCity && (
          <div className="hidden lg:block lg:absolute lg:top-24 lg:right-6 lg:bottom-6 lg:z-20 lg:w-[360px] lg:overflow-y-auto lg:rounded-2xl lg:bg-surface-card lg:shadow-xl">
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
              journals={journals}
              timeline={timeline}
            />
          </div>
        )}
      </div>

      {/* ── Bottom band: the journey's other two axes — time/altitude/story
          density, and every story in the order it happened. ── */}
      <div className="relative z-10 mt-4 border-t border-neutral-200 bg-surface-card pt-3 pb-2 lg:mt-0 lg:flex-none">
        <ExpeditionRidge
          cities={visibleCities}
          timeline={timeline}
          journalCounts={journalCounts}
          selectedId={selectedCity?.id ?? null}
          onSelect={handleCitySelect}
          t={t}
        />
        <div className="mt-2 border-t border-neutral-200 pt-3">
          <StoryRiver
            journals={journals}
            cities={visibleCities}
            selectedId={selectedCity?.id ?? null}
            onSelect={handleCitySelect}
            t={t}
            locale={locale}
          />
        </div>
      </div>

      {/* ── Mobile: bottom drawer (desktop uses the floating card above) ── */}
      {selectedCity && !isDesktop && (
        <motion.div
          className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-surface-card/95 backdrop-blur-md border-t border-neutral-300 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
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
            className="w-full flex flex-col justify-between py-3 px-6 border-b border-neutral-300/50 cursor-pointer flex-shrink-0"
            onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsDrawerExpanded(!isDrawerExpanded);
              }
            }}
          >
            {/* Central pill handle */}
            <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />

            {/* Peek Content Bar */}
            <div className="flex items-center justify-between w-full h-[60px]">
              <div className="text-left">
                <h4 className="text-xl font-bold text-neutral-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>{selectedCity.label}</span>
                </h4>
                <p className="text-xs text-neutral-500 tabular-nums font-medium mt-0.5">
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
                  <span className="inline-flex text-[10px] tracking-wider text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded font-semibold border border-neutral-300/50">
                    {getT('route.status.origin', '出发点')}
                  </span>
                ) : selectedCity.label === lastVisited?.label ? (
                  <span className="inline-flex items-center gap-1 text-[10px] tracking-wider text-brand-foreground bg-brand px-2.5 py-1 rounded font-bold">
                    {getT('route.status.latest', '最新')}
                  </span>
                ) : selectedCity.visited ? (
                  <span className="inline-flex text-[10px] tracking-wider text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded font-semibold border border-neutral-300/50">
                    {getT('route.status.visited', '已抵达')}
                  </span>
                ) : (
                  <span className="inline-flex text-[10px] tracking-wider text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded font-semibold border border-neutral-100">
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
