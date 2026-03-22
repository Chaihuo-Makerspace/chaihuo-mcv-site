import { useRef } from 'react';
import { motion } from 'motion/react';
import { fadeUp, fadeLeft, fadeRight, scaleIn, stagger, springTransition, defaultViewport } from '../components/motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Footer } from '../components/Footer';

interface YearEntry {
  year: string;
  events: { month: string; text: string; en?: string }[];
}

const TIMELINE_DATA: YearEntry[] = [
  { year: '2011', events: [
    { month: '8月', text: '柴火创客空间成立', en: 'Chaihuo Makerspace was officially founded.' },
  ]},
  { year: '2012', events: [
    { month: '4月', text: '将 Maker Faire 引入中国，首站落地深圳', en: 'Brought Maker Faire to China and hosted the first in Shenzhen.' },
    { month: '12月', text: '迁址华侨城创意园，社区更跨界', en: 'Relocated to OCT-LOFT, fostering a more interdisciplinary community.' },
  ]},
  { year: '2013', events: [
    { month: '8月', text: '创始人潘昊荣登《福布斯》杂志封面', en: 'Founder Eric Pan appeared on the cover of Forbes magazine.' },
  ]},
  { year: '2014', events: [
    { month: '4月', text: '深圳 Maker Faire 升级为 Featured 级别，成为全球第 7 个最大级别活动', en: 'Maker Faire Shenzhen upgraded to a "Featured" event, the 7th largest globally.' },
    { month: '11月', text: '两院院士路甬祥到访柴火创客空间', en: 'Lu Yongxiang, academician, visited Chaihuo MakerSpace.' },
  ]},
  { year: '2015', events: [
    { month: '1月', text: '国务院总理李克强到访柴火，并成为空间荣誉会员', en: 'Premier Li Keqiang visited Chaihuo and became an honorary member.' },
    { month: '12月', text: '柴火入选成为国际级众创空间', en: 'Chaihuo was recognized as a national-level maker space.' },
  ]},
  { year: '2016', events: [
    { month: '4月', text: 'WIRED 杂志"未来城市"纪录片《深圳：硬件硅谷》拍摄', en: 'WIRED filmed "Future Cities: Shenzhen — The Silicon Valley of Hardware" at Chaihuo.' },
    { month: '8月', text: '白宫高级科技顾问 Kate Cage 到访', en: 'Kate Cage, Senior Technology Advisor at the White House, visited Chaihuo.' },
  ]},
  { year: '2017', events: [
    { month: '3月', text: '柴火创客空间升级为产业对接平台，落户万科云设计公社', en: 'Transitioned into an industrial collaboration platform at Vanke Design Commune.' },
    { month: '12月', text: '天猫新零售项目合作', en: 'Partnered with Tmall on a New Retail initiative.' },
  ]},
  { year: '2018', events: [
    { month: '8月', text: '华润集团智慧空间项目合作', en: 'Partnered with China Resources Group on a Smart Space project.' },
    { month: '10月', text: '柴火创客空间正式落户河北', en: 'Official Opening of Hebei Chaihuo Makerspace.' },
  ]},
  { year: '2019', events: [
    { month: '4月', text: '索尼工作坊顺利举行，探控行业创新应用', en: 'Successfully hosted the Sony Workshop, exploring industrial applications.' },
    { month: '7月', text: '罗姆（ROHM）正式成为柴火创客空间社区伙伴', en: 'ROHM became an official community partner of Chaihuo.' },
  ]},
  { year: '2020', events: [
    { month: '3月', text: '与 Arduino 达成官方认证中国区战略合作', en: 'Strategic partnership with Arduino as certified partner in China.' },
    { month: '5月', text: '新一代信息技术赋能计划在深圳落地', en: 'Launched the Next-Gen Information Technology Empowerment Program.' },
  ]},
  { year: '2021', events: [
    { month: '4月', text: '全面升级会员体系，打造线上会员生态', en: 'Upgraded the membership system to create an online ecosystem.' },
    { month: '12月', text: '携手微软 Azure 举办物联网技术研讨会', en: 'Hosted an IoT technology seminar with Microsoft Azure.' },
  ]},
  { year: '2022', events: [
    { month: '1月', text: '推出"创客马拉松"等客制方案，赋能高校"双创教育"', en: 'Introduced "Maker Hackathon" programs to empower university innovation education.' },
    { month: '7月', text: '聚焦"数字乡村"领域发起"数字乡村先锋计划"', en: 'Launched the Digital Rural Pioneer Program.' },
  ]},
  { year: '2023', events: [
    { month: '11月', text: 'Maker Faire Shenzhen 重启回归', en: 'Maker Faire Shenzhen made its official comeback.' },
  ]},
  { year: '2024', events: [
    { month: '1月', text: '携手矽递科技启动 Maker Camp in Shenzhen 项目', en: 'Launched Maker Camp in Shenzhen with Seeed Studio.' },
    { month: '12月', text: '成都柴火创客空间暨 Fab Lab Chengdu 正式开幕', en: 'Official Opening of Chengdu Chaihuo Makerspace and Fab Lab Chengdu.' },
  ]},
];

