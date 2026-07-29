import {
  Activity,
  ArrowUpRight,
  Cpu,
  Image as ImageIcon,
  MapPin,
  Mountain,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Locale } from '@/i18n/index';
import { localePath } from '@/i18n/index';
import ExpeditionLog from './ExpeditionLog';
import PeopleStrip from './PeopleStrip';
import PhotoStrip from './PhotoStrip';
import type { RouteCity } from './types';

interface SerializedJournal {
  slug: string;
  title: string;
  date: string;
  status: string;
  city: string;
  href?: string;
  coverImage?: string;
}

// SVG 高度图尺寸与内边距 —— 纯常量,放在组件外,避免被 useMemo 当作依赖项
const svgW = 460;
const svgH = 85;
const paddingLeft = 30;
const paddingRight = 16;
const paddingTop = 12;
const paddingBottom = 20;
const plotW = svgW - paddingLeft - paddingRight;
const plotH = svgH - paddingTop - paddingBottom;

export default function CityPanel({
  city,
  cities,
  totalLegs,
  isLatest,
  t,
  locale = 'zh',
  hero = false,
  onSelectCity,
  journals,
}: {
  city: RouteCity | null;
  cities: RouteCity[];
  totalLegs: number;
  isLatest: boolean;
  t: Record<string, string>;
  locale?: Locale;
  hero?: boolean;
  onSelectCity?: (label: string) => void;
  journals?: SerializedJournal[];
}) {
  const getT = (key: string, fallback: string) => {
    return t[key] ?? fallback;
  };

  // 1. 过滤并计算海拔高程数据点，展示基准的横向行程断面
  const elevationCities = useMemo(() => {
    return cities.filter((c) => c.altitude != null);
  }, [cities]);

  // 纵轴上限按实际最高站点取整（邦达 4120m → 4500m），避免高点画出图外
  const maxAlt = useMemo(() => {
    const max = Math.max(0, ...elevationCities.map((c) => parseFloat(c.altitude) || 0));
    return Math.max(500, Math.ceil((max + 100) / 500) * 500);
  }, [elevationCities]);

  // 映射高程坐标点
  const points = useMemo(() => {
    if (elevationCities.length === 0) return [];
    return elevationCities.map((c, i) => {
      const x =
        elevationCities.length > 1
          ? paddingLeft + (i * plotW) / (elevationCities.length - 1)
          : paddingLeft + plotW / 2;
      const alt = parseFloat(c.altitude) || 0;
      const y = svgH - paddingBottom - (alt / maxAlt) * plotH;
      return {
        x,
        y,
        city: c,
        alt,
      };
    });
  }, [elevationCities, maxAlt]);

  // 生成剖面线与区域填充路径
  const lineD = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  // 海拔网格基准线（随纵轴上限取 500/1000 步长）
  const gridLines = useMemo(() => {
    const step = maxAlt > 2000 ? 1000 : 500;
    const alts: number[] = [];
    for (let alt = step; alt < maxAlt; alt += step) alts.push(alt);
    return alts.map((alt) => {
      const y = svgH - paddingBottom - (alt / maxAlt) * plotH;
      return { alt, y };
    });
  }, [maxAlt]);

  // Filter journals for this city
  const cityJournals = useMemo(() => {
    if (!journals || !city) return [];
    return journals.filter((j) => j.city === city.id);
  }, [journals, city]);

  // The latest visited stop drives both the badge and the elevation-chart label
  const lastVisitedLabel = useMemo(
    () => [...cities].reverse().find((c) => c.visited)?.label ?? null,
    [cities],
  );

  if (!city) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center px-6 py-12 ${hero ? 'min-h-[200px]' : 'min-h-[320px] h-full'}`}
      >
        <MapPin className="w-6 h-6 text-neutral-300 mb-3" />
        <p className="text-sm text-neutral-500 max-w-[36ch] leading-relaxed">
          {getT(
            'journal.empty',
            getT('route.journals.empty', '点击地图上的城市，查看那一程的现场记录。'),
          )}
        </p>
      </div>
    );
  }

  const visibleLegNumber = Math.max(
    0,
    cities.findIndex((c) => c.id === city.id),
  );
  const legCounter = city.isOrigin
    ? null
    : (t['journal.legCounter'] ?? '{n} / {total}')
        .replace('{n}', String(visibleLegNumber))
        .replace('{total}', String(totalLegs));

  return (
    <div className={`w-full ${hero ? 'p-6 md:p-8' : 'p-6 md:p-7'}`}>
      <article
        className={`w-full flex flex-col gap-8 items-stretch ${hero ? 'lg:flex-row lg:gap-10' : ''}`}
      >
        {/* 左侧栏：行程日志 + 海拔高度断面图 */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <header className="mb-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {legCounter && (
                  <span className="inline-flex items-center text-[10px] uppercase tracking-[0.18em] text-neutral-500 border border-neutral-300 px-2 py-0.5 rounded-sm">
                    {legCounter}
                  </span>
                )}
                {isLatest && !city.isOrigin && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-brand-foreground bg-brand px-2 py-0.5 rounded-sm font-semibold">
                    {getT('journal.latest', getT('route.status.latest', '最新'))}
                  </span>
                )}
                {city.isOrigin && (
                  <span className="inline-flex items-center text-[10px] uppercase tracking-[0.18em] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm font-semibold">
                    {getT('journal.origin', getT('route.status.origin', '出发点'))}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <h3
                  className={`font-bold text-neutral-900 leading-tight ${hero ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}
                >
                  {city.label}
                </h3>
                {city.event?.date && (
                  <p className="font-mono text-xs text-neutral-500 tracking-wider">
                    {city.event.date}
                  </p>
                )}
              </div>
            </header>

            {/* 航行日志:越界钩子 + 新世界 + 火种 */}
            {city.expedition && (
              <div className="mb-6">
                <ExpeditionLog expedition={city.expedition} locale={locale} />
              </div>
            )}

            {/* 新文明 */}
            {city.people && city.people.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-brand-dark" />
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {locale === 'zh' ? '新文明 · 遇见的人' : 'NEW CIVILIZATIONS'}
                  </h5>
                </div>
                <PeopleStrip people={city.people} />
              </div>
            )}

            {/* 剧照 */}
            {city.photos && city.photos.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-brand-dark" />
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {locale === 'zh' ? '剧照' : 'FROM THE FIELD'}
                  </h5>
                </div>
                <PhotoStrip photos={city.photos} />
              </div>
            )}

            {/* 行程海拔剖面图（横向高度断面，反映地理阶梯的攀爬过程） */}
            <div className="mb-6 bg-neutral-50 border border-neutral-300/50 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 font-semibold flex items-center gap-1 font-mono flex-shrink-0">
                  <Mountain className="w-3 h-3 text-brand-dark" />
                  {getT(
                    'route.telemetry.elevationProfile',
                    locale === 'zh' ? '海拔高度纵断面' : 'EXPEDITION ELEVATION PROFILE',
                  )}
                </h4>
                <span
                  className="text-[10px] text-brand-dark font-mono font-bold truncate min-w-0 text-right"
                  title={city.terrainStep || undefined}
                >
                  {getT('route.telemetry.currentElevation', locale === 'zh' ? '当前海拔' : 'Elev')}:{' '}
                  {city.altitude}m{city.terrainStep ? ` · ${city.terrainStep}` : ''}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label={locale === 'zh' ? '海拔高度纵断面图' : 'Elevation profile chart'}
              >
                <title>{locale === 'zh' ? '海拔高度纵断面图' : 'Elevation profile chart'}</title>
                {/* 阶梯基准线 */}
                {gridLines.map((g) => (
                  <g key={g.alt} opacity={0.6}>
                    <line
                      x1={paddingLeft}
                      y1={g.y}
                      x2={svgW - paddingRight}
                      y2={g.y}
                      stroke="var(--neutral-300)"
                      strokeWidth={0.5}
                      strokeDasharray="2 3"
                    />
                    <text
                      x={paddingLeft - 4}
                      y={g.y + 2.5}
                      fontSize={8}
                      fill="var(--neutral-500)"
                      textAnchor="end"
                      className="font-mono"
                    >
                      {g.alt}m
                    </text>
                  </g>
                ))}

                {/* 海拔渐变阴影填充，反映山岳厚重感 */}
                <path
                  d={`${lineD} L ${points[points.length - 1]?.x ?? 0} ${svgH - paddingBottom} L ${points[0]?.x ?? 0} ${svgH - paddingBottom} Z`}
                  fill="url(#elevation-grad)"
                  opacity={0.1}
                />

                {/* 未驶过的计划航线（中性虚线） */}
                <path
                  d={lineD}
                  fill="none"
                  stroke="var(--neutral-300)"
                  strokeWidth={1.2}
                  strokeDasharray="1.5 2"
                />

                {/* 已驶过航线实线（展示行车进度） */}
                <path
                  d={(() => {
                    const visitedPts = points.filter(
                      (p) => p.city.visited || p.city.label === city.label,
                    );
                    if (visitedPts.length === 0) return '';
                    return visitedPts
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                      .join(' ');
                  })()}
                  fill="none"
                  stroke="var(--brand-dark)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />

                {/* 城市海拔锚定点 */}
                {points.map((p) => {
                  const isActive = p.city.label === city.label;
                  const isVisited = p.city.visited;
                  // 密集点位只标三个关键标签:出发点 / 最新抵达 / 当前选中
                  const showLabel =
                    isActive || p.city.isOrigin || p.city.label === lastVisitedLabel;

                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: SVG 图表海拔锚点命中区,指针优先可视化
                    <g
                      key={p.city.label}
                      className="cursor-pointer group"
                      onClick={() => onSelectCity?.(p.city.label)}
                    >
                      {/* 活跃点静态光圈(不用无限动画,保持克制) */}
                      {isActive && (
                        <circle cx={p.x} cy={p.y} r={7} fill="var(--brand)" opacity={0.3} />
                      )}

                      {/* 海拔点 */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isActive ? 4.5 : isVisited ? 3 : 2.5}
                        fill={
                          isActive
                            ? 'var(--brand-dark)'
                            : isVisited
                              ? 'var(--brand)'
                              : 'var(--neutral-300)'
                        }
                        stroke={isActive ? 'white' : 'transparent'}
                        strokeWidth={isActive ? 1.2 : 0}
                        className="transition-all duration-200 group-hover:scale-130"
                      />

                      <title>{`${p.city.label}: ${p.alt}m`}</title>

                      {/* 底部城市标签 — 仅关键点 */}
                      {showLabel && (
                        <text
                          x={p.x}
                          y={svgH - 4}
                          textAnchor="middle"
                          fontSize={9}
                          fill={isActive ? 'var(--neutral-900)' : 'var(--neutral-500)'}
                          fontWeight={isActive ? 800 : 500}
                        >
                          {p.city.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="elevation-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-dark)" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="var(--brand-dark)" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* 极境挑战：唯一保留的地学信息,提为正文金句(讲的是车和人,不是地理课) */}
            {city.challenge && (
              <p className="mb-6 flex gap-2.5 items-start border-l-2 border-brand pl-3 text-[13px] text-neutral-700 leading-relaxed">
                <Cpu className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-dark" />
                <span>{city.challenge}</span>
              </p>
            )}

            {/* 行程日志主要陈述(占位内容已在装配层剔除,空则不渲染) */}
            <div className="mt-2 text-left">
              {city.event?.summary ? (
                <p className="text-neutral-700 leading-relaxed text-sm md:text-[14.5px]">
                  {city.event.summary}
                </p>
              ) : !city.event ? (
                <div className="space-y-2">
                  <span className="inline-flex w-fit items-center text-[10px] uppercase tracking-[0.18em] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm font-semibold">
                    {getT('journal.upcoming', getT('route.status.upcoming', '即将抵达'))}
                  </span>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {getT(
                      'journal.upcomingDesc',
                      getT('route.status.upcomingDesc', '此城正在计划中，更多细节将在抵达前公开'),
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* 日志外部链接 CTA 按钮区 */}
          {city.event && (city.event.link || city.event.summary) && (
            <div className="mt-6 pt-4 border-t border-neutral-300/60 flex flex-wrap gap-4 items-center">
              {city.event.link && (
                <a
                  href={city.event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border-b border-neutral-900 pb-0.5 text-neutral-900 hover:text-brand-dark hover:border-brand-dark transition-colors duration-200 cursor-pointer"
                >
                  {city.event.linkLabel ?? '查看现场连线'}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* 右侧栏：在地共创与关联日记 — 扁平定义列表,不再做 HUD 套娃 */}
        <div className={`w-full flex-shrink-0 flex flex-col ${hero ? 'lg:w-[50%]' : ''}`}>
          {/* 在地共创实绩 */}
          {city.relationStats && city.relationStats.length > 0 && (
            <div className="py-4 border-b border-neutral-300/60 text-left">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-brand-dark" />
                <h5 className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  {getT(
                    'route.telemetry.coCreation',
                    locale === 'zh' ? '在地共创与科普实绩' : 'LOCAL CO-CREATION',
                  )}
                </h5>
              </div>
              <div className={`grid grid-cols-1 gap-2 ${hero ? 'md:grid-cols-3' : ''}`}>
                {city.relationStats.map((stat) => (
                  <div
                    key={stat}
                    className="bg-neutral-100 rounded-lg px-2.5 py-1.5 border border-neutral-300/50 text-left"
                  >
                    <span className="block text-[11px] font-semibold text-neutral-700 leading-tight">
                      {stat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 关联日记列表 */}
          {journals && cityJournals.length > 0 && (
            <div className="pt-4 text-left">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Activity className="w-3.5 h-3.5 text-brand-dark" />
                <h5 className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  {getT('route.journals.title', 'RELATED JOURNALS')}
                </h5>
              </div>
              <div className="space-y-2">
                {cityJournals.map((j) => {
                  const isPublished = j.status === 'published';
                  return (
                    <div
                      key={j.slug}
                      className="flex items-center justify-between bg-neutral-100 rounded-xl p-2.5 border border-neutral-300/50 hover:border-brand-dark/40 transition-colors duration-200"
                    >
                      {j.coverImage && (
                        <img
                          src={j.coverImage}
                          alt=""
                          loading="lazy"
                          className="w-11 h-11 rounded-lg object-cover flex-shrink-0 mr-2.5"
                        />
                      )}
                      <div className="flex-1 min-w-0 pr-3">
                        <span className="block text-[12px] font-semibold text-neutral-900 truncate">
                          {j.title}
                        </span>
                        <span className="block text-[9px] font-mono text-neutral-500 mt-0.5">
                          {j.date}
                        </span>
                      </div>
                      {isPublished ? (
                        <a
                          href={j.href ?? localePath(`/journals/${j.slug}`, locale)}
                          {...(j.href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          aria-label={`${getT('route.action.readLocal', '阅读')}：${j.title}`}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-dark bg-brand/15 hover:bg-brand/25 px-2.5 py-1 rounded-full transition-colors duration-200"
                        >
                          <span>{getT('route.action.readLocal', '阅读')}</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center text-[9px] font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                          {getT('route.journals.organizing', '整理中')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
