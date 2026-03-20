import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { ChevronDown, Mail, Send } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function Guide() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const teamMembers: TeamMember[] = [
    {
      name: '冯工',
      role: '领队',
      image: 'https://images.unsplash.com/photo-1632910121591-29e2484c0259?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbGUlMjBlbmdpbmVlciUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzczODg2ODg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      name: '志鹏',
      role: '技术担当',
      image: 'https://images.unsplash.com/photo-1737574107736-9e02ca5d5387?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbGUlMjBkZXZlbG9wZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzczODg2ODg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      name: 'pipi',
      role: '媒体担当',
      image: 'https://images.unsplash.com/photo-1646326477577-3c56e29dccbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHBob3RvZ3JhcGhlciUyMGNhbWVyYXxlbnwxfHx8fDE3NzM4ODY4ODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      name: 'Reachy Mini',
      role: '具身智能',
      image: 'https://images.unsplash.com/photo-1768400730810-5c4398d58ae7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGh1bWFub2lkJTIwcm9ib3QlMjBBSXxlbnwxfHx8fDE3NzM4ODY4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
  ];

  const faqs: FAQ[] = [
    {
      question: '什么是在地？',
      answer: '我们所说的"在地"，需要满足两个条件：① 你所在的区域/资源所在地，与基地车路线覆盖的省、市、区、县、乡重合；② 你能够完成项目的组织和落地。',
    },
    {
      question: '团队如何构成？',
      answer: '车上固定人员3-4人，由领队、技术、媒体构成，每个路段领队由柴火内部人员担任，其他均通过招募开放。',
    },
    {
      question: '分段招募何时截止？',
      answer: '持续招募，滚动录取，直至路段招满为止。',
    },
    {
      question: '提交申请后，什么时候通知结果？',
      answer: '提交后7个工作日内回复。名额有限，建议尽早报名。',
    },
    {
      question: '需要面试吗？',
      answer: '需要。初筛通过后安排线上面试，了解你的动机、能力和期待。',
    },
    {
      question: '面试通过后，会有行前培训吗？',
      answer: '会！所有同行者参加线上行前培训，内容包括项目背景、安全须知、共创原则等。外地伙伴线上参与即可。',
    },
    {
      question: '分段参与需到起点集合，交通费用如何报销？',
      answer: '分段同行者需自行承担「到达路段起点」的交通费。',
    },
    {
      question: '参与项目有报酬吗？',
      answer: '我们不提供薪资，但会承担参与期间产生的交通、食宿费用，并为参与者购买人身保险。',
    },
    {
      question: '个人参与项目的回报是什么？',
      answer: '● 解锁一次"全国首创"的深度参与：您将成为中国首台科技共创移动实验室的核心行动成员；\n● 收获一段"科技向善"的极致体验：您将亲历AI、开源硬件与农业、环保、教育等领域的深度碰撞；\n● 一份独一无二的人生资产：结识来自科技、公益、学术、媒体等多元领域的卓越同行者，拓展视野与人脉网络。',
    },
    {
      question: '机构/组织/企业参与项目的回报是什么？',
      answer: '① 品牌共创与曝光：成为柴火基地车官方合作伙伴，随车全程露出品牌标识；技术成果通过全网宣传、MFSZ项目路演等渠道获得百万级曝光；优秀解决方案有机会获得众筹支持与产业化推广。\n② 技术验证与场景落地：与在地需求深度结合，打磨可复制、可开源的技术解决方案；为产品迭代、场景拓展提供实战验证机会。\n③ 社会责任与行业影响：深度参与SDG相关项目，用技术解决基层真实问题，践行科技向善；优先获得当地解决方案落地、推广权，抢占新兴市场先机。',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-6">
            加入行动
          </h1>
          <p className="text-xl md:text-2xl text-black/80">
            你不是看客，是答案的一部分
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Team Members */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">基地车成员</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="group">
                <div className="relative overflow-hidden rounded-lg aspect-[3/4] mb-4 bg-gray-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-xl font-bold text-white">{member.name}</h3>
                    <p className="text-yellow-400 text-sm">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Participation Methods */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">参与方式</h2>

          <div className="space-y-16">
            {/* 方式一 */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border-l-4 border-yellow-400">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-yellow-400 text-black font-bold text-lg px-4 py-2 rounded-lg shrink-0">
                  方式一
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">成为车上同行者</h3>
              </div>
              
              <p className="text-gray-700 mb-8 leading-relaxed">
                我们正在寻找愿意一路同行、并肩共创的伙伴，以下角色优先招募！
              </p>

              <div className="space-y-6 mb-8">
                <div className="pl-6 border-l-2 border-yellow-400">
                  <h4 className="text-xl font-bold mb-2">🔧 技术担当（1-2人）</h4>
                  <p className="text-gray-600 leading-relaxed">
                    擅长硬件开发、物联网、编程、数字制造等，能在路途中带领在地工作坊，或协助解决技术难题。
                  </p>
                </div>
                <div className="pl-6 border-l-2 border-yellow-400">
                  <h4 className="text-xl font-bold mb-2">📸 媒体担当（1-2人）</h4>
                  <p className="text-gray-600 leading-relaxed">
                    精通文字、摄影、视频、社群运营，用镜头和笔触记录旅程故事。
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-gray-700 mb-2">
                  📌 <strong>灵活参与：</strong>可选择单段参与（从该段起点出发），也可选择全程跟车。
                </p>
              </div>

              <div className="bg-black text-white rounded-lg p-6">
                <h4 className="flex items-center gap-2 text-xl font-bold mb-3">
                  <Mail className="w-5 h-5 text-yellow-400" />
                  报名方式
                </h4>
                <p className="leading-relaxed">
                  发送「简历/作品集 + 意向路段 + 意向角色」至 <br />
                  <a href="mailto:business@chaihuo.org" className="text-yellow-400 hover:text-yellow-300 transition">
                    📧 business@chaihuo.org
                  </a>
                  <br />
                  邮件标题注明「柴火基地车同行申请」，避免遗漏哦！
                </p>
              </div>
            </div>

            {/* 方式二 */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border-l-4 border-yellow-400">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-yellow-400 text-black font-bold text-lg px-4 py-2 rounded-lg shrink-0">
                  方式二
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">（在地）可持续发展创新合作</h3>
              </div>
              
              <p className="text-gray-700 mb-8 leading-relaxed">
                基地车的每一段旅程，都期待与当地关注可持续发展的创新力量相遇、碰撞！
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-lg">面向个人/团队</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    社会设计师、社区营造者、文化研究者、教育工作者等，只要你有相关领域经验与共创意愿，均可参与。
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-lg">面向组织</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    公益组织、社会设计机构、社会创新组织、社区中心等。
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-bold mb-3">合作形式</h4>
                <p className="text-gray-700 leading-relaxed">
                  与所在地运营的社会创新/公益项目结合，联合举办在地工作坊、主题分享会、创新项目共创等......一起挖掘在地特色，推动创新落地。
                </p>
              </div>

              <div className="bg-black text-white rounded-lg p-6 flex items-center justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-xl font-bold mb-2">
                    <Send className="w-5 h-5 text-yellow-400" />
                    报名方式
                  </h4>
                  <p className="text-sm">扫描二维码，填写你的想法与合作需求，我们会第一时间与你对接沟通！</p>
                </div>
                <div className="bg-white w-24 h-24 rounded-lg flex items-center justify-center shrink-0 ml-4">
                  <span className="text-xs text-gray-400">二维码</span>
                </div>
              </div>
            </div>

            {/* 方式三 */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border-l-4 border-yellow-400">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-yellow-400 text-black font-bold text-lg px-4 py-2 rounded-lg shrink-0">
                  方式三
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">（在地）科技赋能需求合作</h3>
              </div>
              
              <p className="text-gray-700 mb-8 leading-relaxed">
                如果你的行业正面临科技升级难题，你的项目正需要专业技术支持，柴火基地车或许正是你等待的合作伙伴！
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-lg">面向人群</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    传统行业创业者、中小企业主、技术集成商，无论你是刚起步还是已深耕行业，均可申请技术赋能支持。
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold mb-3 text-lg">面向行业</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    教育、农业、环保、建筑等多个领域，精准匹配不同行业的科技赋能需求。
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-bold mb-3">合作方式</h4>
                <p className="text-gray-700 leading-relaxed">
                  在地技术培训、专业技术咨询、行业案例分享等服务，全方位助力你的项目实现科技突破与创新升级。
                </p>
              </div>

              <div className="bg-black text-white rounded-lg p-6 flex items-center justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-xl font-bold mb-2">
                    <Send className="w-5 h-5 text-yellow-400" />
                    报名方式
                  </h4>
                  <p className="text-sm">扫描二维码，填写你的想法与合作需求，我们会第一时间与你对接沟通！</p>
                </div>
                <div className="bg-white w-24 h-24 rounded-lg flex items-center justify-center shrink-0 ml-4">
                  <span className="text-xs text-gray-400">二维码</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Q&A 专区</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition"
                >
                  <span className="font-bold text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFAQ === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white text-black px-3 py-1.5 font-bold text-lg">CH</div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                柴火基地车是一项连接数字与现实的开源创新项目，旨在通过移动平台将科技的人文关怀带向深处。
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-400 font-semibold">项目入口</h4>
              <div className="space-y-2 text-sm">
                <a href="/" className="block text-gray-300 hover:text-white transition">首页</a>
                <a href="/deconstruct" className="block text-gray-300 hover:text-white transition">解构基地车</a>
                <a href="/documentation" className="block text-gray-300 hover:text-white transition">完整纪实</a>
                <a href="/guide" className="block text-yellow-400 hover:text-yellow-300 transition">上车指南</a>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-400 font-semibold">联系我们</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>深圳市南山区万科云城设计公社B602</p>
                <p>成都狮马路92号</p>
                <p>business@chaihuo.org</p>
                <p>0755 - 36937037</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-400 font-semibold">社交渠道</h4>
              <div className="flex gap-4 text-sm">
                <a href="#" className="text-gray-300 hover:text-white transition">微信</a>
                <a href="#" className="text-gray-300 hover:text-white transition">微博</a>
                <a href="#" className="text-gray-300 hover:text-white transition">GitHub</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 柴火创客空间 Chaihuo Maker Space. 保留所有权利.</p>
            <p className="mt-2">本项目遵循开源协议 MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
