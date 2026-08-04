import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/index';

export interface FeaturedItem {
  /** base 名（YYYYMMDD-HHmmss，无扩展名） */
  file: string;
  pickedAt: string;
}

interface FeaturedCarouselProps {
  locale?: Locale;
  t: Record<string, string>;
  entries: FeaturedItem[];
}

const AUTOPLAY_MS = 5_000;

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

/** '20260801-091207' → zh '2026.08.01' / en 'Aug 1, 2026'（正午取值避免时区跨界） */
function formatFileDate(base: string, locale: Locale): string {
  const day = base.slice(0, 8);
  if (locale === 'zh') return `${day.slice(0, 4)}.${day.slice(4, 6)}.${day.slice(6, 8)}`;
  const date = new Date(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T12:00:00+08:00`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function FeaturedCarousel({ locale = 'zh', t, entries }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = entries.length;

  // 全页唯一循环动画额度给了轮播自动播放；prefers-reduced-motion 时只手动切换
  // biome-ignore lint/correctness/useExhaustiveDependencies: index 入依赖是有意的——手动切换后重新开始计 5 秒
  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, index]);

  // 无已入选图时整个区块不渲染（占位内容不外露；页面 frontmatter 也会判空跳过）
  if (count === 0) return null;

  const step = (delta: number) => {
    setIndex((prev) => (prev + delta + count) % count);
  };

  const current = entries[index % count];
  const currentDate = formatFileDate(current.file, locale);

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <h2>{t['featured.title']}</h2>
        <p className="mt-2 max-w-2xl text-neutral-500">{t['featured.subtitle']}</p>

        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-300 bg-surface-card shadow-sm">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${(index % count) * 100}%)` }}
          >
            {entries.map((entry) => {
              const date = formatFileDate(entry.file, locale);
              return (
                <img
                  key={entry.file}
                  src={`/live/featured/${entry.file}.webp`}
                  alt={fill(t['featured.imageAlt'], { date })}
                  loading="lazy"
                  className="aspect-video w-full shrink-0 object-cover"
                />
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t['featured.prev']}
            className="cursor-pointer rounded-full border border-neutral-300 p-2 text-neutral-700 transition-colors duration-200 hover:border-brand"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-neutral-500">{currentDate}</span>
            <div className="flex items-center gap-2">
              {entries.map((entry, i) => (
                <button
                  key={entry.file}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1} / ${count}`}
                  className={`h-2 w-2 cursor-pointer rounded-full transition-colors duration-200 ${
                    i === index % count ? 'bg-brand' : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t['featured.next']}
            className="cursor-pointer rounded-full border border-neutral-300 p-2 text-neutral-700 transition-colors duration-200 hover:border-brand"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
