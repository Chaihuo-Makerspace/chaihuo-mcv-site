import { Navigation } from '../components/Navigation';
import vehicleImage from 'figma:asset/34db03516a0b451b193bafd565b0283ef280b3aa.png';
import scanImage from 'figma:asset/9c4bd0c11f594f7b6fef6c99a7c53acf6bf85b73.png';

export default function Deconstruct() {
  const modifications = [
    {
      date: '2025/03/12-25',
      title: '移动创客空间与 DIY 露营车研究',
      description: '改装一辆移动创客空间，既不同于普通的房车露营改装，也不同于固定的创客空间搭建。我们需要在有限空间里兼顾工作坊、展示、教学、旅居等多重功能。',
      image: 'https://images.unsplash.com/photo-1768633647910-7e6fb53e5b0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjB3b3JraW5nJTIwZWxlY3Ryb25pY3MlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NzM2NTIxMjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      date: '2025/03/01',
      title: '基地车低分辨率扫描实践',
      description: '要展开设计，首先想到的是如何获得车辆的数字化模型。作为改装小白，我想在动手之前，先去熟悉的 SketchUp 里看看有哪些前辈的设计方案可供参考。',
      image: scanImage,
    },
    {
      date: '2025/02/14',
      title: '续航方案：太阳能板的挑战',
      description: '经过反复测试与验证，我们在基地车顶部加装了两组可折叠太阳能板组，每组峰值功率达800W。配合车载2000Ah锂电池组与智能电池管理系统，能在荒野停留时持续为AI服务器和数字加工设备提供动力，让科技在远离城市电网的环境下也能发挥作用。',
      image: 'https://images.unsplash.com/photo-1773291934106-f6e551493b83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMHBhbmVsJTIwaW5zdGFsbGF0aW9uJTIwb3V0ZG9vcnN8ZW58MXx8fHwxNzczNjUyMTI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const techSpecs = {
    ai: [
      { name: 'AI 服务器', spec: 'ML 4xT4/4x L40 80GB' },
      { name: '工作站', spec: 'SFFE Remix Grid' },
      { name: '服务器机箱', spec: 'Starlink Gen 3' },
      { name: '机架', spec: 'Tiber x 10 Thermal' },
    ],
    factory: [
      { name: '3D 打印机', spec: 'ML Prusa/mk Crealily K1' },
      { name: '激光切割机', spec: 'Glowforge EMC x Axis' },
      { name: '数控铣床', spec: 'Smart Machining Station' },
    ],
    power: [
      { name: '太阳能板', spec: 'JA Solar 1.6KWH' },
      { name: '电池组', spec: 'Li-Batt 2kWh Rack' },
      { name: '逆变器', spec: 'Voltronic Ax Multi Stage' },
      { name: '车辆底盘', spec: 'Smart Power AC' },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl mb-4 text-gray-900">普罗米修斯号 </h1>
          <p className="text-gray-600 mb-8"></p>
        </div>
      </section>

      {/* Vehicle 3D View */}
      <section className="px-6 mb-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-400 rounded-lg overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1746032815159-0d929000c1aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWhpY2xlJTIwZXhwbG9kZWQlMjB2aWV3JTIwZGlhZ3JhbSUyMHRlY2huaWNhbHxlbnwxfHx8fDE3NzM2NTI0OTN8MA&ixlib=rb-4.1.0&q=80&w=1080" 
              alt="Prometheus Vehicle Exploded View" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Modification Logs */}
      <section className="px-6 mb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl mb-2 text-gray-900">改装手记</h2>
          <p className="text-gray-400 italic mb-8">Modification Logs</p>
          
          <div className="space-y-8">
            {modifications.map((mod, index) => (
              <div key={index} className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-2">{mod.date}</div>
                  <h3 className="text-xl mb-3 text-gray-900">{mod.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div className="h-64 md:h-auto">
                  <img 
                    src={mod.image} 
                    alt={mod.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl mb-12 text-center text-gray-900">技术参数清单</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* AI & Computing */}
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <h3 className="text-lg font-semibold text-gray-900">AI & 计算系统</h3>
              </div>
              <div className="space-y-3">
                {techSpecs.ai.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-2">
                    <div className="text-sm text-gray-600">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{item.spec}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Digital Factory */}
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <h3 className="text-lg font-semibold text-gray-900">数字化工厂</h3>
              </div>
              <div className="space-y-3">
                {techSpecs.factory.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-2">
                    <div className="text-sm text-gray-600">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{item.spec}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Power & Vehicle */}
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <h3 className="text-lg font-semibold text-gray-900">能源与车身</h3>
              </div>
              <div className="space-y-3">
                {techSpecs.power.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-2">
                    <div className="text-sm text-gray-600">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{item.spec}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">项目入口</h4>
              <div className="space-y-2 text-sm">
                <a href="/" className="block text-gray-600 hover:text-black transition">首页</a>
                <a href="/deconstruct" className="block text-gray-600 hover:text-black transition">解构基地车</a>
                <a href="#" className="block text-gray-600 hover:text-black transition">完整纪实</a>
                <a href="#" className="block text-gray-600 hover:text-black transition">上车指南</a>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">联系我们</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>深圳市南山区万科云城设计公社B602</p>
                <p>成都狮马路92号</p>
                <p>business@chaihuo.org</p>
                <p>0755 - 36937037</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">社交渠道</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-600 hover:text-black transition">微信</a>
                <a href="#" className="text-gray-600 hover:text-black transition">微博</a>
                <a href="#" className="text-gray-600 hover:text-black transition">GitHub</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 柴火创客空间 Chaihuo Maker Space. 保留所有权利.</p>
            <p className="mt-2">本项目遵循开源协议 MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}