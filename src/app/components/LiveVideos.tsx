import { ExternalLinkIcon, PlayIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  /** 多选分类；缺省时按 eyebrow 单值兜底（旧 JSON） */
  eyebrows?: string[];
  title: string;
  description: string;
}

function videoTags(video: LiveVideo): string[] {
  if (video.eyebrows && video.eyebrows.length > 0) return video.eyebrows;
  return video.eyebrow ? [video.eyebrow] : [];
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
  const [filter, setFilter] = useState<string | null>(null);
  const [activeId, setActiveId] = useState(videos[0]?.bvid ?? '');
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const video of videos) {
      for (const tag of videoTags(video)) {
        if (!tag || seen.has(tag)) continue;
        seen.add(tag);
        list.push(tag);
      }
    }
    return list;
  }, [videos]);

  const filtered = useMemo(
    () => (filter ? videos.filter((video) => videoTags(video).includes(filter)) : videos),
    [videos, filter],
  );

  const current = filtered.find((video) => video.bvid === activeId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((video) => video.bvid === activeId)) {
      setActiveId(filtered[0].bvid);
    }
  }, [filtered, activeId]);

  useEffect(() => {
    const schedule =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = schedule(() => setWarmPlayer(true));
    return () => cancel(id as number);
  }, []);

  // 选中项滚进桌面列表 / 移动端胶片条，不带动整页
  useEffect(() => {
    if (!current) return;
    const listItem = listRef.current?.querySelector<HTMLElement>(`[data-bvid="${current.bvid}"]`);
    if (listItem && listRef.current) {
      const list = listRef.current;
      const itemTop = listItem.offsetTop;
      const itemBottom = itemTop + listItem.offsetHeight;
      if (itemTop < list.scrollTop || itemBottom > list.scrollTop + list.clientHeight) {
        list.scrollTo({ top: itemTop - 8, behavior: 'smooth' });
      }
    }
    const strip = stripRef.current;
    const stripItem = strip?.querySelector<HTMLElement>(`[data-bvid="${current.bvid}"]`);
    if (strip && stripItem) {
      const left = stripItem.offsetLeft - strip.clientWidth / 2 + stripItem.clientWidth / 2;
      strip.scrollTo({ left, behavior: 'smooth' });
    }
  }, [current]);

  const openPlayer = (video: LiveVideo, opener: HTMLButtonElement | null) => {
    openerRef.current = opener;
    setPlayerReady(false);
    setPlaying(video);
  };

  // 无视频时整块不渲染（占位内容不外露；页面 frontmatter 也会判空跳过）
  if (videos.length === 0 || !current) return null;

  return (
    <section className="overflow-x-clip bg-neutral-50">
      <div className="page-rail py-16">
        <h2>{t['videos.title']}</h2>
        <p className="mt-2 max-w-2xl text-neutral-500">{t['videos.subtitle']}</p>

        {categories.length > 1 && (
          <div className="-mx-6 mt-6 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div
              className="flex w-max snap-x gap-2 px-6"
              role="tablist"
              aria-label={t['videos.title']}
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === null}
                onClick={() => setFilter(null)}
                className={`shrink-0 cursor-pointer snap-start rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                  filter === null
                    ? 'bg-neutral-900 text-white'
                    : 'border border-neutral-300 text-neutral-700 hover:border-neutral-900'
                }`}
              >
                {t['videos.all']}
              </button>
              {categories.map((category) => {
                const selected = filter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setFilter(category)}
                    className={`shrink-0 cursor-pointer snap-start rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                      selected
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-300 text-neutral-700 hover:border-neutral-900'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <button
              type="button"
              onClick={(event) => openPlayer(current, event.currentTarget)}
              aria-label={fill(t['videos.play'], { title: current.title })}
              className="group relative block aspect-video w-full max-w-full cursor-pointer overflow-hidden rounded-lg border border-neutral-300 bg-surface-card text-left transition-colors duration-200"
            >
              <img
                src={current.cover}
                alt=""
                width={960}
                height={540}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-neutral-950/0 transition-colors duration-200 group-hover:bg-neutral-950/30 group-focus-visible:bg-neutral-950/30" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-foreground transition-transform duration-200 group-active:scale-95 sm:h-14 sm:w-14">
                  <PlayIcon className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
                </span>
              </span>
            </button>

            {filtered.length > 1 && (
              <div
                ref={stripRef}
                className="-mx-6 mt-3 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
              >
                <ul
                  aria-label={t['videos.filmstrip']}
                  className="flex w-max snap-x snap-mandatory gap-2 px-6 pb-1"
                >
                  {filtered.map((video) => {
                    const selected = video.bvid === current.bvid;
                    return (
                      <li
                        key={video.bvid}
                        data-bvid={video.bvid}
                        className="w-28 shrink-0 snap-start"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveId(video.bvid)}
                          aria-current={selected ? 'true' : undefined}
                          aria-label={video.title}
                          className={`block w-full cursor-pointer overflow-hidden rounded-md transition-colors duration-200 ${
                            selected
                              ? 'ring-2 ring-brand ring-offset-2 ring-offset-neutral-50'
                              : 'ring-1 ring-neutral-300'
                          }`}
                        >
                          <img
                            src={video.cover}
                            alt=""
                            loading="lazy"
                            width={320}
                            height={180}
                            className="aspect-video h-auto w-full object-cover"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <p className="mt-4 font-mono text-xs text-neutral-500">
              {current.eyebrow}
              {' · '}
              {formatDate(current.date, locale)}
            </p>
            <h3 className="mt-2 break-words text-neutral-900">{current.title}</h3>
            {current.description && (
              <p className="mt-2 max-w-2xl break-words text-neutral-700">{current.description}</p>
            )}
          </div>

          {filtered.length > 1 && (
            <div className="hidden min-w-0 lg:col-span-5 lg:block">
              <ul
                ref={listRef}
                aria-label={t['videos.playlist']}
                className="flex max-h-[28rem] flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
              >
                {filtered.map((video) => {
                  const selected = video.bvid === current.bvid;
                  return (
                    <li key={video.bvid} data-bvid={video.bvid}>
                      <button
                        type="button"
                        onClick={() => setActiveId(video.bvid)}
                        aria-current={selected ? 'true' : undefined}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 ${
                          selected ? 'bg-brand-light' : 'hover:bg-neutral-100'
                        }`}
                      >
                        <img
                          src={video.cover}
                          alt=""
                          loading="lazy"
                          width={160}
                          height={90}
                          className="aspect-video w-28 shrink-0 rounded-md object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block font-mono text-[11px] text-neutral-500">
                            {video.eyebrow}
                            {' · '}
                            {formatDate(video.date, locale)}
                          </span>
                          <span
                            className={`mt-1 block line-clamp-2 text-sm leading-snug ${
                              selected ? 'font-medium text-neutral-900' : 'text-neutral-800'
                            }`}
                          >
                            {video.title}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
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
