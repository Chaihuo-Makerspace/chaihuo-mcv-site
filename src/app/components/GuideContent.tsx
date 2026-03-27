import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, stagger, springTransition, defaultViewport } from './motion';
import { ChevronDown, Mail, Truck, Sprout, Zap } from 'lucide-react';
import qrCoCreationImport from '@/assets/qr-co-creation.png';
import qrEmpowermentImport from '@/assets/qr-empowerment.png';

const qrCoCreation = typeof qrCoCreationImport === 'object' && qrCoCreationImport !== null && 'src' in qrCoCreationImport
  ? (qrCoCreationImport as { src: string }).src : qrCoCreationImport as string;
const qrEmpowerment = typeof qrEmpowermentImport === 'object' && qrEmpowermentImport !== null && 'src' in qrEmpowermentImport
  ? (qrEmpowermentImport as { src: string }).src : qrEmpowermentImport as string;

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio?: string;
  isRobot?: boolean;
}

interface FaqGroup {
  label: string;
  items: { question: string; answer: string }[];
}

interface GuideContentProps {
  teamMembers: TeamMember[];
  faqGroups: FaqGroup[];
}

export default function GuideContent({ teamMembers, faqGroups }: GuideContentProps) {
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());

  return (
    <div className="min-h-screen bg-white">

      {/* 标题区 */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
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
              Get Involved
            </motion.p>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4"
              variants={fadeUp}
              transition={springTransition}
            >
              加入行动
            </motion.h1>
            <motion.p
              className="text-base text-neutral-500"
              variants={fadeUp}
              transition={springTransition}
            >
              你不是看客，是答案的一部分
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Participation Methods */}
      <section className="py-20 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">参与方式</h2>
            <p className="text-neutral-500">从跟车到落地，找到你的位置</p>
          </motion.div>

          {/* 三卡并排 */}
          <motion.div
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {/* 上车同行 */}
            <motion.div
              variants={fadeUp}
              transition={springTransition}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-1.5 bg-brand" />
              <div className="p-8">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-5">
                  <Truck className="w-6 h-6 text-brand-dark" />
                </div>
                <h3 className="text-xl font-semibold mb-3">上车同行</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                  跟车出发，深度参与200天旅程。可选单段或全程，灵活加入。
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-neutral-700">技术担当 1-2人</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-neutral-700">媒体担当 1-2人</span>
                  </div>
                </div>

                <a
                  href="mailto:business@chaihuo.org?subject=柴火基地车同行申请"
                  className="inline-flex items-center gap-2 w-full justify-center py-3 rounded-lg bg-brand text-brand-foreground font-medium hover:bg-brand-hover transition-colors cursor-pointer text-sm"
                >
                  <Mail className="w-4 h-4" />
                  发送邮件报名
                </a>
              </div>
            </motion.div>

            {/* 在地共创 */}
            <motion.div
              variants={fadeUp}
              transition={springTransition}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-1.5 bg-brand" />
              <div className="p-8">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-5">
                  <Sprout className="w-6 h-6 text-brand-dark" />
                </div>
                <h3 className="text-xl font-semibold mb-3">在地共创</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                  与基地车在当地联合举办工作坊、主题分享会，共同推动可持续发展创新落地。
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-neutral-700">设计师 · 研究者 · 教育者</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-neutral-700">公益组织 · 社区中心</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <img src={qrCoCreation} alt="在地共创意向二维码" className="w-28 h-28 rounded-lg" />
                  <span className="text-xs text-neutral-500">扫码打开微信问卷</span>
                </div>
              </div>
            </motion.div>

            {/* 在地赋能 */}
            <motion.div
              variants={fadeUp}
              transition={springTransition}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-1.5 bg-brand" />
              <div className="p-8">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-5">
                  <Zap className="w-6 h-6 text-brand-dark" />
                </div>
                <h3 className="text-xl font-semibold mb-3">在地赋能</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                  获取技术培训、专业咨询和行业案例，助力你的项目实现科技升级与突破。
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-neutral-700">创业者 · 中小企业主</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="text-neutral-700">教育 · 农业 · 环保 · 建筑</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <img src={qrEmpowerment} alt="在地赋能需求二维码" className="w-28 h-28 rounded-lg" />
                  <span className="text-xs text-neutral-500">扫码打开微信问卷</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* 统一说明 */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="bg-white rounded-xl p-6 md:p-8 text-center text-sm text-neutral-500 leading-relaxed"
          >
            <p>
              <strong className="text-neutral-900">同行报名：</strong>发送简历/作品集 + 意向路段 + 意向角色至
              <a href="mailto:business@chaihuo.org" className="text-brand hover:text-brand-hover transition mx-1">business@chaihuo.org</a>
              ，邮件标题注明「柴火基地车同行申请」
            </p>
            <p className="mt-2">
              <strong className="text-neutral-900">在地合作：</strong>扫描卡片中的二维码填写合作意向，我们会第一时间对接沟通
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">基地车成员</h2>
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {teamMembers.map((member, index) => (
              <motion.div key={index} variants={fadeUp} transition={springTransition} className="group">
                <div className={`relative overflow-hidden rounded-lg aspect-[3/4] mb-4 ${member.isRobot ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                  <img
                    src={member.image}
                    alt={member.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${member.isRobot ? 'object-contain p-8' : ''}`}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-xl font-bold text-white">{member.name}</h3>
                    <p className="text-brand text-sm">{member.role}</p>
                  </div>
                </div>
                {member.bio && (
                  <p className="text-sm text-neutral-500 leading-relaxed">{member.bio}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section — 分组展示 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            transition={springTransition}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">常见问题</h2>
            <p className="text-neutral-500">7 个问题，3 分钟了解所有细节</p>
          </motion.div>

          <motion.div
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="space-y-10"
          >
            {faqGroups.map((group) => (
              <motion.div key={group.label} variants={fadeUp} transition={springTransition}>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 pl-1">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.items.map((faq) => {
                    const key = `${group.label}-${faq.question}`;
                    const isOpen = openFAQs.has(key);
                    return (
                      <div key={key} className="border border-neutral-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setOpenFAQs(prev => {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          })}
                          className="w-full px-5 py-4 text-left flex items-center justify-between bg-white hover:bg-neutral-50 transition cursor-pointer"
                        >
                          <span className="font-semibold pr-4">{faq.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 shrink-0 text-neutral-500 transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-3 bg-neutral-50 border-t border-neutral-300">
                                <p className="text-sm text-neutral-700 leading-relaxed">{faq.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
