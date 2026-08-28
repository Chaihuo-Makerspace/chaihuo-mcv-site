import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, PlayIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog';
import type { Locale } from '@/i18n/index';

export interface LiveVideo {
  /** B 站 BV 号 */
  bvid: string;
  url: string;
  cover: string;
  /** YYYY-MM-DD */
  date: string;
  eyebrow: string;
  title: string;
  description: string;
}

interface LiveVideosProps {
  locale?: Locale;
  t: Record<string, string>;
  videos: LiveVideo[];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

/** '2026-07-28' → zh '2026.07.28' / en 'Jul 28, 2026'（正午取值避免时区跨界） */
function formatDate(date: string, locale: Locale): string {
  if (locale === 'zh') return date.replaceAll('-', '.');
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00+08:00`));
}

export default function LiveVideos({ locale = 'zh', t, videos }: LiveVideosProps) {
  const [playing, setPlaying] = useState<LiveVideo | null>(null);
  // B 站播放器是重 JS 应用，冷启动慢：弹层打开后等 iframe load 再撤掉封面海报
  const [playerReady, setPlayerReady] = useState(false);
  // 空闲时用一个隐藏 iframe 预热播放器的共享 JS/CSS，首次点开弹层就不再是冷启动
  const [warmPlayer, setWarmPlayer] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const railRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const schedule =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = schedule(() => setWarmPlayer(true));
    return () => cancel(id as number);
  }, []);

  // 横向轨道：两端到底时禁用对应箭头（移动端直接滑，不占纵向长度）
  const syncEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 1);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1);
  }, []);

  useEffect(() => {
    syncEdges();
    const rail = railRef.current;
    if (!rail) return;
    window.addEventListener('resize', syncEdges);
    return () => window.removeEventListener('resize', syncEdges);
  }, [syncEdges]);

  const scrollByCard = (delta: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : rail.clientWidth;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: delta * step, behavior: reduced ? 'auto' : 'smooth' });
  };

  // 无视频时整块不渲染（占位内容不外露；页面 frontmatter 也会判空跳过）
  if (videos.length === 0) return null;

  return (
    <section className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2>{t['videos.title']}</h2>
            <p className="mt-2 max-w-2xl text-neutral-500">{t['videos.subtitle']}</p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label={t['videos.prev']}
              className="cursor-pointer rounded-full border border-neutral-300 p-2 text-neutral-700 transition-colors duration-200 hover:border-brand disabled:cursor-default disabled:text-neutral-300 disabled:hover:border-neutral-300"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label={t['videos.next']}
              className="cursor-pointer rounded-full border border-neutral-300 p-2 text-neutral-700 transition-colors duration-200 hover:border-brand disabled:cursor-default disabled:text-neutral-300 disabled:hover:border-neutral-300"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ul
          ref={railRef}
          onScroll={syncEdges}
          className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((video) => (
            <li
              key={video.bvid}
              className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
            >
              <button
                type="button"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setPlayerReady(false);
                  setPlaying(video);
                }}
                aria-label={fill(t['videos.play'], { title: video.title })}
                className="group block w-full cursor-pointer text-left transition-colors duration-200"
              >
                <div className="relative overflow-hidden rounded-lg border border-neutral-300 bg-surface-card">
                  <img
                    src={video.cover}
                    alt=""
                    loading="lazy"
                    width={960}
                    height={540}
                    className="block aspect-video w-full object-cover"
                  />
                  {/* 常态封面完全干净；悬停/聚焦时压暗，中央大播放钮淡入变黄（黄只落在这一小块） */}
                  <span className="absolute inset-0 bg-neutral-950/0 transition-colors duration-200 group-hover:bg-neutral-950/30 group-focus-visible:bg-neutral-950/30" />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <PlayIcon className="ml-0.5 h-5 w-5 fill-current" />
                    </span>
                  </span>
                </div>

                <p className="mt-4 font-mono text-xs text-neutral-500">
                  {video.eyebrow}
                  {' · '}
                  {formatDate(video.date, locale)}
                </p>
                <h3 className="mt-2 text-neutral-900 transition-colors duration-200 group-hover:text-brand-dark">
                  {video.title}
                </h3>
                <p className="mt-2 text-neutral-700">{video.description}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 弹层走 Radix Dialog：焦点锁在弹层内、关闭后焦点回到原卡片、锁滚动、Esc 与遮罩关闭 */}
      <Dialog
        open={playing !== null}
        onOpenChange={(open) => {
          if (!open) setPlaying(null);
        }}
      >
        {playing && (
          <DialogContent
            ref={dialogRef}
            // 默认会把焦点送进跨域 iframe，Esc 就再也回不到本页；改为落在弹层容器上
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              dialogRef.current?.focus();
            }}
            // 关闭时内容与 open 同时卸载，Radix 的自动回焦会落空，手动送回原卡片
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              openerRef.current?.focus();
            }}
            className="w-full max-w-4xl border-none bg-surface-dark p-4 text-surface-dark-foreground sm:max-w-4xl"
          >
            <DialogTitle className="pr-8 font-normal text-base">{playing.title}</DialogTitle>

            {/* 播放器加载期间封面海报盖在 iframe 上面顶住（player.html 会早早刷黑底），load 后再淡出 */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-950">
              <iframe
                key={playing.bvid}
                title={playing.title}
                src={`https://player.bilibili.com/player.html?bvid=${playing.bvid}&autoplay=1&danmaku=0&high_quality=1`}
                allow="autoplay; fullscreen"
                allowFullScreen
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => setPlayerReady(true)}
                className="absolute inset-0 block h-full w-full border-0"
              />
              <img
                src={playing.cover}
                alt=""
                className={`pointer-events-none absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-500 ${playerReady ? 'opacity-0' : 'opacity-100'}`}
              />
            </div>

            {/* B 站播放器在部分网络/浏览器里加载不出来，始终留一条外链兜底 */}
            <a
              href={playing.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm transition-colors duration-200 hover:text-brand"
            >
              {t['videos.external']}
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          </DialogContent>
        )}
      </Dialog>

      {/* 隐藏预热帧：只加载播放器共享资源（autoplay=0），1px 不可见也不拦截交互 */}
      {warmPlayer && videos.length > 0 && (
        <iframe
          aria-hidden="true"
          tabIndex={-1}
          title={t['videos.title']}
          src={`https://player.bilibili.com/player.html?bvid=${videos[0].bvid}&autoplay=0`}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}
    </section>
  );
}
