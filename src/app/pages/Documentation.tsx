import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Clock, Eye, FileText } from 'lucide-react';
import exampleImage from 'figma:asset/5b31f15f79bd155d8f12f20286b161f2ac8a73db.png';

type Category = '全部纪实' | '路上实践' | '路上技术' | '其他方法';

interface DocumentationItem {
  id: number;
  date: string;
  category: Category;
  title: string;
  description: string;
  readTime: string;
  views: string;
  image: string;
  type?: 'image' | 'pdf';
  pdfName?: string;
}

export default function Documentation() {
  const [activeCategory, setActiveCategory] = useState<Category>('全部纪实');

  const categories: Category[] = ['全部纪实', '路上实践', '路上技术', '其他方法'];

  const documentationItems: DocumentationItem[] = [
    {
      id: 1,
      date: '2026.04.20',
      category: '路上实践',
      title: '海拔4500米的清晨：羊羊们的交谈线甘',
      description: '今日飘摇热烈的345天来，循着青藏高原深处的曲折路段，我来到了这里——四千五百米海拔上如画一般的高山牧场。一个安宁早晨，羊群缓缓移动在雪山映衬下呈现极致纯净。',
      readTime: '10 min read',
      views: '1,248 Views',
      image: 'https://images.unsplash.com/photo-1760410719961-0bb9710ada19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGVlcCUyMGZsb2NrJTIwZ3Jhc3NsYW5kfGVufDF8fHx8MTc3Mzg4NjcyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'image',
    },
    {
      id: 2,
      date: '2026.04.17',
      category: '路上技术',
      title: '科技服务于荒野：基站中继塔搭建完成',
      description: '科技何以有效地送人工空心的草原深度？迎着寒潮！在深夜的戈壁滩上我们与团队完成3G+边缘计算增幅建设，创建空心区域共享工作技术生态环境，载入国土人工智配系统，致人山人力教方法。',
      readTime: '15 min read',
      views: '2,891 Views',
      image: 'https://images.unsplash.com/photo-1771186936875-f80e00ec1127?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmYtcm9hZCUyMHZlaGljbGUlMjBuaWdodCUyMGRlc2VydHxlbnwxfHx8fDE3NzM4ODY3MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'image',
    },
    {
      id: 3,
      date: '2026.04.05',
      category: '其他方法',
      title: '基地车出发仪式',
      description: '迎接有序规划秩序体系化网络物联处理创建，完满并联互联网时代对移云分布相交付。',
      readTime: '',
      views: '',
      image: '',
      type: 'pdf',
      pdfName: 'Annual_Report_2025.pdf',
    },
    {
      id: 4,
      date: '2026.03.28',
      category: '路上实践',
      title: '穿越川藏：1850公里的技术挑战',
      description: '从成都出发，沿着318国道一路向西。基地车在海拔变化超过4000米的复杂路况中，经受了前所未有的考验。太阳能系统、AI计算平台、数字加工设备全部运行正常，验证了我们的技术方案。',
      readTime: '12 min read',
      views: '3,156 Views',
      image: 'https://images.unsplash.com/photo-1755954774924-fe9a89858f7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluYSUyMHJ1cmFsJTIwbGFuZHNjYXBlJTIwbW91bnRhaW5zfGVufDF8fHx8MTc3Mzg4NjcyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'image',
    },
    {
      id: 5,
      date: '2026.03.15',
      category: '路上技术',
      title: '离线AI系统的实地验证',
      description: '在没有网络信号的偏远地区，我们的离线AI系统完成了首次实地应用测试。本地部署的大语言模型成功为当地社区提供技术咨询服务，证明了科技向善的可行性。',
      readTime: '8 min read',
      views: '1,892 Views',
      image: 'https://images.unsplash.com/photo-1562568068-7a90cf9e499d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3Nob3AlMjBlcXVpcG1lbnR8ZW58MXx8fHwxNzczODg2NzI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'image',
    },
    {
      id: 6,
      date: '2026.02.28',
      category: '路上实践',
      title: '乡村创客工坊：连接数字与现实',
      description: '在云南某个小镇，基地车首次以移动创客空间的形式开放。当地的年轻人在车内体验3D打印、激光切割等数字制造技术，科技的种子在这片土地上悄然生根。',
      readTime: '11 min read',
      views: '2,534 Views',
      image: 'https://images.unsplash.com/photo-1611907045915-8357087b1878?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2FkJTIwdHJpcCUyMGNoaW5hJTIwY291bnRyeXNpZGV8ZW58MXx8fHwxNzczODg2NzI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      type: 'image',
    },
  ];

  const filteredItems = activeCategory === '全部纪实' 
    ? documentationItems 
    : documentationItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-black rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-black rounded-full blur-3xl" />
        </div>

        <div className="relative h-full flex flex-col justify-center items-center text-center px-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-6">
            "循迹中国"
          </h1>
          <p className="text-lg md:text-xl text-black/80 max-w-2xl">
            2026 十省深度科技实践路线总记录
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-6 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-center gap-4 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full transition-all ${
                activeCategory === category
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Documentation Items */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {filteredItems.map((item, index) => (
            <article 
              key={item.id} 
              className={`grid md:grid-cols-2 gap-8 items-center ${
                index % 2 === 1 ? 'md:grid-flow-dense' : ''
              }`}
            >
              {/* 文字内容 */}
              <div className={`${index % 2 === 1 ? 'md:col-start-2' : ''} relative`}>
                <div className="absolute -right-4 -top-4 w-3 h-3 bg-yellow-400 rounded-full" />
                
                <div className="mb-4">
                  <span className="text-sm text-gray-500">{item.date}</span>
                  <span className="mx-3 text-gray-300">|</span>
                  <span className="text-sm text-gray-700">{item.category}</span>
                </div>

                <h2 className="text-2xl md:text-3xl mb-4 text-gray-900 leading-tight">
                  {item.title}
                </h2>

                <p className="text-gray-600 leading-relaxed mb-6">
                  {item.description}
                </p>

                {item.readTime && item.views && (
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{item.readTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{item.views}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 图片或文件 */}
              <div className={`${index % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''} relative`}>
                <div className="absolute -left-4 -bottom-4 w-3 h-3 bg-yellow-400 rounded-full" />
                
                {item.type === 'pdf' ? (
                  <div className="bg-gray-100 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-8">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-700 font-medium">{item.pdfName}</p>
                    <button className="mt-4 text-sm text-gray-500 hover:text-black transition">
                      点击预览文档 →
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden aspect-[4/3] bg-gray-200">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
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
                <a href="/documentation" className="block text-gray-600 hover:text-black transition">完整纪实</a>
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
