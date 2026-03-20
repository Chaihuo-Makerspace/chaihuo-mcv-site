import { Link } from 'react-router';
import { motion } from 'motion/react';
import { MapPin, Mail, Phone } from 'lucide-react';
import { fadeUp, springTransition, defaultViewport } from './motion';
import logoHorizontal from '@/assets/logo-horizontal.png';

export function Footer() {
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
            {/* 社交图标 */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200" title="微信公众号">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200" title="微博">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.38 21.434c-4.808.456-8.966-1.718-9.288-4.859-.322-3.141 3.37-6.025 8.178-6.482 4.807-.456 8.965 1.718 9.287 4.859.322 3.141-3.37 6.025-8.178 6.482zm11.304-9.403c-.409-.118-.69-.192-.476-.696.463-1.092.513-2.034.015-2.707-.933-1.26-3.482-1.192-6.398-.027 0 0-.917.378-.683-.309.447-1.354.38-2.486-.288-3.143-1.51-1.485-5.53.056-8.983 3.442C1.646 10.71 0 13.44 0 15.787 0 20.835 6.386 23.5 12.633 23.5c8.195 0 13.651-4.636 13.651-8.317 0-2.226-1.92-3.49-3.6-4.152zM8.027 19.392c-3.174.298-5.912-1.002-6.115-2.902-.203-1.9 2.217-3.635 5.39-3.932 3.174-.298 5.912 1.002 6.115 2.902.203 1.9-2.217 3.635-5.39 3.932zm9.976-12.885c-.233-.062-.39-.104-.268-.374.264-.582.291-1.086.009-1.443-.526-.671-1.96-.635-3.604-.015 0 0-.517.202-.385-.165.253-.722.214-1.325-.162-1.674-.851-.79-3.118.03-5.065 1.834C6.816 6.003 6 7.565 6 8.895c0 2.69 3.6 4.33 7.127 4.33 4.622 0 7.698-2.468 7.698-4.427 0-1.185-1.083-1.858-2.03-2.21l-.792-.081z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200" title="X">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200" title="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* 项目入口 */}
          <div>
            <h4 className="text-xs uppercase tracking-wider mb-4 text-neutral-700 font-semibold">项目入口</h4>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">首页</Link>
              <Link to="/deconstruct" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">解构基地车</Link>
              <Link to="/documentation" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">完整纪实</Link>
              <Link to="/guide" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">上车指南</Link>
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
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">微信公众号</a>
              <a href="#" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">微博</a>
              <a href="#" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">X (Twitter)</a>
              <a href="#" className="block text-neutral-500 hover:text-neutral-900 transition-colors duration-200">GitHub</a>
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