// 阶段分界：社区 Community → 文化 Culture → 产业 Industry
const PHASES = [
  { label: '社区 Community', range: [0, 3] },    // 2011-2014
  { label: '文化 Culture', range: [3, 7] },       // 2015-2018
  { label: '产业 Industry', range: [7, 14] },     // 2019-2024
];

const PARTNERS = ['Seeed Studio', 'NVIDIA', 'Starlink', 'Maker Media', 'UNESCO', 'DJI'];


export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);

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

      {/* ═══ Hero ═══ */}
      <section className="relative min-h-[70vh] flex items-center bg-white overflow-hidden">
        {/* 装饰图片（右侧半透明） */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&q=80)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-32 md:py-40">
          <motion.div
            variants={stagger(0.2)}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.h1
              variants={fadeUp}
              transition={springTransition}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-8 leading-tight"
            >
              柴火 15 年，
              <br />
              从创客空间到基地车。
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={springTransition}
              className="text-lg md:text-xl text-neutral-500 leading-relaxed"
            >
              自 2011 年成立以来，柴火创客空间（Chaihuo Maker Space）始终是连接创意与制造的桥梁。十五年来，我们见证了无数想法在这里萌芽、原型化、量产直至走向全球。
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══ 愿景 ═══ */}
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



      {/* ═══ 柴火历程 — 大字年份 + 上下交错事件 ═══ */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="flex items-end justify-between"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">柴火历程</h2>
              <p className="text-neutral-500">2011 — 2024，从一间房到一辆车</p>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollTimeline('left')}
                className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollTimeline('right')}
                className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* 横向滑动时间线 — 年份沿曲线浮动 */}
        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {(() => {
            const colW = 260;
            const totalW = TIMELINE_DATA.length * colW + 120;
            const centerY = 280;
            const amplitude = 40;

            // 每个年份的 Y 偏移（正弦曲线）
            const getYOffset = (i: number) => Math.sin((i / (TIMELINE_DATA.length - 1)) * Math.PI * 2.5) * amplitude;

            // SVG 曲线路径
            const points = TIMELINE_DATA.map((_, i) => ({
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
                {/* SVG 曲线 */}
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
                  {/* 节点圆点 */}
                  {points.map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#f3d230" stroke="white" strokeWidth="3" />
                  ))}
                </svg>

                {/* 年份 + 事件 */}
                {TIMELINE_DATA.map((entry, i) => {
                  const isAbove = i % 2 === 0;
                  const x = i * colW + 60;
                  const yOffset = getYOffset(i);
                  const phase = PHASES.find(p => i >= p.range[0] && i < p.range[1]);
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
                      {/* 上方事件 */}
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

                      {/* 年份数字 — 沿曲线偏移 */}
                      <div
                        className="absolute left-0"
                        style={{ top: centerY + yOffset - 50 }}
                      >
                        <span className="text-[72px] md:text-[90px] font-black leading-none select-none tracking-tighter text-neutral-200 hover:text-brand/40 transition-colors duration-500">
                          {entry.year}
                        </span>
                        {/* 阶段标签 */}
                        {showPhaseLabel && (
                          <span className="block mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-300 whitespace-nowrap select-none">
                            {phase.label}
                          </span>
                        )}
                      </div>

                      {/* 下方事件 */}
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
      </section>

      {/* ═══ 合作伙伴 ═══ */}
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
            {PARTNERS.map((name) => (
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

      <Footer />
    </div>
  );
}
