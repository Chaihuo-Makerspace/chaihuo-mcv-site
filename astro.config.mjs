import { execSync } from 'node:child_process';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// 部署版本号：构建时注入（vite define），页面渲染成 <meta name="build-id">，
// 服务端经 /api/version 返回；客户端轮询比对，发现新部署即自动刷新。
// 优先级：env BUILD_ID > git 短 hash > 构建时间戳（Docker 构建上下文无 .git，走时间戳兜底）。
function resolveBuildId() {
  if (process.env.BUILD_ID) return process.env.BUILD_ID;
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return Date.now().toString(36);
  }
}

const buildId = resolveBuildId();

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://mcv.chaihuo.org',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  // Legacy /documentation collection retired in favor of /journals.
  // Top-level URLs redirect; deep links to old doc slugs fall through to 404,
  // which is acceptable since those slugs were placeholder content.
  redirects: {
    '/documentation': '/journals',
    '/en/documentation': '/en/journals',
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
    },
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'motion/react',
        'lucide-react',
        'astro/zod',
        'react-slick',
        'd3-geo',
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/ScrollToPlugin',
      ],
    },
    ssr: {
      noExternal: ['motion'],
    },
  },
});
