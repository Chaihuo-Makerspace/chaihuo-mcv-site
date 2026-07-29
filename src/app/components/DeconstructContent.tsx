import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Camera,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Github,
  GraduationCap,
  HeartHandshake,
  type LucideIcon,
  MapPin,
  MessagesSquare,
  Mic,
  PlugZap,
  Presentation,
  Radar,
  RadioTower,
  Sparkles,
  Thermometer,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Locale } from '@/i18n/index';
import { localePath } from '@/i18n/index';
import { defaultViewport, fadeUp, springTransition, stagger } from './motion';

// ─── Types ───

interface SolutionRef {
  id: string;
  url: string;
  image: string;
  title: string;
}

interface TechModule {
  id: string;
  icon: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  devices: string[];
  solution?: SolutionRef | null;
}

interface CocreationItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  tagline: string;
  url: string;
  scenarios: string[];
  solutions: SolutionRef[];
}

interface NoteEntry {
  date: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  yuqueUrl?: string;
}

interface Props {
  techModules: TechModule[];
  courses: Course[];
  directions: CocreationItem[];
  programs: CocreationItem[];
  notes: NoteEntry[];
  locale?: Locale;
  t: Record<string, string>;
}

// ─── Icon map ───

const ICON_MAP: Record<string, LucideIcon> = {
  Cpu,
  Bot,
  Camera,
  Mic,
  RadioTower,
  Thermometer,
  Radar,
  PlugZap,
  CircuitBoard,
  BrainCircuit,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessagesSquare,
  Truck,
};

const GITHUB_URL = 'https://github.com/Chaihuo-Makerspace/chaihuo-mcv-gears';
const YUQUE_URL = 'https://www.yuque.com/chaihuo-mcv/home';
const ACADEMY_CONTACT_URL = 'https://opc.chaihuo.org/contact';

