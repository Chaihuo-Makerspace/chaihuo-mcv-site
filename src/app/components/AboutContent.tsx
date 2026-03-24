import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { fadeUp, scaleIn, stagger, springTransition, defaultViewport } from './motion';
import { ChevronLeft, ChevronRight, Mouse } from 'lucide-react';

interface YearEntry {
  year: string;
  events: { month: string; text: string; en?: string }[];
}

interface Phase {
  label: string;
  range: number[];
}

interface AboutContentProps {
  timelineData: YearEntry[];
  phases: Phase[];
  partners: string[];
}

export default function AboutContent({ timelineData, phases, partners }: AboutContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* 标题区 */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger(0.2)}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.p
              className="text-sm tracking-[0.3em] text-neutral-400 uppercase mb-3"
              variants={fadeUp}
              transition={springTransition}
            >
              About Chaihuo
            </motion.p>
            <motion.h1
              variants={fadeUp}
              transition={springTransition}
              className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight"
            >
              柴火 15 年，
              <br />
              从创客空间到基地车。
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={springTransition}
              className="text-base text-neutral-500 leading-relaxed"
            >
              自 2011 年成立以来，柴火创客空间（Chaihuo Maker Space）始终是连接创意与制造的桥梁。十五年来，我们见证了无数想法在这里萌芽、原型化、量产直至走向全球。
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-24 px-6 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-8"
          >
            我们的愿景
          </motion.p>
          <motion.h2
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="text-3xl md:text-5xl font-bold mb-10 leading-tight"
          >
            让 AI 走出云端，
            <br />
            连接数字与现实。
          </motion.h2>
          <motion.blockquote
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={{ ...springTransition, delay: 0.2 }}
            className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
          >
            "我们坚信，科技平权意味着每个人无论身处大都市还是偏远荒野，都有权享受数字化发展的红利。柴火基地车是我们对此最激进、最浪漫的实践。"
          </motion.blockquote>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">柴火历程</h2>
              <p className="text-neutral-500">2011 — 2024，从一间房到一辆车</p>
            </div>

            {/* Brand-colored nav buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scrollTimeline('left')}
                className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-brand hover:text-brand-foreground transition-colors duration-200 cursor-pointer shadow-sm"
                aria-label="向左滚动"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollTimeline('right')}
                className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-brand hover:text-brand-foreground transition-colors duration-200 cursor-pointer shadow-sm"
                aria-label="向右滚动"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal scrolling timeline */}
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {(() => {
            const colW = 260;
            const totalW = timelineData.length * colW + 120;
            const centerY = 280;
            const amplitude = 40;

            const getYOffset = (i: number) => Math.sin((i / (timelineData.length - 1)) * Math.PI * 2.5) * amplitude;

            const points = timelineData.map((_, i) => ({
              x: i * colW + 60 + colW / 2,
              y: centerY + getYOffset(i),
            }));

            const curvePath = points.reduce((path, pt, i) => {
              if (i === 0) return `M ${pt.x - colW} ${centerY} Q ${pt.x - colW / 2} ${pt.y} ${pt.x} ${pt.y}`;
              const prev = points[i - 1];
              const cpX = (prev.x + pt.x) / 2;
              return `${path} S ${cpX} ${pt.y} ${pt.x} ${pt.y}`;
            }, '');

            return (
              <div className="relative min-w-max" style={{ width: totalW, height: 560 }}>
                {/* SVG curve */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={totalW}
                  height={560}
                  fill="none"
                >
                  <path
                    d={curvePath}
                    stroke="#f3d230"
                    strokeWidth="2.5"
                    strokeDasharray="10 8"
                    opacity="0.35"
                  />
                  {points.map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#f3d230" stroke="white" strokeWidth="3" />
                  ))}
                </svg>

                {/* Year + events */}
                {timelineData.map((entry, i) => {
                  const isAbove = i % 2 === 0;
                  const x = i * colW + 60;
                  const yOffset = getYOffset(i);
                  const phase = phases.find(p => i >= p.range[0] && i < p.range[1]);
                  const showPhaseLabel = phase && i === phase.range[0];

                  return (
                    <div
                      key={entry.year}
                      className="absolute"
                      style={{
                        left: x,
                        top: 0,
                        width: colW,
                        height: 560,
                      }}
                    >
                      {/* Events above */}
                      <div
                        className="absolute left-0 right-8 flex flex-col justify-end"
                        style={{
                          bottom: 560 - centerY - yOffset + 50,
                          height: 180,
                        }}
                      >
                        {isAbove && entry.events.map((ev, j) => (
                          <div key={j} className="mb-3 last:mb-0">
                            <p className="text-[13px] font-bold text-neutral-900 leading-snug">
                              {ev.month}：{ev.text}
                            </p>
                            {ev.en && (
                              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{ev.en}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Year number along curve */}
                      <div
                        className="absolute left-0"
                        style={{ top: centerY + yOffset - 50 }}
                      >
                        <span className="text-[72px] md:text-[90px] font-black leading-none select-none tracking-tighter text-neutral-200 hover:text-brand/40 transition-colors duration-500">
                          {entry.year}
                        </span>
                        {showPhaseLabel && (
                          <span className="block mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-300 whitespace-nowrap select-none">
                            {phase.label}
                          </span>
                        )}
                      </div>

                      {/* Events below */}
                      <div
                        className="absolute left-0 right-8 flex flex-col justify-start"
                        style={{
                          top: centerY + yOffset + 50,
                          height: 180,
                        }}
                      >
                        {!isAbove && entry.events.map((ev, j) => (
                          <div key={j} className="mb-3 last:mb-0">
                            <p className="text-[13px] font-bold text-neutral-900 leading-snug">
                              {ev.month}：{ev.text}
                            </p>
                            {ev.en && (
                              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{ev.en}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Sticky bottom hint bar — scroll tip always visible */}
        <div className="hidden md:flex sticky bottom-6 z-40 justify-center pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-3 bg-neutral-900 text-white rounded-full px-4 py-2 shadow-lg">
            <Mouse className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[11px] text-neutral-400 select-none">
              <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded font-mono text-neutral-300">Shift</kbd>
              {' + 滚轮 横向滚动 · 触控板双指横滑'}
            </span>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-6 bg-white border-t border-neutral-300">
        <div className="max-w-6xl mx-auto">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="text-xs uppercase tracking-[0.2em] text-neutral-500 text-center mb-10"
          >
            共建伙伴 / Partners
          </motion.p>
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="flex items-center justify-center gap-10 md:gap-16 flex-wrap"
          >
            {partners.map((name) => (
              <motion.span
                key={name}
                variants={fadeUp}
                transition={springTransition}
                className="text-xl md:text-2xl font-bold text-neutral-300 hover:text-neutral-900 transition-colors duration-300 cursor-default"
              >
                {name}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
