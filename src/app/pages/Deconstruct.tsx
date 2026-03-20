import { Suspense, lazy } from 'react';
import { Navigation } from '../components/Navigation';

const VehicleExplodedView = lazy(() =>
  import('../components/VehicleExplodedView').then((m) => ({ default: m.VehicleExplodedView })),
);
import { Cpu, Factory, BatteryCharging, ChevronRight } from 'lucide-react';

// 改装日志（后续由 scripts/sync-yuque.ts 从语雀同步到本地 Markdown）
const modificationLogs = [
  {
    date: '2025/03/12-25',
    title: '移动创客空间与 DIY 露营车研究',
    description:
      '改装一辆移动创客空间，既不同于普通的房车露营改装，也不同于固定的创客空间搭建。我们需要在有限空间里兼顾工作坊、展示、教学、旅居等多重功能。',
    image:
      'https://images.unsplash.com/photo-1504222490345-c075b6008014?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    tags: ['调研', '设计'],
  },
  {
    date: '2025/03/01',
    title: '基地车低分辨率扫描实践',
    description:
      '要展开设计，首先想到的是如何获得车辆的数字化模型。作为改装小白，我想在动手之前，先去熟悉的 SketchUp 里看看有哪些前辈的设计方案可供参考。',
    image:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    tags: ['3D扫描', '数字化'],
  },
  {
    date: '2025/02/14',
    title: '续航方案：太阳能板的挑战',
    description:
      '经过反复测试与验证，我们在基地车顶部加装了两组可折叠太阳能板组，每组峰值功率达800W。配合车载2000Ah锂电池组与智能电池管理系统，能在荒野停留时持续为AI服务器和数字加工设备提供动力。',
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    tags: ['能源', '太阳能'],
  },
];

// 装备清单
const equipmentCategories = [
  {
    icon: Cpu,
    title: 'AI & 计算系统',
    items: [
      { name: 'AI 推理服务器', spec: '4×NVIDIA L40 · 80GB VRAM' },
      { name: '边缘工作站', spec: 'NVIDIA Jetson Orin · 64GB' },
      { name: '卫星通信', spec: 'Starlink Gen 3 · 低轨卫星' },
      { name: '散热系统', spec: '液冷循环 · 45°C 环境运行' },
    ],
  },
  {
    icon: Factory,
    title: '数字加工中心',
    items: [
      { name: '3D 打印机', spec: 'Bambu Lab X1C · 多色打印' },
      { name: '激光切割机', spec: 'xTool D1 Pro · 20W 模组' },
      { name: '数控铣床', spec: 'CNC 3018 Pro · 铝材加工' },
      { name: '电子工作台', spec: '示波器 · 焊台 · 万用表' },
    ],
  },
  {
    icon: BatteryCharging,
    title: '能源与生活',
    items: [
      { name: '太阳能板', spec: '2×800W 可折叠 · JA Solar' },
      { name: '储能电池', spec: 'LiFePO₄ 2000Ah · 磷酸铁锂' },
      { name: '逆变器', spec: '5kW 纯正弦波 · 离网/并网' },
      { name: '净水系统', spec: 'RO反渗透 · 200L水箱' },
    ],
  },
];

export default function Deconstruct() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Navigation />

      {/* ═══════ HERO — 车辆标题 + 爆炸图 ═══════ */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* 标题区 */}
          <div className="text-center mb-12">
            <p className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-3">
              Chaihuo Base Vehicle
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              普罗米修斯号
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              一台为荒野而生的移动AI实验室，从底盘到算力，每一处都为极限场景而设计。
            </p>
          </div>

          {/* 车辆 3D 爆炸图 — R3F + Drei */}
          <Suspense
            fallback={
              <div className="w-full h-[500px] md:h-[600px] rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-sm animate-pulse">加载 3D 模型中...</div>
              </div>
            }
          >
            <VehicleExplodedView />
          </Suspense>
        </div>
      </section>

      {/* ═══════ 改装日志 ═══════ */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">改装手记</h2>
              <p className="text-gray-400 mt-1">从图纸到荒野的每一步</p>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 flex items-center gap-1 cursor-pointer">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {modificationLogs.map((log, index) => (
              <article
                key={index}
                className="group grid md:grid-cols-[1fr_280px] gap-0 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                {/* 文字区 */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <time className="text-xs text-gray-400 font-mono">{log.date}</time>
                    <div className="flex gap-2">
                      {log.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-[#f3d230]/10 text-[#b8960a] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#b8960a] transition-colors duration-200">
                    {log.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {log.description}
                  </p>
                </div>

                {/* 图片区 */}
                <div className="h-48 md:h-auto overflow-hidden">
                  <img
                    src={log.image}
                    alt={log.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 装备清单 ═══════ */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">装备清单</h2>
            <p className="text-gray-400 mt-1">荒野生存的全部家当</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {equipmentCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.title}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#f3d230]/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-[#f3d230]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  </div>

                  <div className="space-y-4">
                    {category.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-baseline border-b border-gray-100 pb-3 last:border-0"
                      >
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-xs text-gray-400 font-mono text-right ml-4 shrink-0">
                          {item.spec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ Footer ═══════ */}
      <footer className="py-12 px-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-black text-white px-3 py-1.5 font-bold text-lg">CH</div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                柴火基地车是一项连接数字与现实的开源创新项目，旨在通过移动平台将科技的人文关怀带向深处。
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">
                项目入口
              </h4>
              <div className="space-y-2 text-sm">
                <a href="/" className="block text-gray-600 hover:text-black transition-colors duration-200">首页</a>
                <a href="/deconstruct" className="block text-gray-600 hover:text-black transition-colors duration-200">解构基地车</a>
                <a href="/documentation" className="block text-gray-600 hover:text-black transition-colors duration-200">完整纪实</a>
                <a href="/guide" className="block text-gray-600 hover:text-black transition-colors duration-200">上车指南</a>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">
                联系我们
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>深圳市南山区万科云城设计公社B602</p>
                <p>成都市青羊区狮马路92号</p>
                <p>business@chaihuo.org</p>
                <p>0755 - 36937037</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">
                社交渠道
              </h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200">微信</a>
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200">微博</a>
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200">GitHub</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 柴火创客空间 Chaihuo Maker Space. 保留所有权利.</p>
            <p className="mt-2">本项目遵循开源协议 MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