// ─── Section heading ───

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      className="text-center mb-12"
      variants={stagger(0.15)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
    >
      {eyebrow && (
        <motion.p
          className="text-sm tracking-[0.3em] text-neutral-500 uppercase mb-3"
          variants={fadeUp}
          transition={springTransition}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-neutral-900"
        variants={fadeUp}
        transition={springTransition}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="text-neutral-500 mt-3 max-w-2xl mx-auto"
          variants={fadeUp}
          transition={springTransition}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

// ─── Component ───

export default function DeconstructContent({
  techModules,
  courses,
  directions,
  programs,
  notes,
  locale = 'zh',
  t,
}: Props) {
  return (
    <div className="min-h-screen bg-surface">
      {/* ═══════ 1. HERO — 理念 + 整车技术图 ═══════ */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
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
              {t['hero.subtitle']}
            </motion.p>
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-neutral-900 mb-4"
              variants={fadeUp}
              transition={springTransition}
            >
              {t['hero.title']}
            </motion.h1>
            <motion.p
              className="text-lg text-neutral-500 max-w-xl mx-auto"
              variants={fadeUp}
              transition={springTransition}
            >
              {t['hero.body']}
            </motion.p>
          </motion.div>

          {/* 整车技术全景图 */}
          <motion.div
            className="rounded-2xl overflow-hidden shadow-md mb-5"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <img
              src="/deconstruct/vehicle-tech-map.webp"
              alt={t['hero.imageAlt']}
              className="w-full h-auto"
              loading="eager"
            />
          </motion.div>

          {/* 车辆速览 */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {[
              { label: t['specs.range'], value: '430 km' },
              { label: t['specs.height'], value: '2.5 m' },
              { label: t['specs.battery'], value: '3 kWh' },
              { label: t['specs.compute'], value: '275 TOPS' },
              { label: t['specs.comms'], value: '5G · WiFi · LoRa' },
              { label: t['specs.fab'], value: t['specs.fabValue'] },
            ].map((spec) => (
              <motion.div
                key={spec.label}
                variants={fadeUp}
                transition={springTransition}
                className="bg-surface-card rounded-lg px-2 py-4 text-center shadow-sm"
              >
                <div className="text-lg font-bold text-neutral-900 whitespace-nowrap">
                  {spec.value}
                </div>
                <div className="text-xs text-neutral-500 mt-1 whitespace-nowrap">{spec.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ 1b. 车载技术卡片 ═══════ */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow={t['tech.eyebrow']}
            title={t['tech.title']}
            subtitle={t['tech.subtitle']}
          />

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {techModules.map((mod) => {
              const IconComponent = ICON_MAP[mod.icon] ?? Cpu;
              const body = (
                <>
                  {mod.solution && (
                    <div className="h-28 overflow-hidden -mx-4 -mt-4 mb-3 rounded-t-xl">
                      <img
                        src={mod.solution.image}
                        alt={mod.solution.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4 text-brand" />
                    </div>
                    <p className="text-[11px] tracking-wide text-neutral-500 uppercase">
                      {mod.category}
                    </p>
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1">{mod.title}</h3>
                  <p className="text-xs text-neutral-500 mb-2">{mod.subtitle}</p>
                  <p className="text-sm text-neutral-700 leading-relaxed flex-1">
                    {mod.description}
                  </p>
                  {mod.solution && (
                    <div className="mt-3 flex items-center gap-1 text-sm text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200">
                      {t['tech.viewSolution']}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </>
              );
              const cardClass =
                'bg-surface-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col';
              return mod.solution ? (
                <motion.a
                  key={mod.id}
                  href={mod.solution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} cursor-pointer group`}
                  variants={fadeUp}
                  transition={springTransition}
                  whileHover={{ y: -4 }}
                >
                  {body}
                </motion.a>
              ) : (
                <motion.div
                  key={mod.id}
                  className={cardClass}
                  variants={fadeUp}
                  transition={springTransition}
                  whileHover={{ y: -4 }}
                >
                  {body}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════ 2. 合作伙伴共创 ═══════ */}
      <section className="px-6 py-20 bg-surface-card border-y border-neutral-300">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow={t['cocreate.eyebrow']}
            title={t['cocreate.title']}
            subtitle={t['cocreate.subtitle']}
          />

          {/* 共创逻辑三步 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14"
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {[
              {
                icon: Presentation,
                title: t['cocreate.logic1.title'],
                desc: t['cocreate.logic1.desc'],
              },
              {
                icon: GraduationCap,
                title: t['cocreate.logic2.title'],
                desc: t['cocreate.logic2.desc'],
              },
              {
                icon: Sparkles,
                title: t['cocreate.logic3.title'],
                desc: t['cocreate.logic3.desc'],
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                className="bg-surface rounded-xl p-4 shadow-sm"
                variants={fadeUp}
                transition={springTransition}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 text-brand" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500">0{index + 1}</span>
                  <h4 className="text-base font-semibold text-neutral-900">{step.title}</h4>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* 课程体系 */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14"
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {courses.map((course) => (
              <motion.div
                key={course.id}
                className="bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                variants={fadeUp}
                transition={springTransition}
                whileHover={{ y: -4 }}
              >
                {/* 关联场景头图（可点击跳转方案页） */}
                {course.solutions.length > 0 && (
                  <div
                    className={`grid gap-px ${course.solutions.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                  >
                    {course.solutions.map((sol) => (
                      <a
                        key={sol.id}
                        href={sol.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block h-32 overflow-hidden cursor-pointer group/sol"
                        title={sol.title}
                      >
                        <img
                          src={sol.image}
                          alt={sol.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover/sol:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/70 to-transparent px-2.5 pb-1.5 pt-6 text-[11px] font-medium text-white">
                          {sol.title}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-lg bg-brand text-brand-foreground font-mono font-bold text-sm flex items-center justify-center shrink-0">
                      {course.code}
                    </span>
                    <h4 className="text-base font-semibold text-neutral-900">{course.title}</h4>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed flex-1">
                    {course.tagline}
                  </p>
                  <div className="mt-4">
                    <p className="text-[10px] tracking-wide text-neutral-500 uppercase mb-1.5">
                      {t['cocreate.courseScenarios']}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {course.scenarios.map((scenario) => (
                        <span
                          key={scenario}
                          className="text-[10px] font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded"
                        >
                          {scenario}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t['cocreate.courseLink']}: ${course.code} ${course.title}`}
                    className="mt-4 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
                  >
                    {t['cocreate.courseLink']}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 共创方案 — 有场景、有需求，我们开车过去 */}
          <motion.div
            className="mt-24 mb-8 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <h3 className="text-xl font-semibold text-neutral-900">
              {t['cocreate.programsTitle']}
            </h3>
            <p className="text-sm text-neutral-500 mt-2">{t['cocreate.programsSubtitle']}</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {programs.map((item, index) => {
              const IconComponent = ICON_MAP[item.icon] ?? MapPin;
              return (
                <motion.div
                  key={item.id}
                  className="bg-surface rounded-xl p-5 shadow-sm"
                  variants={fadeUp}
                  transition={springTransition}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-brand" />
                    </div>
                    <span className="text-xs font-mono text-neutral-500">0{index + 1}</span>
                  </div>
                  <h4 className="text-base font-semibold text-neutral-900 mb-1.5">{item.title}</h4>
                  <p className="text-sm text-neutral-700 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <a
              href={ACADEMY_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-8 py-3 rounded-full hover:bg-brand-hover transition-colors duration-200 cursor-pointer font-medium"
            >
              {t['cocreate.cta']}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════ 3. 开源改装与路线图 ═══════ */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow={t['opensource.eyebrow']}
            title={t['opensource.title']}
            subtitle={t['opensource.subtitle']}
          />

          {/* 呼唤朋友 — 把方案复制到更多地方 */}
          <motion.h3
            className="text-xl font-semibold text-neutral-900 mb-6 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            {t['cocreate.directionsTitle']}
          </motion.h3>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {directions.map((item) => {
              const IconComponent = ICON_MAP[item.icon] ?? CircuitBoard;
              return (
                <motion.div
                  key={item.id}
                  className="bg-surface-card rounded-xl p-5 shadow-sm"
                  variants={fadeUp}
                  transition={springTransition}
                >
                  <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5 text-brand" />
                  </div>
                  <h4 className="text-base font-semibold text-neutral-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-neutral-700 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="text-center mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-neutral-300 bg-surface-card text-neutral-900 px-8 py-3 rounded-full hover:border-neutral-500 transition-colors duration-200 cursor-pointer font-medium"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              {t['opensource.github']}
            </a>
          </motion.div>

          {/* 改装手记 */}
          <motion.h3
            className="text-xl font-semibold text-neutral-900 mb-8 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            {t['cases.title']}
          </motion.h3>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {notes.map((note) => (
              <motion.div
                key={note.title}
                className="bg-surface-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                variants={fadeUp}
                transition={springTransition}
              >
                <a
                  href={note.yuqueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={note.image} alt={note.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-neutral-900 mb-1.5 line-clamp-1 group-hover:text-brand transition-colors duration-200">
                      {note.title}
                    </h4>
                    {note.description && (
                      <p className="text-xs text-neutral-700 leading-relaxed line-clamp-2 mb-3">
                        {note.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <time className="text-xs text-neutral-500 font-mono shrink-0">
                        {note.date}
                      </time>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </motion.div>

          {/* 移动端查看全部 */}
          <motion.div
            className="mb-14 text-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
          >
            <a
              href={YUQUE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
            >
              {t['cases.viewAll']}
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-16 px-6 bg-surface-card border-t border-neutral-300">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-neutral-900 mb-3">{t['cta.title']}</h3>
          <p className="text-neutral-500 mb-6">{t['cta.body']}</p>
          <a
            href={localePath('/guide', locale)}
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-8 py-3 rounded-full hover:bg-brand-hover transition-colors duration-200 cursor-pointer font-medium"
          >
            {t['cta.button']}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
