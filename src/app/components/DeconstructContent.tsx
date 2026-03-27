import { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { fadeUp, fadeIn, stagger, springTransition, defaultViewport } from './motion';

// SSR 阶段跳过 Three.js 解析 — 返回永不 resolve 的 Promise，Suspense 渲染 fallback
const VehicleExplodedView = lazy(() =>
  typeof window === 'undefined'
    ? new Promise<{ default: React.ComponentType }>(() => {})
    : import('./VehicleExplodedView').then((m) => ({ default: m.VehicleExplodedView })),
);
import { Cpu, Factory, BatteryCharging, ChevronRight } from 'lucide-react';

// ─── Types ───

interface NoteEntry {
  date: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
}

interface EquipmentCategory {
  icon: string;
  title: string;
  items: { name: string; spec: string }[];
}

interface Props {
  notes: NoteEntry[];
  equipment: EquipmentCategory[];
}

// ─── Icon map ───

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Cpu,
  Factory,
  BatteryCharging,
};

// ─── Component ───

export default function DeconstructContent({ notes, equipment }: Props) {
  return (
    <div className="min-h-screen bg-surface">

      {/* ═══════ HERO — 车辆标题 + 爆炸图 ═══════ */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* 标题区 */}
          <motion.div
            className="text-center mb-12"
            variants={stagger(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            <motion.p
              className="text-sm tracking-[0.3em] text-neutral-500 uppercase mb-3"
              variants={fadeUp}
              transition={springTransition}
            >
              Chaihuo Base Vehicle
            </motion.p>
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-neutral-900 mb-4"
              variants={fadeUp}
              transition={springTransition}
            >
              普罗米修斯号
            </motion.h1>
            <motion.p
              className="text-lg text-neutral-500 max-w-xl mx-auto"
              variants={fadeUp}
              transition={springTransition}
            >
              一台为荒野而生的移动AI实验室，从底盘到算力，每一处都为极限场景而设计。
            </motion.p>
          </motion.div>

          {/* 车辆速览 */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {[
              { label: '纯电续航', value: '430 km' },
              { label: '车内净高', value: '2.5 m' },
              { label: '外放电', value: 'V2L 220V' },
              { label: '安全认证', value: 'NCAP 铂金' },
            ].map((spec) => (
              <motion.div
                key={spec.label}
                variants={fadeUp}
                transition={springTransition}
                className="bg-white rounded-lg p-4 text-center shadow-sm"
              >
                <div className="text-xl font-bold text-neutral-900">{spec.value}</div>
                <div className="text-xs text-neutral-500 mt-1">{spec.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* 车辆 3D 爆炸图 — R3F + Drei */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={{ duration: 0.8 }}
          >
            <Suspense
              fallback={
                <div className="w-full h-[500px] md:h-[600px] rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-300 flex items-center justify-center">
                  <div className="text-neutral-500 text-sm animate-pulse">加载 3D 模型中...</div>
                </div>
              }
            >
              <VehicleExplodedView />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* ═══════ 改装手记 ═══════ */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-end justify-between mb-8"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">改装手记</h2>
              <p className="text-neutral-500 mt-2">从图纸到荒野的每一步</p>
            </div>
            <a
              href="https://www.yuque.com/chaihuo-mcv/home"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 items-center gap-1 cursor-pointer"
            >
              前往语雀查看全部
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {notes.map((note, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
                variants={fadeUp}
                transition={springTransition}
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={note.image}
                    alt={note.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-1">{note.title}</h3>
                  <time className="text-xs text-neutral-400 font-mono">{note.date}</time>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 移动端 CTA */}
          <motion.div
            className="mt-6 text-center md:hidden"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <a
              href="https://www.yuque.com/chaihuo-mcv/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
            >
              前往语雀查看全部手记
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════ 装备清单 ═══════ */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">装备清单</h2>
            <p className="text-neutral-500 mt-2">荒野生存的全部家当</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {equipment.map((category) => {
              const IconComponent = ICON_MAP[category.icon] ?? Cpu;
              return (
                <motion.div
                  key={category.title}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  variants={fadeUp}
                  transition={springTransition}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-brand" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-neutral-900">{category.title}</h3>
                  </div>

                  <div className="divide-y divide-neutral-300">
                    {category.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-baseline py-3 first:pt-0 last:pb-0"
                      >
                        <span className="text-sm text-neutral-700">{item.name}</span>
                        <span className="text-xs text-neutral-500 font-mono text-right ml-4 shrink-0">
                          {item.spec}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-16 px-6 bg-white border-t border-neutral-200">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-neutral-900 mb-3">想亲身体验普罗米修斯号？</h3>
          <p className="text-neutral-500 mb-6">从跟车同行到在地合作，多种方式等你参与</p>
          <a
            href="/guide"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-8 py-3 rounded-full hover:bg-brand-hover transition-colors duration-200 cursor-pointer font-medium"
          >
            查看上车指南
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>
    </div>
  );
}
