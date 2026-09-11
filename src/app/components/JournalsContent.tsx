import { ArrowRight, ChevronDown, Clock, Compass, MapPin } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { Locale } from '@/i18n/index';
import { localePath } from '@/i18n/index';
import type { LocalizedJournal } from '@/lib/journals';
import { DEFAULT_SCENE, isSceneId, SCENES, type SceneId, sceneLabel } from '@/lib/scenes.mjs';
import { fadeUp, springTransition, stagger } from './motion';

interface Props {
  cities: CityFilterOption[];
  journals: LocalizedJournal[];
  yuqueJournals?: YuqueJournalCard[];
  locale?: Locale;
  t: Record<string, string>;
}

// Slimmed stop shape shipped to the island: city filter labels only
interface CityFilterOption {
  id: string;
  label: string;
}

interface YuqueJournalCard {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  city: string;
  href: string;
  coverImage: string | null;
  category?: SceneId | string;
}

export default function JournalsContent({
  cities,
  journals,
  yuqueJournals = [],
  locale = 'zh',
  t,
}: Props) {
  // Read search parameters for initial filters
  const [activeCity, setActiveCity] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  // yuque 数据源只有 category 筛选控件：city/status 参数是旧版残留，不同步、不应用
  const hasYuqueJournals = yuqueJournals.length > 0;

  // Stable across renders (boolean dep is primitive, state setters are stable), so
  // the effects below still run once on mount — behaviour identical to empty deps.
  const syncFiltersFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (hasYuqueJournals) {
      setActiveCity('all');
      setActiveStatus('all');
    } else {
      setActiveCity(params.get('city') ?? 'all');
      setActiveStatus(params.get('status') ?? 'all');
    }
    setActiveCategory(params.get('category') ?? 'all');
  }, [hasYuqueJournals]);

  // Sync state with URL Search Params on mount
  useEffect(() => {
    syncFiltersFromUrl();
  }, [syncFiltersFromUrl]);

  // Keep filters in sync with browser history navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('popstate', syncFiltersFromUrl);
    return () => window.removeEventListener('popstate', syncFiltersFromUrl);
  }, [syncFiltersFromUrl]);

  // 导航滚动隐藏时（-translate-y-full），sticky 筛选栏贴到视口顶，不留 64px 死空白
  const [navHidden, setNavHidden] = useState(false);
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const update = () => setNavHidden(nav.classList.contains('-translate-y-full'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(nav, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Update URL Search Params when filters change
  const handleCityChange = (cityId: string) => {
    setActiveCity(cityId);
    updateQueryParams(cityId, activeStatus, activeCategory);
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    updateQueryParams(activeCity, status, activeCategory);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    updateQueryParams(activeCity, activeStatus, category);
  };

  const updateQueryParams = (city: string, status: string, category: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (city === 'all') {
        params.delete('city');
      } else {
        params.set('city', city);
      }
      if (status === 'all') {
        params.delete('status');
      } else {
        params.set('status', status);
      }
      if (category === 'all') {
        params.delete('category');
      } else {
        params.set('category', category);
      }
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  // 空态一键复位：相关筛选全部回 'all'，URL 参数同步清掉
  const resetFilters = () => {
    setActiveCity('all');
    setActiveStatus('all');
    setActiveCategory('all');
    updateQueryParams('all', 'all', 'all');
  };

  // Filter journals in-memory
  const filteredJournals = journals.filter((j) => {
    const cityMatch = activeCity === 'all' || j.city === activeCity;
    const statusMatch = activeStatus === 'all' || j.status === activeStatus;
    return cityMatch && statusMatch;
  });
  const journalCategory = (j: YuqueJournalCard): SceneId =>
    isSceneId(j.category) ? j.category : DEFAULT_SCENE;
  // yuque 模式只认 category（city/status 控件不存在，见 syncFiltersFromUrl）
  const filteredYuqueJournals = yuqueJournals.filter((j) => {
    const categoryMatch = activeCategory === 'all' || journalCategory(j) === activeCategory;
    return categoryMatch;
  });
  const categoryCounts = Object.fromEntries(
    SCENES.map((key) => [key, yuqueJournals.filter((j) => journalCategory(j) === key).length]),
  ) as Record<SceneId, number>;
  const totalCount = hasYuqueJournals ? yuqueJournals.length : journals.length;
  const publishedCount = hasYuqueJournals
    ? yuqueJournals.length
    : journals.filter((j) => j.status === 'published').length;
  const placeholderCount = hasYuqueJournals
    ? 0
    : journals.filter((j) => j.status === 'placeholder').length;

  // Unique cities referenced in the cities prop
  const citiesList = Array.from(new Map(cities.map((city) => [city.id, city.label]))).map(
    ([id, label]) => ({ id, label }),
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-surface">
        {/* 顶部 Hero */}
        <section className="pt-28 pb-12">
          <div className="page-rail">
            <motion.div variants={stagger(0.1)} initial="hidden" animate="visible">
              <motion.p
                className="text-xs font-semibold tracking-[0.3em] text-neutral-500 uppercase mb-3"
                variants={fadeUp}
                transition={springTransition}
              >
                {t['hero.subtitle']}
              </motion.p>
              <motion.h1
                className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 tracking-tight"
                variants={fadeUp}
                transition={springTransition}
              >
                {t['hero.title']}
              </motion.h1>
              <motion.p
                className="text-base text-neutral-500 max-w-xl leading-relaxed"
                variants={fadeUp}
                transition={springTransition}
              >
                {t['hero.body']}
              </motion.p>
            </motion.div>
          </div>
        </section>

        {hasYuqueJournals && (
          <section
            className={`sticky ${navHidden ? 'top-0' : 'top-[64px]'} z-40 border-b border-neutral-300 bg-surface-card py-4 shadow-xs`}
          >
            <div className="page-rail flex flex-wrap items-center justify-between gap-4">
              {/* biome-ignore lint/a11y/useSemanticElements: 筛选 chip 组无对应原生元素 */}
              <div
                role="group"
                aria-label={t['filter.categoryAria']}
                className="flex flex-wrap items-center gap-2"
              >
                <button
                  type="button"
                  aria-pressed={activeCategory === 'all'}
                  onClick={() => handleCategoryChange('all')}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                    activeCategory === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'border border-neutral-300 text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  {t['filter.all']} {totalCount}
                </button>
                {SCENES.map((key) => {
                  const selected = activeCategory === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      aria-pressed={selected}
                      onClick={() => handleCategoryChange(key)}
                      className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                        selected
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-300 text-neutral-700 hover:border-neutral-900'
                      }`}
                    >
                      {sceneLabel(locale, key)} {categoryCounts[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {!hasYuqueJournals && (
          <section
            className={`sticky ${navHidden ? 'top-0' : 'top-[64px]'} z-40 border-b border-neutral-300 bg-surface-card py-6 shadow-xs`}
          >
            <div className="page-rail flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex items-center bg-neutral-100 hover:bg-neutral-300 border border-neutral-300 rounded-lg px-3 py-1.5 transition-colors duration-200 group cursor-pointer focus-within:ring-2 focus-within:ring-brand focus-within:border-brand">
                  <MapPin className="w-4 h-4 text-neutral-500 mr-2" />
                  <select
                    value={activeCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    aria-label={
                      t['filter.cityAria'] ??
                      (locale === 'en' ? 'Filter journals by city' : '按城市筛选日志')
                    }
                    className="appearance-none bg-transparent pr-8 py-0.5 text-sm font-medium text-neutral-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="all">{t['filter.all']}</option>
                    {citiesList.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg border border-neutral-300">
                  {[
                    { key: 'all', label: t['filter.all'] },
                    { key: 'published', label: t['filter.published'] },
                    { key: 'placeholder', label: t['filter.placeholder'] },
                  ].map((status) => (
                    <button
                      type="button"
                      key={status.key}
                      aria-pressed={activeStatus === status.key}
                      onClick={() => handleStatusChange(status.key)}
                      className={`px-4 py-1 rounded-md text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                        activeStatus === status.key
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'text-neutral-700 hover:text-neutral-900'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-neutral-500 font-semibold self-start md:self-auto flex items-center gap-2">
                <span>
                  {locale === 'en' ? 'All' : '全部'} {totalCount}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-brand-dark">
                  {locale === 'en' ? 'Published' : '已发布'} {publishedCount}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-500">
                  {locale === 'en' ? 'In progress' : '整理中'} {placeholderCount}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Cards Grid */}
        <section className={hasYuqueJournals ? 'pt-8 pb-16' : 'py-16'}>
          <div className="page-rail">
            {hasYuqueJournals ? (
              filteredYuqueJournals.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={stagger(0.08)}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredYuqueJournals.map((entry) => (
                    <motion.div key={entry.id} variants={fadeUp} className="group">
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-surface-card rounded-lg overflow-hidden shadow-xs hover:shadow-lg hover:border-neutral-400 border border-neutral-300 transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5"
                      >
                        <div className="aspect-[16/9] bg-neutral-100 overflow-hidden border-b border-neutral-300">
                          {entry.coverImage ? (
                            <img
                              src={entry.coverImage}
                              alt={entry.title}
                              className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-500"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-end bg-neutral-200 p-5">
                              <span className="text-xs font-semibold text-neutral-500">
                                {entry.date ?? entry.slug}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="px-5 py-4">
                          <h3 className="text-base font-bold text-neutral-900 line-clamp-1 leading-snug">
                            {formatYuqueCardTitle(entry.title)}
                          </h3>
                          <p className="text-sm text-neutral-500 mt-3">
                            {sceneLabel(locale, journalCategory(entry))}
                            {' · '}
                            {formatYuqueJournalDate(entry.date, locale)}
                          </p>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-24 bg-surface-card border border-neutral-300 rounded-2xl shadow-xs">
                  <Compass className="w-12 h-12 text-neutral-300 mx-auto mb-4 animate-spin [animation-duration:10s] motion-reduce:animate-none" />
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{t['empty.title']}</h3>
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto">{t['empty.subtitle']}</p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-6 inline-flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {t['filters.reset']}
                  </button>
                </div>
              )
            ) : filteredJournals.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={stagger(0.08)}
                initial="hidden"
                animate="visible"
              >
                {filteredJournals.map((entry) => {
                  const isPublished = entry.status === 'published';

                  if (isPublished) {
                    // Published Card
                    return (
                      <motion.div key={entry.slug} variants={fadeUp} className="group">
                        <a
                          href={localePath(`/journals/${entry.slug}`, locale)}
                          className="block bg-surface-card rounded-xl overflow-hidden shadow-xs hover:shadow-lg hover:border-brand/80 border border-neutral-300 transition-[box-shadow,border-color] duration-300"
                        >
                          {/* Cover Image */}
                          <div className="aspect-[16/10] bg-neutral-100 overflow-hidden relative border-b border-neutral-300">
                            {entry.coverImage ? (
                              <img
                                src={entry.coverImage}
                                alt={entry.title}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col justify-between bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 text-white">
                                <span className="text-[11px] tracking-[0.25em] font-semibold text-neutral-500 uppercase font-mono">
                                  {entry.date}
                                </span>
                                <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
                                  {entry.cityLabel}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Info */}
                          <div className="p-5 flex flex-col min-h-44 justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-500">
                                <span className="font-mono">{entry.date}</span>
                                <span>•</span>
                                <span className="text-neutral-700">{entry.cityLabel}</span>
                              </div>
                              <h3 className="text-base font-bold text-neutral-900 group-hover:text-brand-dark transition-colors line-clamp-2 leading-snug mb-2">
                                {entry.title}
                              </h3>
                              <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                {entry.excerpt}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-neutral-700 group-hover:text-neutral-900 transition-colors duration-200 mt-3">
                              <span>{t['card.read']}</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </a>
                      </motion.div>
                    );
                  } else {
                    return (
                      <motion.div
                        key={entry.slug}
                        variants={fadeUp}
                        className="relative group rounded-xl"
                      >
                        <div className="block bg-surface text-neutral-700 rounded-xl border border-dashed border-neutral-300 p-5 shadow-none min-h-44 flex flex-col justify-between overflow-hidden">
                          <div>
                            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-500">
                              <span>{entry.date}</span>
                              <span>•</span>
                              <span className="text-neutral-700">{entry.cityLabel}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <h3 className="text-base font-semibold text-neutral-900 line-clamp-1 leading-snug">
                                {entry.title}
                              </h3>
                              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-300">
                                <Clock className="w-3 h-3" />
                                {t['card.placeholder.label']}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                              {entry.excerpt}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                })}
              </motion.div>
            ) : (
              <div className="text-center py-24 bg-surface-card border border-neutral-300 rounded-2xl shadow-xs">
                <Compass className="w-12 h-12 text-neutral-300 mx-auto mb-4 animate-spin [animation-duration:10s] motion-reduce:animate-none" />
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{t['empty.title']}</h3>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto">{t['empty.subtitle']}</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {t['filters.reset']}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}

function formatYuqueCardTitle(title: string) {
  const parts = title
    .split(/[|｜]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) return parts.slice(2).join(' | ');
  // 两段式标题(「基地车日记|2026.8.17长春…」/「基地车日记|48天·8000公里…」):
  // 摘掉「基地车日记」头,保留正文;开头若有 20xx 日期一并去掉。
  if (parts.length === 2 && parts[0] === '基地车日记') {
    return parts[1].replace(/^20\d{2}[\d.\-–/]+\s*/, '');
  }
  return title;
}

function formatYuqueJournalDate(value: string | null, locale: Locale) {
  if (!value) return locale === 'en' ? 'No date' : '暂无日期';

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  return `${match[1]}.${match[2]}.${match[3]}`;
}
