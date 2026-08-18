import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactSlick from 'react-slick';

// Vite 8 CJS interop: default export is nested
const Slider = (
  'default' in ReactSlick ? (ReactSlick as { default: typeof ReactSlick }).default : ReactSlick
) as typeof ReactSlick;
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ChevronDown, ChevronLeft, ChevronRight, Compass, Cpu, Mountain } from 'lucide-react';
import { MAP_BG } from '@/features/route-map/map-style';
import RoutePreview from '@/features/route-map/RoutePreview';
import type { Stop } from '@/features/route-map/stops-loader';
import type { ProjectableStop } from '@/features/route-map/types';
import type { Locale } from '@/i18n/index';
import { localePath } from '@/i18n/index';
import {
  buttonPress,
  defaultViewport,
  fadeLeft,
  fadeUp,
  springTransition,
  stagger,
} from '../components/motion';
import RoleTimeline from './RoleTimeline';

// ─── Types ───

interface HeroImage {
  image: string;
  imageMobile?: string;
  alt?: string;
}

interface TimelineSegment {
  id: string;
  role: string;
  crewId: string;
  name: string;
  image: string;
  avatarThumb: string;
  avatarCard: string;
  startDate: string;
  endDate: string | null;
  handoffName: string | null;
  startLocation: string;
  endLocation: string | null;
}

interface TimelineData {
  roles: Array<{ key: string; label: string; sub?: string }>;
  segments: TimelineSegment[];
  monthMarkers: Array<{ label: string; pct: number }>;
  legs: Array<{
    key: string;
    label: string;
    fullName: string;
    startDate: string;
    endDate: string;
    planned: boolean;
  }>;
  projectStart: string;
  projectEnd: string;
}

interface PressItem {
  source: string;
  sourceUrl: string;
  title: string;
  date?: string;
  tier?: string;
  category?: string;
}

interface PartnerItem {
  id: string;
  name: string;
  description?: string;
  tier: string;
  link?: string;
  logo?: string;
}

interface Props {
  cities: HomeStop[];
  heroImages: HeroImage[];
  timeline: TimelineData;
  press?: PressItem[];
  partners?: PartnerItem[];
  locale?: Locale;
  t: Record<string, string>;
}

// Slimmed stop payload shipped to the island: map geometry + lastVisited fact card
type HomeStop = ProjectableStop & Pick<Stop, 'terrain' | 'climate' | 'challenge'>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEPARTURE_DATE = Date.UTC(2026, 3, 22);
// 官方计划全程天数(见 src/content/stops/00-shenzhen.md 与 press.json 报道标题)
const TOTAL_ROUTE_DAYS = 200;
const labCards = [
  [
    'lab.aiTitle',
    'lab.aiDesc',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  ],
  [
    'lab.fabTitle',
    'lab.fabDesc',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  ],
  [
    'lab.spaceTitle',
    'lab.spaceDesc',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  ],
] as const;

function getDepartureDays(now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((today - DEPARTURE_DATE) / MS_PER_DAY));
}

