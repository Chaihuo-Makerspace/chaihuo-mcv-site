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
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  // 已删除/404 的 featured 图直接剔除,不留破图
  const items = entries.filter((e) => !failed.has(e.file));
  const count = items.length;

  // 全页唯一循环动画额度给了轮播自动播放；prefers-reduced-motion 时只手动切换
  // biome-ignore lint/correctness/useExhaustiveDependencies: index 入依赖是有意的——手动切换后重新开始计 5 秒
  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, index, paused]);

  // 无已入选图时整个区块不渲染（占位内容不外露；页面 frontmatter 也会判空跳过）
  if (count === 0) return null;

  const step = (delta: number) => {
    setIndex((prev) => (prev + delta + count) % count);
  };

  const markFailed = (file: string) => {
    setFailed((prev) => {
      if (prev.has(file)) return prev;
      const next = new Set(prev);
      next.add(file);
      return next;
    });
  };

  const current = items[index % count];
  const currentDate = formatFileDate(current.file, locale);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 轮播悬停/聚焦暂停(WCAG 2.2.2),挂在容器上覆盖全部控件与图片
    <section
      className="bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="page-rail pb-16">
        <h2>{t['featured.title']}</h2>
        <p className="mt-2 max-w-2xl text-neutral-500">{t['featured.subtitle']}</p>

        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-300 bg-surface-card shadow-sm">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${(index % count) * 100}%)` }}
          >
            {items.map((entry) => {
              const date = formatFileDate(entry.file, locale);
              return (
                <img
                  key={entry.file}
                  src={`/live/featured/${entry.file}.webp`}
                  alt={fill(t['featured.imageAlt'], { date })}
                  loading="lazy"
                  onError={() => markFailed(entry.file)}
                  className="aspect-video w-full shrink-0 object-cover"
                />
              );
            })}
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <div className="flex items-center gap-3">
            {count > 1 && (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t['featured.prev']}
                className="shrink-0 cursor-pointer rounded-full border border-neutral-300 p-2 text-neutral-700 transition-colors duration-200 hover:border-brand"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            )}

            <span className="font-mono text-sm text-neutral-500">{currentDate}</span>

            {count > 1 && (
              <>
                <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-neutral-400">
                  {fill(t['featured.position'] ?? '{current} / {total}', {
                    current: String((index % count) + 1),
                    total: String(count),
                  })}
                </span>

                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t['featured.next']}
                  className="shrink-0 cursor-pointer rounded-full border border-neutral-300 p-2 text-neutral-700 transition-colors duration-200 hover:border-brand"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            // biome-ignore lint/a11y/useSemanticElements: APG group 模式;fieldset/legend 有默认样式且命名支持不一致
            <div
              role="group"
              aria-label={t['featured.title']}
              className="mt-3 flex min-w-0 items-stretch gap-px"
            >
              {items.map((entry, i) => {
                const date = formatFileDate(entry.file, locale);
                const active = i === index % count;
                return (
                  <button
                    key={entry.file}
                    type="button"
                    aria-current={active || undefined}
                    aria-label={fill(t['featured.goto'] ?? t['featured.imageAlt'], { date })}
                    onClick={() => setIndex(i)}
                    className="group flex h-8 min-w-0 flex-1 cursor-pointer items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
                  >
                    <span
                      className={`block h-1 w-full rounded-full transition-colors duration-200 ${
                        active ? 'bg-brand' : 'bg-neutral-300 group-hover:bg-neutral-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
