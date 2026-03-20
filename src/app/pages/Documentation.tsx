import { useState } from 'react';
import { motion } from 'motion/react';
import { fadeUp, scaleIn, stagger, springTransition, defaultViewport } from '../components/motion';
import { Clock, Play, FileText, ExternalLink } from 'lucide-react';
import { Footer } from '../components/Footer';

type Category = '全部' | '人物访谈' | '纪录片' | 'Vlog' | '文章';

interface VideoLink {
  platform: string;
  url: string;
}

interface TimelineEntry {
  id: number;
  date: string;
  category: Category;
  title: string;
  description: string;
  readTime?: string;
  coverImage?: string;
  videoLinks?: VideoLink[];
  pdfName?: string;
}

const CATEGORIES: Category[] = ['全部', '人物访谈', '纪录片', 'Vlog', '文章'];

const TIMELINE_DATA: TimelineEntry[] = [
  {
    id: 1,
    date: '2026.04.20',
    category: 'Vlog',
    title: '海拔4500米的清晨：羊羊们的交谈线甘',
    description: '循着青藏高原深处的曲折路段，我来到了这里——四千五百米海拔上如画一般的高山牧场。一个安宁早晨，羊群缓缓移动在雪山映衬下呈现极致纯净。',
    readTime: '10 min',
    coverImage: 'https://images.unsplash.com/photo-1760410719961-0bb9710ada19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
    videoLinks: [
      { platform: 'Bilibili', url: '#' },
    ],
  },
  {
    id: 2,
    date: '2026.04.17',
    category: '纪录片',
    title: '科技服务于荒野：基站中继塔搭建完成',
    description: '在深夜的戈壁滩上我们与团队完成 3G + 边缘计算增幅建设，创建空心区域共享工作技术生态环境。',
    readTime: '15 min',
    coverImage: 'https://images.unsplash.com/photo-1771186936875-f80e00ec1127?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
    videoLinks: [
      { platform: 'Bilibili', url: '#' },
      { platform: 'YouTube', url: '#' },
    ],
  },
  {
    id: 3,
    date: '2026.04.05',
    category: '文章',
    title: '基地车出发仪式',
    description: '普罗米修斯号正式从深圳出发，开启 200 天的中国科技巡回之旅。出发仪式上，柴火创客社区的伙伴们为基地车送行。',
    pdfName: 'Annual_Report_2025.pdf',
  },
  {
    id: 4,
    date: '2026.03.28',
    category: 'Vlog',
    title: '穿越川藏：1850公里的技术挑战',
    description: '从成都出发，沿着318国道一路向西。基地车在海拔变化超过4000米的复杂路况中，经受了前所未有的考验。太阳能系统、AI计算平台、数字加工设备全部运行正常。',
    readTime: '12 min',
    coverImage: 'https://images.unsplash.com/photo-1755954774924-fe9a89858f7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
    videoLinks: [
      { platform: 'Bilibili', url: '#' },
    ],
  },
  {
    id: 5,
    date: '2026.03.15',
    category: '人物访谈',
    title: '离线AI系统的实地验证',
    description: '在没有网络信号的偏远地区，我们的离线AI系统完成了首次实地应用测试。本地部署的大语言模型成功为当地社区提供技术咨询服务，证明了科技向善的可行性。',
    readTime: '8 min',
    coverImage: 'https://images.unsplash.com/photo-1562568068-7a90cf9e499d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
  },
  {
    id: 6,
    date: '2026.02.28',
    category: '人物访谈',
    title: '乡村创客工坊：连接数字与现实',
    description: '在云南某个小镇，基地车首次以移动创客空间的形式开放。当地的年轻人在车内体验3D打印、激光切割等数字制造技术，科技的种子在这片土地上悄然生根。',
    readTime: '11 min',
    coverImage: 'https://images.unsplash.com/photo-1611907045915-8357087b1878?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
    videoLinks: [
      { platform: 'YouTube', url: '#' },
    ],
  },
];

const CATEGORY_COLORS: Record<Category, string> = {
  '全部': '',
  '人物访谈': 'bg-blue-100 text-blue-700',
  '纪录片': 'bg-purple-100 text-purple-700',
  'Vlog': 'bg-brand/15 text-brand-dark',
  '文章': 'bg-neutral-100 text-neutral-700',
};

export default function Documentation() {
  const [activeCategory, setActiveCategory] = useState<Category>('全部');

  const filteredItems = activeCategory === '全部'
    ? TIMELINE_DATA
    : TIMELINE_DATA.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface">

      {/* Hero Section — 纪实风格图片背景 */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative h-full flex flex-col justify-center items-center text-center px-6">
          <motion.h1
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6"
          >
            循迹中国
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={{ ...springTransition, delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl"
          >
            人物访谈 · 纪录片 · Vlog — 记录路上的每一个真实瞬间
          </motion.p>
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
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
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
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[entry.category]}`}>
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
                          <a
                            href="#"
                            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                          >
                            阅读全文
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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

          {/* 时间线终点 */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bottom-0 flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-neutral-300" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
