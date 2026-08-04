import {
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Download,
  Images,
  LogOut,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface DaySummary {
  day: string;
  count: number;
  groupCount: number;
}

interface DayGroup {
  files: string[];
}

interface FeaturedEntry {
  file: string;
  pickedAt: string;
  removedAt: string | null;
}

interface TrashEntry {
  file: string;
  removedAt: string;
  daysLeft: number;
}

interface LiveAdminContentProps {
  t: Record<string, string>;
  title: string;
  days: DaySummary[];
  dayGroups: Record<string, DayGroup[]>;
  initialFeatured: FeaturedEntry[];
  initialTrash: TrashEntry[];
  keepDays: number;
}

type Tab = 'archive' | 'featured' | 'trash';

interface LightboxState {
  /** 翻页上下文：折叠开启时为相似组内全部帧，关闭时为当天平铺列表 */
  frames: string[];
  index: number;
  /** 相似组 >1 张时底部显示组内胶片条 */
  filmstrip: boolean;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

/** '20260803' → '08月03日' */
function dayLabel(day: string): string {
  return `${day.slice(4, 6)}月${day.slice(6, 8)}日`;
}

/** '20260803-145433' → '2026.08.03 14:54' */
function timeLabel(base: string): string {
  return `${base.slice(0, 4)}.${base.slice(4, 6)}.${base.slice(6, 8)} ${base.slice(9, 11)}:${base.slice(11, 13)}`;
}

const THUMB = (base: string) => `/live/archive/thumb/${base}.webp`;
const FULL = (base: string) => `/live/archive/img/${base}.jpg`;
const DOWNLOAD = (base: string) => `/live/admin/file/${base}.jpg`;
const FEATURED_IMG = (base: string) => `/live/featured/${base}.webp`;

export default function LiveAdminContent({
  t,
  title,
  days,
  dayGroups,
  initialFeatured,
  initialTrash,
  keepDays,
}: LiveAdminContentProps) {
  const [tab, setTab] = useState<Tab>('archive');
  const [selectedDays, setSelectedDays] = useState<string[]>(() =>
    days.length > 0 ? [days[0].day] : [],
  );
  const [foldSimilar, setFoldSimilar] = useState(true);
  const [featured, setFeatured] = useState<FeaturedEntry[]>(initialFeatured);
  const [trash, setTrash] = useState<TrashEntry[]>(initialTrash);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [brokenThumbs, setBrokenThumbs] = useState<Set<string>>(new Set());
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const featuredSet = useMemo(
    () => new Set(featured.filter((e) => e.removedAt === null).map((e) => e.file)),
    [featured],
  );
  const activeFeatured = useMemo(
    () =>
      featured
        .filter((e) => e.removedAt === null)
        .sort((a, b) => (a.pickedAt < b.pickedAt ? 1 : -1)),
    [featured],
  );

  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  // ─── 精选 toggle / 恢复：走 API 后本地更新状态 ───
  const postFeatured = useCallback(async (url: string, file: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file }),
    });
    if (response.status === 410) return 'expired' as const;
    if (!response.ok) return 'error' as const;
    const data: { action?: 'featured' | 'unfeatured' | 'restored' } = await response.json();
    return data.action ?? ('error' as const);
  }, []);

  const toggleFeature = useCallback(
    async (base: string) => {
      if (pending.has(base)) return;
      setPending((prev) => new Set(prev).add(base));
      try {
        const result = await postFeatured('/api/live/featured/toggle', base);
        const now = new Date().toISOString();
        if (result === 'expired') notify(t['error.expired']);
        else if (result === 'error') notify(t['error.generic']);
        else if (result === 'unfeatured') {
          setFeatured((prev) => prev.map((e) => (e.file === base ? { ...e, removedAt: now } : e)));
          setTrash((prev) => [
            { file: base, removedAt: now, daysLeft: keepDays },
            ...prev.filter((e) => e.file !== base),
          ]);
        } else if (result === 'featured') {
          setFeatured((prev) => [
            ...prev.filter((e) => e.file !== base),
            { file: base, pickedAt: now, removedAt: null },
          ]);
        } else if (result === 'restored') {
          setFeatured((prev) => prev.map((e) => (e.file === base ? { ...e, removedAt: null } : e)));
          setTrash((prev) => prev.filter((e) => e.file !== base));
        }
      } catch {
        notify(t['error.generic']);
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(base);
          return next;
        });
      }
    },
    [pending, postFeatured, notify, t, keepDays],
  );

  const restore = useCallback(
    async (base: string) => {
      if (pending.has(base)) return;
      setPending((prev) => new Set(prev).add(base));
      try {
        const result = await postFeatured('/api/live/featured/restore', base);
        if (result === 'expired') notify(t['error.expired']);
        else if (result === 'error') notify(t['error.generic']);
        else {
          setFeatured((prev) => prev.map((e) => (e.file === base ? { ...e, removedAt: null } : e)));
          setTrash((prev) => prev.filter((e) => e.file !== base));
        }
      } catch {
        notify(t['error.generic']);
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(base);
          return next;
        });
      }
    },
    [pending, postFeatured, notify, t],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/live/logout', { method: 'POST' });
    } finally {
      window.location.href = '/live';
    }
  }, []);

  // ─── 灯箱 ───
  const stepLightbox = useCallback((delta: number) => {
    setLightbox((prev) => {
      if (!prev) return prev;
      const index = Math.min(prev.frames.length - 1, Math.max(0, prev.index + delta));
      return { ...prev, index };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null);
      else if (event.key === 'ArrowLeft') stepLightbox(-1);
      else if (event.key === 'ArrowRight') stepLightbox(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, stepLightbox]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const visibleDays = useMemo(
    () => days.filter((d) => selectedDays.includes(d.day)),
    [days, selectedDays],
  );

  const imageAlt = (base: string) => fill(t['image.alt'], { time: timeLabel(base) });

  const starButton = (base: string, className: string) => {
    const isFeatured = featuredSet.has(base);
    return (
      <button
        type="button"
        aria-label={isFeatured ? t['action.unfeature'] : t['action.feature']}
        title={isFeatured ? t['action.unfeature'] : t['action.feature']}
        onClick={(event) => {
          event.stopPropagation();
          toggleFeature(base);
        }}
        className={className}
      >
        <Star size={16} aria-hidden className={isFeatured ? 'fill-current text-brand-dark' : ''} />
      </button>
    );
  };

  const downloadLink = (base: string, className: string) => (
    <a
      href={DOWNLOAD(base)}
      download
      aria-label={t['action.download']}
      title={t['action.download']}
      onClick={(event) => event.stopPropagation()}
      className={className}
    >
      <Download size={16} aria-hidden />
    </a>
  );

  const overlayActionClass =
    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-surface-card/90 text-neutral-700 transition-colors duration-200 hover:text-brand-dark';

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'archive', label: t['tab.archive'], icon: <Images size={16} aria-hidden /> },
    {
      id: 'featured',
      label: t['tab.featured'],
      icon: <Star size={16} aria-hidden />,
      count: activeFeatured.length,
    },
    {
      id: 'trash',
      label: t['tab.trash'],
      icon: <Trash2 size={16} aria-hidden />,
      count: trash.length,
    },
  ];

  return (
    <div className="bg-surface">
      {/* 顶栏 */}
      <header className="border-b border-neutral-300 bg-surface-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl">{title}</h1>
          <button
            type="button"
            onClick={logout}
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600 transition-colors duration-200 hover:text-neutral-900"
          >
            <LogOut size={16} aria-hidden />
            {t.logout}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 md:flex-row">
        {/* 左栏：tab 菜单 + 筛选 */}
        <aside className="w-full shrink-0 md:w-52">
          <nav className="flex gap-1 md:flex-col" aria-label={t['tab.archive']}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors duration-200 ${
                  tab === item.id
                    ? 'border-neutral-300 bg-surface-card font-semibold text-neutral-900'
                    : 'border-transparent text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span className="font-mono text-xs text-neutral-500">{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          {tab === 'archive' && days.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-neutral-700">{t['filter.days']}</p>
              <div className="mt-2 flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                {days.map((d) => (
                  <label
                    key={d.day}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-neutral-700 transition-colors duration-200 hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(d.day)}
                      onChange={() => toggleDay(d.day)}
                      className="h-4 w-4 cursor-pointer accent-brand-dark"
                    />
                    <span className="font-mono text-xs">{dayLabel(d.day)}</span>
                    <span className="ml-auto font-mono text-xs text-neutral-400">{d.count}</span>
                  </label>
                ))}
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={foldSimilar}
                  onChange={(event) => setFoldSimilar(event.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-brand-dark"
                />
                {t['filter.foldSimilar']}
              </label>
            </div>
          )}
        </aside>

        {/* 右栏 */}
        <div className="min-w-0 flex-1">
          {tab === 'archive' && (
            <>
              {visibleDays.length === 0 && (
                <p className="py-16 text-center text-sm text-neutral-500">{t['archive.empty']}</p>
              )}
              {visibleDays.map((summary) => {
                const groups = dayGroups[summary.day] ?? [];
                const flatFiles = groups.flatMap((g) => g.files);
                const items: DayGroup[] = foldSimilar
                  ? groups
                  : flatFiles.map((file) => ({ files: [file] }));
                return (
                  <section key={summary.day} className="mb-10">
                    <h2 className="text-base font-semibold">
                      <span className="font-mono">{dayLabel(summary.day)}</span>
                      <span className="ml-2 text-sm font-normal text-neutral-500">
                        {foldSimilar
                          ? fill(t['day.summary'], {
                              total: String(summary.count),
                              groups: String(summary.groupCount),
                            })
                          : fill(t['day.summaryFlat'], { total: String(summary.count) })}
                      </span>
                    </h2>
                    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {items.map((group) => {
                        const rep = group.files[0];
                        return (
                          <div
                            key={rep}
                            className="group relative aspect-video overflow-hidden rounded-sm bg-neutral-200"
                          >
                            <img
                              src={THUMB(rep)}
                              alt={imageAlt(rep)}
                              loading="lazy"
                              className="block h-full w-full object-cover"
                            />
                            {/* 整格点击进入灯箱 */}
                            <button
                              type="button"
                              aria-label={imageAlt(rep)}
                              onClick={() =>
                                setLightbox(
                                  foldSimilar
                                    ? {
                                        frames: group.files,
                                        index: 0,
                                        filmstrip: group.files.length > 1,
                                      }
                                    : {
                                        frames: flatFiles,
                                        index: flatFiles.indexOf(rep),
                                        filmstrip: false,
                                      },
                                )
                              }
                              className="absolute inset-0 cursor-pointer"
                            />
                            {foldSimilar && group.files.length > 1 && (
                              <span className="absolute right-1 top-1 rounded bg-surface-dark/70 px-1.5 py-0.5 font-mono text-[10px] leading-none text-surface-dark-foreground">
                                {fill(t['similar.badge'], { n: String(group.files.length) })}
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-surface-dark/60 p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              {starButton(rep, overlayActionClass)}
                              {downloadLink(rep, overlayActionClass)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </>
          )}

          {tab === 'featured' &&
            (activeFeatured.length === 0 ? (
              <p className="py-16 text-center text-sm text-neutral-500">{t['featured.empty']}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {activeFeatured.map((entry) => (
                  <figure
                    key={entry.file}
                    className="overflow-hidden rounded-md border border-neutral-300 bg-surface-card"
                  >
                    <img
                      src={FEATURED_IMG(entry.file)}
                      alt={imageAlt(entry.file)}
                      loading="lazy"
                      className="block aspect-video w-full object-cover"
                    />
                    <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="font-mono text-xs text-neutral-500">
                        {timeLabel(entry.file)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFeature(entry.file)}
                        disabled={pending.has(entry.file)}
                        className="flex cursor-pointer items-center gap-1 text-xs text-neutral-600 transition-colors duration-200 hover:text-brand-dark disabled:opacity-50"
                      >
                        <StarOff size={14} aria-hidden />
                        {t['action.unfeature']}
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}

          {tab === 'trash' &&
            (trash.filter((e) => !brokenThumbs.has(e.file)).length === 0 ? (
              <p className="py-16 text-center text-sm text-neutral-500">{t['trash.empty']}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {trash
                  .filter((entry) => !brokenThumbs.has(entry.file))
                  .map((entry) => (
                    <figure
                      key={entry.file}
                      className="overflow-hidden rounded-md border border-neutral-300 bg-surface-card"
                    >
                      <img
                        src={THUMB(entry.file)}
                        alt={imageAlt(entry.file)}
                        loading="lazy"
                        onError={() => setBrokenThumbs((prev) => new Set(prev).add(entry.file))}
                        className="block aspect-video w-full object-cover"
                      />
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="font-mono text-xs text-neutral-500">
                          {fill(t['trash.daysLeft'], { n: String(entry.daysLeft) })}
                        </span>
                        <button
                          type="button"
                          onClick={() => restore(entry.file)}
                          disabled={pending.has(entry.file)}
                          className="flex cursor-pointer items-center gap-1 text-xs text-neutral-600 transition-colors duration-200 hover:text-brand-dark disabled:opacity-50"
                        >
                          <ArchiveRestore size={14} aria-hidden />
                          {t['action.restore']}
                        </button>
                      </figcaption>
                    </figure>
                  ))}
              </div>
            ))}
        </div>
      </div>

      {/* 灯箱 */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-surface-dark/95"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-mono text-xs text-surface-dark-foreground/70">
              {timeLabel(lightbox.frames[lightbox.index])} · {lightbox.index + 1}/
              {lightbox.frames.length}
            </span>
            <div className="flex items-center gap-2">
              {starButton(
                lightbox.frames[lightbox.index],
                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-surface-dark-foreground transition-colors duration-200 hover:bg-neutral-800',
              )}
              {downloadLink(
                lightbox.frames[lightbox.index],
                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-surface-dark-foreground transition-colors duration-200 hover:bg-neutral-800',
              )}
              <button
                type="button"
                aria-label={t['action.close']}
                onClick={() => setLightbox(null)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-surface-dark-foreground transition-colors duration-200 hover:bg-neutral-800"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-14">
            <img
              src={FULL(lightbox.frames[lightbox.index])}
              alt={imageAlt(lightbox.frames[lightbox.index])}
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              aria-label={t['action.prev']}
              disabled={lightbox.index === 0}
              onClick={() => stepLightbox(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface-dark/70 text-surface-dark-foreground transition-colors duration-200 hover:bg-neutral-800 disabled:opacity-30"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t['action.next']}
              disabled={lightbox.index === lightbox.frames.length - 1}
              onClick={() => stepLightbox(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface-dark/70 text-surface-dark-foreground transition-colors duration-200 hover:bg-neutral-800 disabled:opacity-30"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
          {lightbox.filmstrip && (
            <div className="no-scrollbar flex justify-start gap-1.5 overflow-x-auto px-4 pb-4 pt-2 md:justify-center">
              {lightbox.frames.map((frame, frameIndex) => (
                <button
                  key={frame}
                  type="button"
                  aria-label={imageAlt(frame)}
                  onClick={() => setLightbox({ ...lightbox, index: frameIndex })}
                  className={`aspect-video h-16 shrink-0 cursor-pointer overflow-hidden rounded-sm transition-opacity duration-200 ${
                    frameIndex === lightbox.index
                      ? 'ring-2 ring-brand'
                      : 'opacity-50 hover:opacity-90'
                  }`}
                >
                  <img
                    src={THUMB(frame)}
                    alt=""
                    loading="lazy"
                    className="block h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作反馈 */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-surface-dark-foreground shadow-lg"
        >
          {notice}
        </div>
      )}
    </div>
  );
}
