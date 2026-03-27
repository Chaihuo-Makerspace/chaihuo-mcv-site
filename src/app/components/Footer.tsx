import { motion } from 'motion/react';
import { MapPin, Mail, Phone } from 'lucide-react';
import { fadeUp, springTransition, defaultViewport } from './motion';
import logoHorizontalImport from '@/assets/logo-horizontal.png';
const logoHorizontal = typeof logoHorizontalImport === 'object' && logoHorizontalImport !== null && 'src' in logoHorizontalImport
  ? (logoHorizontalImport as { src: string }).src
  : logoHorizontalImport as string;

// Backwards-compatible named export for old SPA pages (remove in Task 4.1)
export { Footer };

export default function Footer() {
  return (
    <motion.footer
      className="py-12 px-6 bg-white border-t border-neutral-300"
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={fadeUp}
      transition={springTransition}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo + 描述 */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img src={logoHorizontal} alt="柴火创客" className="h-10" />
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              柴火基地车是一项连接数字与现实的开源创新项目，旨在通过移动平台将科技的人文关怀带向深处。
            </p>
            {/* TODO: Add real social media links */}
            <div className="flex gap-4 mt-6 text-xs text-neutral-400">
              关注我们的社交媒体，获取最新动态
            </div>
          </div>

          {/* 项目入口 */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-neutral-700 font-semibold">项目入口</h4>
            <div className="space-y-2 text-sm">
              <a href="/" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">首页</a>
              <a href="/deconstruct" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">解构基地车</a>
              <a href="/documentation" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">完整纪实</a>
              <a href="/guide" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">上车指南</a>
            </div>
          </div>

          {/* 联系我们 */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-neutral-700 font-semibold">联系我们</h4>
            <div className="space-y-3 text-sm text-neutral-500">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>深圳市南山区打石二路万科云设计公社B622</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>成都市青羊区狮马路92号</span>
              </p>
              <p className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>business@chaihuo.org</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>0755 - 36937037</span>
              </p>
            </div>
          </div>

          {/* 社交渠道 */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-neutral-700 font-semibold">社交渠道</h4>
            <div className="space-y-2 text-sm text-neutral-400">
              <p>微信公众号（即将开放）</p>
              <p>微博（即将开放）</p>
              <p>X / Twitter（即将开放）</p>
              <p>GitHub（即将开放）</p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-300 pt-8 text-center text-sm text-neutral-500">
          <p>&copy; 2026 柴火创客空间 Chaihuo Maker Space. 保留所有权利.</p>
          <p className="mt-2">本项目遵循开源协议 MIT License</p>
        </div>
      </div>
    </motion.footer>
  );
}
