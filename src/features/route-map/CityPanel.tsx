import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Image as ImageIcon,
  MapPin,
  PanelRightClose,
  Users,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Locale } from '@/i18n/index';
import { localePath } from '@/i18n/index';
import ExpeditionLog from './ExpeditionLog';
import type { StopTime } from './expedition-timeline';
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
  hasPage?: boolean;
  coverImage?: string;
  coverThumb?: string;
  coverCard?: string;
}

/**
 * One stop's story.
 *
 * The full-width ridge (ExpeditionRidge) that briefly carried the elevation
 * profile was removed on 2026-07-29 — redundant with the time-true story
 * river. Altitude survives as a headline stat and in this panel's meta line.
 * What stays here is what only this stop can say: where it sits in the chain,
 * what happened there, and the field challenge in its own words.
 */
export default function CityPanel({
  city,
  cities,
  totalLegs,
  isLatest,
  t,
  locale = 'zh',
  hero = false,
  onSelectCity,
  onClose,
  onCollapse,
  journals,
  timeline,
  cumulativeKm,
}: {
  city: RouteCity | null;
  cities: RouteCity[];
  totalLegs: number;
  isLatest: boolean;
  t: Record<string, string>;
  locale?: Locale;
  hero?: boolean;
  onSelectCity?: (id: string) => void;
  onClose?: () => void;
  /** Desktop only: shrink the panel to a vertical strip, keeping the city selected. */
  onCollapse?: () => void;
  journals?: SerializedJournal[];
  timeline?: Map<string, StopTime>;
  cumulativeKm?: number | null;
}) {
  const getT = (key: string, fallback: string) => t[key] ?? fallback;

  // Newest first: the lead story is the most recent thing that happened here.
  const cityJournals = useMemo(() => {
    if (!journals || !city) return [];
    return journals.filter((j) => j.city === city.id).sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, city]);

  const index = useMemo(
    () => (city ? cities.findIndex((c) => c.id === city.id) : -1),
    [cities, city],
  );
  const prev = index > 0 ? cities[index - 1] : null;
  const next = index >= 0 && index < cities.length - 1 ? cities[index + 1] : null;

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

  const time = timeline?.get(city.id);
  const lead = cityJournals[0];
  const rest = cityJournals.slice(1);
  const legCounter = city.isOrigin
    ? null
    : (t['journal.legCounter'] ?? '{n} / {total}')
        .replace('{n}', String(Math.max(0, index)))
        .replace('{total}', String(totalLegs));

  const metaParts = [
    city.isOrigin
      ? getT('route.status.origin', '出发点')
      : (t['route.panel.cityIndex'] ?? '第 {n} 城').replace('{n}', String(index + 1)),
    time?.day ? (t['route.panel.day'] ?? '第 {n} 天').replace('{n}', String(time.day)) : null,
    // `province` is authored in Chinese only (no province_en in the stop
    // schema), so it is omitted on /en rather than printed untranslated.
    locale === 'zh' ? (city.province ?? null) : null,
    `${city.altitude}m`,
    cumulativeKm != null
      ? (t['route.panel.km'] ?? '{n} km').replace('{n}', String(cumulativeKm))
      : null,
    time?.date && !time.guessed ? time.date.slice(5).replace('-', '.') : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`w-full ${hero ? 'p-6 md:p-8' : ''}`}>
      <article className="w-full flex flex-col">
        <header
          className={`${hero ? '' : 'sticky top-0 z-10 bg-surface-card/95 backdrop-blur-sm px-5 pt-4'} pb-3 border-b border-neutral-200`}
        >
          {/* 沿路线前后走:42 城是一条链,读者应该能顺着读,而不是每次回地图找点 */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && onSelectCity?.(prev.id)}
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-0 transition-colors duration-200 cursor-pointer"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="max-w-[7em] truncate">{prev?.label}</span>
            </button>
            <div className="flex items-center gap-2">
              {isLatest && !city.isOrigin && (
                <span className="inline-flex items-center rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-brand-foreground">
                  {getT('journal.latest', getT('route.status.latest', '最新'))}
                </span>
              )}
              {legCounter && <span className="tabular-nums">{legCounter}</span>}
              <button
                type="button"
                onClick={() => next && onSelectCity?.(next.id)}
                disabled={!next}
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-0 transition-colors duration-200 cursor-pointer"
              >
                <span className="max-w-[7em] truncate">{next?.label}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h3
              className={`font-bold text-neutral-900 leading-tight ${hero ? 'text-3xl md:text-4xl' : 'text-2xl'}`}
            >
              {city.label}
            </h3>
            {(onCollapse || onClose) && (
              <div className="-mr-1 flex items-center gap-0.5">
                {onCollapse && (
                  <button
                    type="button"
                    onClick={onCollapse}
                    aria-label={getT('route.action.collapse', '收起面板')}
                    title={getT('route.action.collapse', '收起面板')}
                    className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors duration-200 cursor-pointer"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </button>
                )}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={getT('route.action.close', '关闭')}
                    className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors duration-200 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-[11.5px] tabular-nums text-neutral-500">
            {metaParts.join(' · ')}
          </p>
        </header>

        <div className={hero ? 'pt-5' : 'px-5 pb-6 pt-4'}>
          {/* 现场记 — 这一程发生了什么(占位内容已在装配层剔除,空则不渲染) */}
          {city.event?.summary && (
            <p className="mb-5 text-[14px] leading-relaxed text-neutral-700">
              {city.event.summary}
            </p>
          )}

          {/* 极境挑战:讲的是车和人,不是地理课 */}
          {city.challenge && (
            <p className="mb-5 flex gap-2.5 items-start border-l-2 border-brand pl-3 text-[13px] text-neutral-700 leading-relaxed">
              <Cpu className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-dark" />
              <span>{city.challenge}</span>
            </p>
          )}

          {/* 关联日记:首篇大图 + 其余紧凑行。原来 N 篇 = N 张同款卡 + N 个同款黄按钮。 */}
          {lead && (
            <div className="mb-5">
              {(() => {
                const leadHref =
                  lead.href ??
                  (lead.hasPage ? localePath(`/journals/${lead.slug}`, locale) : undefined);
                const LeadTag = (leadHref ? 'a' : 'div') as 'a';
                return (
                  <LeadTag
                    href={leadHref}
                    {...(lead.href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group block overflow-hidden rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors duration-200"
                  >
                    {lead.coverImage && (
                      <img
                        src={lead.coverCard ?? lead.coverImage}
                        alt=""
                        width={360}
                        height={128}
                        loading="lazy"
                        decoding="async"
                        className="h-32 w-full object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="text-[13px] font-semibold leading-snug text-neutral-900">
                        {lead.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] tabular-nums text-neutral-500">
                        {lead.date}
                        {leadHref && (
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        )}
                      </p>
                    </div>
                  </LeadTag>
                );
              })()}

              {rest.length > 0 && (
                <>
                  <p className="mt-4 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {(t['route.journals.more'] ?? '另外 {n} 篇').replace(
                      '{n}',
                      String(rest.length),
                    )}
                  </p>
                  <ul className="-mx-2">
                    {rest.map((j) => {
                      const href =
                        j.href ??
                        (j.hasPage ? localePath(`/journals/${j.slug}`, locale) : undefined);
                      const RowTag = (href ? 'a' : 'div') as 'a';
                      return (
                        <li key={j.slug}>
                          <RowTag
                            href={href}
                            {...(j.href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-neutral-100 transition-colors duration-200"
                          >
                            {j.coverImage && (
                              <img
                                src={j.coverThumb ?? j.coverImage}
                                alt=""
                                width={44}
                                height={32}
                                loading="lazy"
                                decoding="async"
                                className="h-8 w-11 flex-none rounded object-cover"
                              />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] tabular-nums text-neutral-500">
                                {j.date}
                              </span>
                              <span className="line-clamp-2 text-[11.5px] leading-snug text-neutral-700 group-hover:text-neutral-900">
                                {j.title}
                              </span>
                            </span>
                            {href && (
                              <ArrowUpRight className="h-3 w-3 flex-none text-neutral-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                            )}
                          </RowTag>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* 尚未抵达:说清楚状态,不铺占位内容 */}
          {!city.event && !lead && (
            <div className="mb-5 space-y-2">
              <span className="inline-flex w-fit items-center rounded-sm bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-700">
                {getT('journal.upcoming', getT('route.status.upcoming', '即将抵达'))}
              </span>
              <p className="text-sm leading-relaxed text-neutral-500">
                {getT(
                  'journal.upcomingDesc',
                  getT('route.status.upcomingDesc', '此城正在计划中，更多细节将在抵达前公开'),
                )}
              </p>
            </div>
          )}

          {/* 航行日志:越界钩子 + 新世界 + 火种 */}
          {city.expedition && (
            <div className="mb-5">
              <ExpeditionLog expedition={city.expedition} locale={locale} />
            </div>
          )}

          {/* 在地共创实绩 */}
          {city.relationStats && city.relationStats.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-brand-dark" />
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {getT(
                    'route.telemetry.coCreation',
                    locale === 'zh' ? '在地共创与科普实绩' : 'LOCAL CO-CREATION',
                  )}
                </h5>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {city.relationStats.map((stat) => (
                  <span
                    key={stat}
                    className="rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 遇见的人 */}
          {city.people && city.people.length > 0 && (
            <div className="mb-5">
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
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-brand-dark" />
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {locale === 'zh' ? '剧照' : 'FROM THE FIELD'}
                </h5>
              </div>
              <PhotoStrip photos={city.photos} />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
