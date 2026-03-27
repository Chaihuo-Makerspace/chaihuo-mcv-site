import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react/jsx-runtime',
        'motion/react', 'lucide-react',
        'astro/zod', 'react-slick', 'd3-geo',
        'gsap', 'gsap/ScrollTrigger', 'gsap/ScrollToPlugin',
      ],
    },
    ssr: {
      noExternal: ['motion'],
    },
  },
});