export default function HomeContent({
  cities,
  heroImages,
  timeline,
  press = [],
  partners = [],
  locale = 'zh',
  t,
}: Props) {
  const sortedCities = useMemo(() => [...cities].sort((a, b) => a.order - b.order), [cities]);
  const lastVisited = useMemo(
    () => [...sortedCities].reverse().find((c) => c.visited) ?? null,
    [sortedCities],
  );
  const visitedCount = useMemo(() => cities.filter((city) => city.visited).length, [cities]);
  const departureDays = getDepartureDays();

  // 媒体报道信息流：featured 置顶，其余按日期倒序；水平滑动卡片流
  const pressCards = useMemo(() => {
    const featured = press.filter((p) => p.tier === 'featured').slice(0, 2);
    const rest = press
      .filter((p) => p.tier !== 'featured')
      .slice()
      .sort((a, b) => ((b.date ?? '') < (a.date ?? '') ? -1 : 1));
    return [...featured, ...rest];
  }, [press]);
  const pressCategoryLabel = (category?: string) => {
    const key =
      category === 'gov'
        ? 'press.cat.gov'
        : category === 'wechat'
          ? 'press.cat.wechat'
          : 'press.cat.media';
    return t[key] || category || '';
  };
  // 媒体报道横向滚动：容器 ref + 箭头辅助滚动（原生 overflow-x 横滑；overscroll contain 防浏览器返回手势）
  const pressTrackRef = useRef<HTMLDivElement>(null);
  const pressScrollBy = (dir: 1 | -1) => {
    const el = pressTrackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-press-card]');
    const step = card ? card.offsetWidth + 16 : 300;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // Respect prefers-reduced-motion: pause carousel autoplay for those users.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // 非首张 slide 的背景图推迟到挂载后再下发,不与 LCP 首图抢带宽。
  // SSR 与首次客户端渲染都只带首图,hydration 不会不一致。
  const [deferRest, setDeferRest] = useState(true);
  useEffect(() => setDeferRest(false), []);

  const SliderPrevArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white border border-white/20 hover:border-white/50 transition-all duration-200 cursor-pointer"
      aria-label={t['carousel.prevAria'] ?? (locale === 'en' ? 'Previous slide' : '上一张')}
    >
      <ChevronLeft size={20} />
    </button>
  );

  const SliderNextArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white border border-white/20 hover:border-white/50 transition-all duration-200 cursor-pointer"
      aria-label={t['carousel.nextAria'] ?? (locale === 'en' ? 'Next slide' : '下一张')}
    >
      <ChevronRight size={20} />
    </button>
  );

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: !prefersReducedMotion,
    autoplaySpeed: 5000,
    fade: true,
    arrows: true,
    pauseOnHover: true,
    prevArrow: <SliderPrevArrow />,
    nextArrow: <SliderNextArrow />,
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-screen min-h-[600px] bg-black text-white">
        <Slider {...sliderSettings} className="h-full">
          {heroImages.map((image, index) => {
            // 桌面/移动两套背景按断点互斥显示;display:none 的背景图浏览器不下载,
            // 所以不会双拉。非首张推迟到挂载后再给 URL(见 deferRest)。
            const withBg = (url: string) =>
              index === 0 || !deferRest ? { backgroundImage: `url(${url})` } : undefined;
            return (
              <div key={image.image} className="h-screen min-h-[600px] relative">
                <div
                  className="h-screen min-h-[600px] bg-cover bg-center hidden md:block"
                  style={withBg(image.image)}
                  role="img"
                  aria-label={image.alt ?? t['hero.title']}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <div
                  className="h-screen min-h-[600px] bg-cover bg-center md:hidden"
                  style={withBg(image.imageMobile ?? image.image)}
                  role="img"
                  aria-label={image.alt ?? t['hero.title']}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              </div>
            );
          })}
        </Slider>

        {/* Hero 内容 */}
        <div className="absolute inset-0 flex flex-col justify-center pointer-events-none px-6 md:px-[12%] lg:px-[16%]">
          <motion.div
            className="max-w-2xl pointer-events-auto"
            variants={stagger(0.2)}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="font-display text-5xl md:text-7xl lg:text-8xl mb-4 leading-tight"
              variants={fadeLeft}
              transition={springTransition}
            >
              <span className="block text-white font-bold">{t['hero.title']}</span>
              <span className="block text-brand font-bold text-4xl md:text-6xl mt-2">
                {t['hero.slogan']}
              </span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-neutral-300 mb-6 leading-relaxed max-w-lg"
              variants={fadeLeft}
              transition={springTransition}
            >
              {t['hero.subtitle']}
            </motion.p>
            <motion.p
              className="text-base md:text-lg text-neutral-300 mb-10 max-w-lg leading-relaxed"
              variants={fadeLeft}
              transition={springTransition}
            >
              {t['hero.body']}
            </motion.p>
            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              transition={{ y: springTransition, opacity: { duration: 0.12, ease: 'easeOut' } }}
              className="flex flex-wrap gap-4"
            >
              {/* 了解我们 (About Us) */}
              <motion.a
                href={localePath('/about', locale)}
                className="pointer-events-auto border border-white/20 bg-surface-card/5 backdrop-blur-sm text-white px-8 py-4 rounded-full flex items-center gap-2 cursor-pointer group"
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <span>{t['hero.aboutAction']}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
              </motion.a>

              {/* 加入行动 (Join Action) */}
              <motion.a
                href={localePath('/guide', locale)}
                className="pointer-events-auto border border-brand/35 bg-brand/10 backdrop-blur-md text-brand px-8 py-4 rounded-full flex items-center gap-2 cursor-pointer font-semibold group shadow-md"
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  backgroundColor: 'rgba(243, 210, 48, 0.2)',
                  borderColor: 'rgba(243, 210, 48, 0.55)',
                  boxShadow: '0 15px 35px rgba(243, 210, 48, 0.25)',
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <span>{t['hero.joinAction']}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* 实时任务状态条 — hero 图片之后,独立一条,居中 */}
      <div className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
          <span className="text-white/70">
            {(t['status.days'] ?? '已出发 {days} 天').replace('{days}', String(departureDays))}
          </span>
          <span className="text-white/25">·</span>
          <span className="flex items-center gap-2 font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-brand" />
            {(t['status.current'] ?? '位于 {city}').replace('{city}', lastVisited?.label ?? '')}
          </span>
          <span className="text-white/25">·</span>
          <span className="text-white/70">
            {(t['status.cities'] ?? '已抵达 {count} 城').replace('{count}', String(visitedCount))}
          </span>
        </div>
      </div>

      <section className="bg-neutral-50 text-black py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* 左侧栏: 路线叙事 + 当前站点事实卡 (Col-span 5) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={stagger(0.12)}
              className="lg:col-span-5 flex flex-col justify-between gap-6"
            >
              <div>
                <motion.h2
                  variants={fadeUp}
                  transition={springTransition}
                  className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-neutral-900 tracking-tight"
                >
                  {t['route.title1']}
                  <span className="text-brand-dark block mt-1">{t['route.title2']}</span>
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  transition={springTransition}
                  className="text-neutral-500 leading-relaxed text-sm md:text-base mt-4"
                >
                  {t['route.body']}
                </motion.p>
              </div>

              {/* 行程信息流:日志式天数 + 一条从起点到当前站的微缩路线轨(进度即叙事),
                  数据少的站点不再有"空盒子";有测控数据的站点在轨下继续展开 */}
              {lastVisited && (
                <motion.div
                  variants={fadeUp}
                  transition={springTransition}
                  className="border-t border-neutral-200 pt-5"
                >
                  <p className="flex items-baseline gap-x-2 flex-wrap">
                    <span className="text-3xl font-extrabold tabular-nums tracking-tight text-neutral-900">
                      {departureDays}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-neutral-400">
                      {(t['telemetry.daysTotal'] ?? '/ {total} 天').replace(
                        '{total}',
                        String(TOTAL_ROUTE_DAYS),
                      )}
                    </span>
                    <span className="text-xs tabular-nums text-neutral-500">
                      {'· '}
                      {(t['telemetry.progress'] ?? '已抵达 {visited}/{total} 城')
                        .replace('{visited}', String(visitedCount))
                        .replace('{total}', String(cities.length))}
                    </span>
                  </p>
                  <div className="mt-4">
                    <div className="relative h-0.5 rounded-full bg-neutral-200">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-brand"
                        style={{
                          width: `${Math.min(100, (visitedCount / Math.max(1, cities.length)) * 100)}%`,
                        }}
                      />
                      <span
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-2 ring-brand/30"
                        style={{
                          left: `${Math.min(100, (visitedCount / Math.max(1, cities.length)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3 text-xs">
                      <span className="text-neutral-500">
                        {sortedCities.find((c) => c.isOrigin)?.label ?? sortedCities[0]?.label}
                      </span>
                      <span className="font-bold text-neutral-900">{lastVisited.label}</span>
                    </div>
                  </div>
                  {(lastVisited.terrain || lastVisited.climate) && (
                    <dl className="mt-4 flex flex-col gap-2.5 text-left">
                      {lastVisited.terrain && (
                        <div className="flex gap-2.5">
                          <Mountain className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-dark" />
                          <div>
                            <dt className="text-xs text-neutral-500">{t['telemetry.terrain']}</dt>
                            <dd className="text-xs text-neutral-700 leading-relaxed mt-0.5 line-clamp-2">
                              {lastVisited.terrain}
                            </dd>
                          </div>
                        </div>
                      )}
                      {lastVisited.climate && (
                        <div className="flex gap-2.5">
                          <Compass className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-dark" />
                          <div>
                            <dt className="text-xs text-neutral-500">{t['telemetry.climate']}</dt>
                            <dd className="text-xs text-neutral-700 leading-relaxed mt-0.5 line-clamp-2">
                              {lastVisited.climate}
                            </dd>
                          </div>
                        </div>
                      )}
                    </dl>
                  )}
                  {lastVisited.challenge && (
                    <p className="mt-3 flex gap-2.5 items-start border-l-2 border-brand pl-3 text-xs text-neutral-700 leading-relaxed">
                      <Cpu className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-dark" />
                      <span className="line-clamp-3">{lastVisited.challenge}</span>
                    </p>
                  )}
                </motion.div>
              )}

              {/* 路线查看 CTA 按钮 */}
              <motion.div variants={fadeUp} className="pt-2">
                <motion.a
                  href={localePath('/route', locale)}
                  className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-brand text-white hover:text-brand-foreground px-6 py-3.5 rounded-xl transition-[background-color,color,box-shadow] duration-300 cursor-pointer text-sm font-bold shadow-lg hover:shadow-brand/20 group w-full justify-center lg:w-auto"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{t['routePreview.cta']}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* 右侧栏: 测控地图玻璃卡框 (Col-span 7) */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <motion.div
                className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-neutral-300/40"
                style={{ aspectRatio: '4/3', backgroundColor: MAP_BG }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="absolute inset-0">
                  <RoutePreview cities={cities} ariaLabel={t['routePreview.aria']} />
                </div>

                {/* 地图图例标注 */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <div className="bg-surface-card/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl text-xs text-neutral-700 flex items-center gap-3.5 shadow-md border border-white/60">
                    <span className="flex items-center gap-1.5 font-medium select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                      {t['map.visited'] ?? '已到达'}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-card border border-neutral-500" />
                      {t['map.planned'] ?? '计划中'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 共建伙伴条（4a：信任背书，与媒体报道同区不分线；主办/联合发起一行，合作支持一行） */}
      {partners.length > 0 && (
        <section data-partners-bar className="py-14 md:py-16 px-6 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              transition={springTransition}
              className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-8 text-center"
            >
              {t['partners.label']}
            </motion.p>
            {/* 第一行：主办 + 联合发起 */}
            {(() => {
              const lead = partners.filter((p) => p.tier === 'host' || p.tier === 'co-organizer');
              return (
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 mb-6">
                  {lead.map((partner, i) => (
                    <motion.a
                      key={partner.id}
                      href={partner.link || '#'}
                      target={partner.link ? '_blank' : undefined}
                      rel={partner.link ? 'noopener noreferrer' : undefined}
                      aria-label={partner.name}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={defaultViewport}
                      transition={{ ...springTransition, delay: i * 0.05 }}
                      className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-200"
                    >
                      {partner.logo ? (
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          loading="lazy"
                          className="h-8 md:h-10 w-auto max-w-[120px] object-contain"
                        />
                      ) : (
                        <span className="text-sm md:text-base font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
                          {partner.name}
                        </span>
                      )}
                    </motion.a>
                  ))}
                </div>
              );
            })()}
            {/* 第二行：合作支持 */}
            {(() => {
              const rest = partners.filter((p) => p.tier === 'partner');
              if (rest.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                  {rest.map((partner, i) => (
                    <motion.a
                      key={partner.id}
                      href={partner.link || '#'}
                      target={partner.link ? '_blank' : undefined}
                      rel={partner.link ? 'noopener noreferrer' : undefined}
                      aria-label={partner.name}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={defaultViewport}
                      transition={{ ...springTransition, delay: i * 0.05 }}
                      className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-200"
                    >
                      {partner.logo ? (
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          loading="lazy"
                          className="h-8 md:h-10 w-auto max-w-[120px] object-contain"
                        />
                      ) : (
                        <span className="text-sm md:text-base font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
                          {partner.name}
                        </span>
                      )}
                    </motion.a>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* 媒体报道：固定 3 行窗口 + 原生横向滚动（滚轮/shift+双指/触屏横滑原生生效；14 条全保留，精选置前高亮） */}
      {pressCards.length > 0 && (
        <section className="pt-16 md:pt-20 px-6 pb-[30px] md:pb-[30px] bg-neutral-50 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              transition={springTransition}
              className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-8 text-center"
            >
              {t['press.label']}
            </motion.p>

            <div className="relative">
              {/* 左/右箭头（桌面） */}
              <button
                type="button"
                onClick={() => pressScrollBy(-1)}
                aria-label={t['carousel.prevAria']}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-10 w-10 h-10 hidden md:flex items-center justify-center rounded-full bg-surface-card border border-neutral-300 text-neutral-700 hover:text-brand hover:border-brand shadow-sm cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => pressScrollBy(1)}
                aria-label={t['carousel.nextAria']}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-10 w-10 h-10 hidden md:flex items-center justify-center rounded-full bg-surface-card border border-neutral-300 text-neutral-700 hover:text-brand hover:border-brand shadow-sm cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>

              {/* 横向滚动轨道：固定 3 行网格（按行填充，精选左右并排置前），超出横向原生滚动 */}
              <div
                ref={pressTrackRef}
                data-press-track
                className="overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 rounded-xl [scrollbar-width:thin] [scrollbar-color:theme(colors.neutral.300)_transparent]"
              >
                <div className="grid grid-flow-row grid-cols-[repeat(6,15rem)] gap-x-5 gap-y-4 w-max pr-2">
                  {pressCards.map((item, i) => {
                    const featured = item.tier === 'featured';
                    return (
                      <motion.a
                        key={item.sourceUrl}
                        data-press-card
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={defaultViewport}
                        transition={{ ...springTransition, delay: (i % 6) * 0.04 }}
                        className={`group block rounded-2xl border transition-[border-color,box-shadow] duration-300 hover:shadow-md cursor-pointer ${
                          featured
                            ? 'border-brand/30 bg-brand-light/60 p-5 hover:border-brand/60'
                            : 'border-neutral-300 bg-surface-card/70 p-4 hover:border-brand/40'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex mb-2.5 text-neutral-600 bg-neutral-100 border border-neutral-200">
                          {pressCategoryLabel(item.category)}
                          {featured ? ` · ${locale === 'en' ? 'Featured' : '精选'}` : ''}
                        </span>
                        <span
                          className={`block font-semibold text-neutral-900 group-hover:text-brand transition-colors duration-200 leading-snug line-clamp-3 ${
                            featured ? 'text-[15px]' : 'text-sm'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="block mt-2 text-xs text-neutral-500">
                          {item.source}
                          {item.date ? ` · ${item.date}` : ''}
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 在路上的人 - 角色接力时间轴 */}
      <RoleTimeline
        roles={timeline.roles}
        segments={timeline.segments}
        monthMarkers={timeline.monthMarkers}
        legs={timeline.legs}
        projectStart={timeline.projectStart}
        projectEnd={timeline.projectEnd}
        locale={locale}
        t={t}
      />

      {/* 基地车概况 - 流动的基础设施 */}
      <section className="py-20 px-6 bg-surface-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">
            {t['lab.title']}
          </h2>
          <p className="text-center text-neutral-500 mb-16 max-w-2xl mx-auto">
            {t['lab.subtitle']}
          </p>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {labCards.map(([title, desc, image]) => (
              <motion.div
                key={title}
                className="bg-surface-card rounded-lg overflow-hidden shadow-sm border border-neutral-300 hover:shadow-md transition-shadow duration-200"
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={springTransition}
              >
                <div
                  className="h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="p-6">
                  <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">{t[title]}</h3>
                  <p className="text-neutral-500 mb-4">{t[desc]}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 旅途日记 CTA */}
      <section className="py-16 px-6 border-t border-neutral-300">
        <motion.div
          className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={stagger(0.15)}
        >
          <motion.div variants={fadeUp}>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">
              {t['cta.label']}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {t['cta.title']}
            </h2>
            <p className="text-neutral-500 text-sm max-w-lg">{t['cta.body']}</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <motion.a
              href={localePath('/journals', locale)}
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-sm hover:bg-brand hover:text-brand-foreground transition-colors duration-200 cursor-pointer text-sm font-medium whitespace-nowrap"
              {...buttonPress}
            >
              {t['cta.explore']}
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </motion.a>
            <motion.a
              href={localePath('/guide', locale)}
              className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-sm hover:border-brand hover:text-brand transition-colors duration-200 cursor-pointer text-sm font-medium whitespace-nowrap"
              {...buttonPress}
            >
              {t['cta.join']}
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </motion.a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
