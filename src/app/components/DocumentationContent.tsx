import { useState } from 'react';
import { motion } from 'motion/react';
import { fadeUp, stagger, springTransition, defaultViewport } from './motion';
import { Clock, Play, FileText, ArrowRight } from 'lucide-react';

type Category = '全部' | '人物访谈' | '路上VLOG' | '公益合作纪录片';

interface VideoLink {
  platform: string;
  url: string;
}

interface DocEntry {
  id: string | number;
  slug?: string;
  date: string;
  category: string;
  title: string;
  description: string;
  readTime?: string;
  coverImage?: string;
  videoLinks?: VideoLink[];
  pdfName?: string;
}

interface Props {
  docs: DocEntry[];
}

const CATEGORIES: Category[] = ['全部', '人物访谈', '路上VLOG', '公益合作纪录片'];

const CATEGORY_COLORS: Record<string, string> = {
  '人物访谈': 'bg-blue-100 text-blue-700',
  '路上VLOG': 'bg-brand/15 text-brand-dark',
  '公益合作纪录片': 'bg-purple-100 text-purple-700',
};

export default function DocumentationContent({ docs }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('全部');

  const filteredItems = activeCategory === '全部'
    ? docs
    : docs.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface">

      {/* 标题区 */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={stagger(0.2)}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              className="text-sm tracking-[0.3em] text-neutral-400 uppercase mb-3"
              variants={fadeUp}
              transition={springTransition}
            >
              Documentary
            </motion.p>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4"
              variants={fadeUp}
              transition={springTransition}
            >
              循迹中国
            </motion.h1>
            <motion.p
              className="text-base text-neutral-500 max-w-xl"
              variants={fadeUp}
              transition={springTransition}
            >
              人物访谈 · 纪录片 · Vlog — 记录路上的每一个真实瞬间
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 px-6 bg-white border-b border-neutral-300 sticky top-[64px] z-40">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          transition={springTransition}
          className="max-w-4xl mx-auto flex justify-center gap-3 flex-wrap"
        >
          {CATEGORIES.map((category) => (
            <motion.button
              key={category}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm transition-all cursor-pointer ${
                activeCategory === category
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {category}
              {category !== '全部' && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({docs.filter(d => d.category === category).length})
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto relative">

          {/* 中央时间线 — 桌面端可见 */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-300 -translate-x-1/2" />
          {/* 左侧时间线 — 移动端 */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px bg-neutral-300" />

          <motion.div
            key={activeCategory}
            variants={stagger(0.15)}
            initial="hidden"
            animate="visible"
            className="space-y-16 md:space-y-20"
          >
            {filteredItems.map((entry, index) => {
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={entry.id}
                  variants={fadeUp}
                  transition={springTransition}
                  className="relative"
                >
                  {/* 日期节点 — 桌面端居中 */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-0 flex-col items-center z-10">
                    <div className="w-4 h-4 rounded-full bg-brand border-4 border-white shadow-sm" />
                    <span className="mt-2 text-xs font-medium text-neutral-500 whitespace-nowrap bg-surface px-2">
                      {entry.date}
                    </span>
                  </div>

                  {/* 日期节点 — 移动端靠左 */}
                  <div className="md:hidden absolute left-6 top-0 -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-3 h-3 rounded-full bg-brand border-3 border-white shadow-sm" />
                  </div>
                  <div className="md:hidden mb-2 ml-12 text-xs font-medium text-neutral-500">
                    {entry.date}
                  </div>

                  {/* Card — Z 型交错 */}
                  <div className={`md:grid md:grid-cols-2 md:gap-16 ${isLeft ? '' : ''}`}>
                    {/* 左侧内容或占位 */}
                    <div className={`${isLeft ? '' : 'md:order-2'} ${!isLeft ? 'md:text-right' : ''}`}>
                      {/* 移动端左侧留空给时间线 */}
                      <div className={`ml-12 md:ml-0 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${!isLeft ? 'md:mr-0' : 'md:ml-0'}`}>
                        {/* 分类标签 + 内容类型 */}
                        <div className={`flex items-center gap-2 mb-3 flex-wrap ${!isLeft ? 'md:justify-end' : ''}`}>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[entry.category] ?? ''}`}>
                            {entry.category}
                          </span>
                          {entry.readTime && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <Clock className="w-3 h-3" />
                              {entry.readTime}
                            </span>
                          )}
                        </div>

                        {/* 标题 */}
                        <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 mb-3 leading-tight">
                          {entry.title}
                        </h3>

                        {/* 封面缩略图 */}
                        {entry.coverImage && (
                          <div className="rounded-lg overflow-hidden aspect-[16/9] mb-4">
                            <img
                              src={entry.coverImage}
                              alt={entry.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}

                        {/* 摘要 */}
                        <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                          {entry.description}
                        </p>

                        {/* 操作按钮 */}
                        <div className={`flex items-center gap-3 flex-wrap ${!isLeft ? 'md:justify-end' : ''}`}>
                          {entry.videoLinks?.map((link) => (
                            <a
                              key={link.platform}
                              href={link.url}
                              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand/10 text-brand-dark hover:bg-brand/20 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              {link.platform}
                            </a>
                          ))}
                          {entry.pdfName && (
                            <a
                              href="#"
                              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {entry.pdfName}
                            </a>
                          )}
                          {entry.slug && (
                            <a
                              href={`/documentation/${entry.slug}`}
                              className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                            >
                              阅读全文
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧占位（Z 型交错的空白侧） */}
                    <div className={`hidden md:block ${isLeft ? 'md:order-2' : 'md:order-1'}`} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-400 text-lg">该分类暂无内容</p>
              <p className="text-neutral-300 text-sm mt-2">更多内容随旅程持续更新中</p>
            </div>
          )}

          {/* 时间线终点 */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bottom-0 flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-neutral-300" />
          </div>
        </div>
      </section>

      {/* 更多内容提示 */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="w-8 h-[2px] bg-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">更多内容随旅程持续更新中</p>
        </div>
      </section>
    </div>
  );
}
