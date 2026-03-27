import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, stagger, springTransition, defaultViewport } from './motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

interface YearEntry {
  year: string;
  events: { month: string; text: string; en?: string }[];
}

interface Phase {
  label: string;
  range: number[];
}

interface Partner {
  name: string;
  description?: string;
}

interface AboutContentProps {
  timelineData: YearEntry[];
  phases: Phase[];
  partners: Partner[];
  heroImage: string;
}

const HIGHLIGHT_YEARS = new Set(['2011', '2012', '2015', '2016']);

/* ── Enrich year entries with phase info ── */
interface EnrichedYear {
  year: string;
  events: { month: string; text: string; en?: string }[];
  phase: string;
  isPhaseStart: boolean;
  isHighlight: boolean;
}

function enrichYears(data: YearEntry[], phases: Phase[]): EnrichedYear[] {
  return data.map((entry, idx) => {
    const phase = phases.find(p => idx >= p.range[0] && idx < p.range[1]);
    const isPhaseStart = phases.some(p => p.range[0] === idx);
    return {
      ...entry,
      phase: phase?.label ?? '',
      isPhaseStart,
      isHighlight: HIGHLIGHT_YEARS.has(entry.year),
    };
  });
}

/* ── Panorama Grid View ── */
function PanoramaView({ items, onClose }: { items: EnrichedYear[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-neutral-200 px-6 md:px-[8%] pt-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">柴火历程 · 全景</h2>
          <p className="text-xs text-neutral-400 mt-0.5">2011 — 2026，15 年关键事件一览</p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-600 transition-colors duration-200 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          关闭
        </button>
      </div>

      {/* Grid */}
      <div className="px-6 md:px-[8%] py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.03 * items.indexOf(item) }}
              className={`p-5 rounded-xl border transition-colors duration-200 ${
                item.isHighlight
                  ? 'border-brand/30 bg-brand-light'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              {/* Phase tag */}
              {item.isPhaseStart && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand mb-2 block">
                  {item.phase}
                </span>
              )}

              {/* Year */}
              <div className={`text-3xl font-black leading-none mb-3 ${
                item.isHighlight ? 'text-brand' : 'text-neutral-200'
              }`}>
                {item.year}
              </div>

              {/* Events */}
              <div className="space-y-2">
                {item.events.map((ev, j) => (
                  <div key={j}>
                    <p className="text-sm text-neutral-700 leading-snug">
                      <span className="text-brand-dark font-medium mr-1">{ev.month}</span>
                      {ev.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Year Spotlight Timeline ── */
function YearSpotlight({ items }: { items: EnrichedYear[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPanorama, setShowPanorama] = useState(false);

  const scrollPerYear = 350;
  const totalScroll = items.length * scrollPerYear;

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      stRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 0.3,
        anticipatePin: 1,
        onUpdate: (self) => {
          const rawIndex = self.progress * items.length;
          const idx = Math.min(Math.floor(rawIndex), items.length - 1);
          setActiveIndex(idx);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [items, totalScroll]);

  // Jump to a specific year index via scroll position
  const jumpToYear = useCallback((idx: number) => {
    if (!stRef.current) return;
    const st = stRef.current;
    const targetProgress = (idx + 0.5) / items.length;
    const targetScroll = st.start + targetProgress * (st.end - st.start);
    gsap.to(window, {
      scrollTo: { y: targetScroll },
      duration: 0.6,
      ease: 'power2.inOut',
    });
  }, [items.length]);

  // Arrow key navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showPanorama) return;
      if (!stRef.current) return;
      // Only respond when timeline is pinned (active in viewport)
      const st = stRef.current;
      if (st.progress <= 0 || st.progress >= 1) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        jumpToYear(Math.min(activeIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        jumpToYear(Math.max(activeIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, items.length, jumpToYear, showPanorama]);

  const active = items[activeIndex];

  // Animate year number change
  useEffect(() => {
    if (!yearRef.current) return;
    gsap.fromTo(yearRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', overwrite: true }
    );
  }, [activeIndex]);

  // Animate content change
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay: 0.05, overwrite: true }
    );
  }, [activeIndex]);

  // Animate phase label change
  useEffect(() => {
    if (!phaseRef.current) return;
    if (active.isPhaseStart) {
      gsap.fromTo(phaseRef.current,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out', overwrite: true }
      );
    }
  }, [activeIndex, active.isPhaseStart]);

  const progressFraction = useMemo(() => {
    return (activeIndex + 0.5) / items.length;
  }, [activeIndex, items.length]);

  // Lock body scroll when panorama is open
  useEffect(() => {
    document.body.style.overflow = showPanorama ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showPanorama]);

  return (
    <>
      <div ref={sectionRef} className="relative h-screen overflow-hidden bg-neutral-50 border-y border-neutral-200">

        {/* Panorama toggle button — top right */}
        <button
          onClick={() => setShowPanorama(true)}
          className="absolute top-20 right-6 md:right-[10%] lg:right-[12%] z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 hover:border-brand hover:bg-brand-light text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          全景
        </button>

        {/* Main content area */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-[10%] lg:px-[12%]">

          {/* Phase label */}
          <div ref={phaseRef} className="mb-6 h-6">
            {active.isPhaseStart && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                {active.phase}
              </span>
            )}
          </div>

          {/* Year + Events — 移动端上下堆叠，桌面端左右双栏 */}
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-16 lg:gap-24">
            {/* Year number */}
            <div className="shrink-0">
              <div
                ref={yearRef}
                className={`text-[72px] md:text-[160px] lg:text-[200px] font-black leading-none tracking-tight select-none transition-colors duration-300 ${
                  active.isHighlight
                    ? 'text-brand'
                    : 'text-neutral-200'
                }`}
              >
                {active.year}
              </div>
            </div>

            {/* Events */}
            <div ref={contentRef} className="flex-1 max-w-lg md:pt-8">
              <div className="space-y-4 md:space-y-5">
                {active.events.map((ev, j) => (
                  <div key={`${active.year}-${j}`}>
                    <p className="text-neutral-800 text-sm md:text-lg leading-relaxed">
                      <span className="text-brand-dark font-medium mr-2">{ev.month}</span>
                      {ev.text}
                    </p>
                    {ev.en && (
                      <p className="text-neutral-400 text-xs md:text-sm mt-1 leading-relaxed">{ev.en}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom progress bar — clickable */}
        <div className="absolute bottom-6 md:bottom-10 left-4 right-4 md:left-[10%] md:right-[10%] lg:left-[12%] lg:right-[12%]">
          {/* Track line */}
          <div className="relative h-[2px] bg-neutral-200 rounded-full">
            <div
              className="absolute top-0 left-0 h-full bg-brand rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressFraction * 100}%` }}
            />
          </div>

          {/* Year dots — clickable, mobile: horizontally scrollable */}
          <div className="relative flex justify-between mt-[-5px] overflow-x-auto scrollbar-none">
            {items.map((item, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;

              return (
                <button
                  key={item.year}
                  onClick={() => jumpToYear(i)}
                  className="flex flex-col items-center cursor-pointer group py-1 min-w-[20px] md:min-w-0"
                  title={`${item.year}`}
                >
                  {/* Dot */}
                  <div
                    className={`rounded-full transition-all duration-300 group-hover:scale-150 ${
                      isActive
                        ? 'w-3 h-3 bg-brand shadow-[0_0_12px_rgba(243,210,48,0.4)]'
                        : isPast
                          ? 'w-2 h-2 bg-brand/60 group-hover:bg-brand'
                          : 'w-2 h-2 bg-neutral-300 group-hover:bg-brand/40'
                    }`}
                  />
                  {/* Year label — mobile: only show active; desktop: show active + highlights + hover */}
                  <span
                    className={`text-[9px] md:text-[10px] mt-1.5 md:mt-2 font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-neutral-700 opacity-100'
                        : item.isHighlight
                          ? 'text-neutral-400 hidden md:block opacity-100 group-hover:text-neutral-700'
                          : 'text-neutral-400 opacity-0 hidden md:block group-hover:opacity-100'
                    }`}
                  >
                    {item.year}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll hint — fade out after first scroll */}
        <div
          className="absolute bottom-16 md:bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2 text-neutral-400 text-xs select-none transition-opacity duration-500"
          style={{ opacity: activeIndex === 0 ? 1 : 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-bounce">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          向下滚动浏览历程
        </div>
      </div>

      {/* Panorama overlay */}
      <AnimatePresence>
        {showPanorama && (
          <PanoramaView items={items} onClose={() => setShowPanorama(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Stats Counter ── */
const STATS = [
  { value: 15, suffix: '年', label: '持续深耕' },
  { value: 30, suffix: '+', label: '关键事件' },
  { value: 3, suffix: '', label: '发展阶段' },
  { value: 6, suffix: '+', label: '全球伙伴' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: value,
          duration: 1.5,
          ease: 'power2.out',
          snap: { innerText: 1 },
          onUpdate() {
            el.textContent = Math.round(Number(el.textContent || '0')) + suffix;
          },
        });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ── Main Component ── */
export default function AboutContent({ timelineData, phases, partners, heroImage }: AboutContentProps) {
  const enrichedYears = enrichYears(timelineData, phases);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero — 左右分栏：信息 | 图片 */}
      <section className="relative min-h-[480px] md:min-h-[560px] flex flex-col md:flex-row">
        {/* Left — 信息区 */}
        <div className="flex-1 flex flex-col justify-center pt-28 md:pt-32 pb-10 md:pb-12 px-6 md:pl-[12%] md:pr-12">
          <motion.div variants={stagger(0.12)} initial="hidden" animate="visible">
            <motion.p
              className="text-xs tracking-[0.3em] text-neutral-400 uppercase mb-3"
              variants={fadeUp}
              transition={springTransition}
            >
              About Chaihuo
            </motion.p>
            <motion.h1
              variants={fadeUp}
              transition={springTransition}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4 leading-tight"
            >
              柴火 15 年，从创客空间到基地车。
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={springTransition}
              className="text-sm md:text-base text-neutral-500 leading-relaxed mb-8 max-w-md"
            >
              自 2011 年成立以来，柴火创客空间始终是连接创意与制造的桥梁。十五年来，无数想法在这里萌芽、原型化、量产直至走向全球。
            </motion.p>
          </motion.div>

          {/* 数据条 */}
          <div className="flex gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ ...springTransition, delay: 0.3 + i * 0.08 }}
              >
                <div className="text-2xl md:text-3xl font-black text-brand leading-none">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — 图片区（桌面端右侧，移动端底部条形） */}
        <div className="h-48 md:h-auto md:w-[45%] relative">
          <img
            src={heroImage}
            alt="基地车旅途风光"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent w-24" />
        </div>
      </section>

      {/* 年份聚光灯时间轴 */}
      <YearSpotlight items={enrichedYears} />

      {/* Partners */}
      <section className="py-20 px-6 md:px-[12%] bg-neutral-50">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          transition={springTransition}
          className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-12 text-center"
        >
          共建伙伴 / Partners
        </motion.p>
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="flex flex-wrap justify-center gap-6"
        >
          {partners.map((partner) => (
            <motion.div
              key={partner.name}
              variants={fadeUp}
              transition={springTransition}
              className="flex flex-col items-center justify-center py-6 px-4 w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(16.666%-20px)] rounded-xl border border-neutral-200 bg-white hover:border-brand/30 hover:shadow-sm transition-all duration-200"
            >
              <span className="text-lg font-bold text-neutral-400 hover:text-neutral-900 transition-colors duration-200 cursor-default">
                {partner.name}
              </span>
              {partner.description && (
                <span className="text-xs text-neutral-400 mt-1.5 text-center">{partner.description}</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 愿景收尾 */}
      <section className="py-20 px-6 md:px-[12%] bg-white">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          transition={springTransition}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-8 h-[2px] bg-brand mx-auto mb-8" />
          <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed font-light italic">
            "我们坚信，科技平权意味着每个人都有权享受数字化发展的红利。柴火基地车是我们对此最激进、最浪漫的实践。"
          </p>
          <p className="mt-6 text-sm text-neutral-400">— 潘昊，柴火创客空间创始人</p>
        </motion.div>
      </section>

      {/* 底部 CTA */}
      <section className="py-16 px-6 md:px-[12%] bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-neutral-900 mb-3">想加入这段旅程？</h3>
          <p className="text-neutral-500 mb-6">从跟车同行到在地共创，找到属于你的参与方式</p>
          <a
            href="/guide"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-8 py-3 rounded-full hover:bg-brand-hover transition-colors duration-200 cursor-pointer font-medium"
          >
            了解如何参与
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>
    </div>
  );
}
