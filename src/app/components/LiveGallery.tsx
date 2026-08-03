import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/app/components/ui/dialog';
import type { Locale } from '@/i18n/index';

interface LiveGalleryProps {
  locale?: Locale;
  t: Record<string, string>;
}

interface DayEntry {
  day: string;
  count: number;
}

interface HourEntry {
  hour: string;
  files: string[];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

function formatAbsolute(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

/** '20260801-091207' → '2026-08-01T09:12:07+08:00'（archive 文件名即 Asia/Shanghai 墙钟时间） */
function fileToIso(base: string): string {
  return `${base.slice(0, 4)}-${base.slice(4, 6)}-${base.slice(6, 8)}T${base.slice(9, 11)}:${base.slice(11, 13)}:${base.slice(13, 15)}+08:00`;
}

/** '20260801-091207' → '09:12' */
function fileToHHmm(base: string): string {
  return `${base.slice(9, 11)}:${base.slice(11, 13)}`;
}

/** '09' → '09:00–10:00' */
function hourRangeLabel(hour: string): string {
  const next = String((Number.parseInt(hour, 10) + 1) % 24).padStart(2, '0');
  return `${hour}:00–${next}:00`;
}

/** '20260801' → zh '08月01日' / en 'Aug 1'（正午取值避免时区跨界） */
function formatDay(day: string, locale: Locale): string {
  if (locale === 'zh') return `${day.slice(4, 6)}月${day.slice(6, 8)}日`;
  const date = new Date(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T12:00:00+08:00`);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function LiveGallery({ locale = 'zh', t }: LiveGalleryProps) {
  const [days, setDays] = useState<DayEntry[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [hoursByDay, setHoursByDay] = useState<Record<string, HourEntry[]>>({});
  const [expandedHour, setExpandedHour] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // 30 天清理可能让索引里出现 404，加载失败的条目从网格里剔除
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/live/archive/days.json', { cache: 'no-store' });
        if (!response.ok) return;
        const data: { days?: DayEntry[] } = await response.json();
        if (cancelled) return;
        const list = data.days ?? [];
        setDays(list);
        setSelectedDay(list[0]?.day ?? null);
      } catch {
        // 网络抖动或 API 不可用：静默降级为空态，不影响页面其余部分
        if (!cancelled) setDays([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDay || hoursByDay[selectedDay]) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/live/archive/day.json?d=${selectedDay}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data: { hours?: HourEntry[] } = await response.json();
        if (!cancelled) {
          // API 返回带 .jpg 后缀的文件名，归一化为 base（thumb/img 路由以 base 寻址）
          const normalized = (data.hours ?? []).map((h) => ({
            hour: h.hour,
            files: h.files.map((f) => f.replace(/\.jpg$/, '')),
          }));
          setHoursByDay((prev) => ({ ...prev, [selectedDay]: normalized }));
        }
      } catch {
        // 缓存空数组避免反复重试；该天下方不渲染小时行
        if (!cancelled) setHoursByDay((prev) => ({ ...prev, [selectedDay]: [] }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDay, hoursByDay]);

  const hideFile = (base: string) => {
    setHidden((prev) => new Set(prev).add(base));
  };

  const selectDay = (day: string) => {
    setSelectedDay(day);
    setExpandedHour(null);
    setLightboxIndex(null);
  };

  const toggleHour = (hour: string) => {
    setExpandedHour((prev) => (prev === hour ? null : hour));
    setLightboxIndex(null);
  };

  const expandedFiles = useMemo(() => {
    if (!selectedDay || !expandedHour) return [];
    const entry = hoursByDay[selectedDay]?.find((h) => h.hour === expandedHour);
    return (entry?.files ?? []).filter((f) => !hidden.has(f));
  }, [selectedDay, expandedHour, hoursByDay, hidden]);

  const lightboxOpen = lightboxIndex !== null && expandedFiles.length > 0;
  const currentIndex = lightboxIndex === null ? 0 : lightboxIndex % expandedFiles.length;
  const currentBase = lightboxOpen ? expandedFiles[currentIndex] : null;
  const currentTime = currentBase ? formatAbsolute(fileToIso(currentBase), locale) : '';

  const step = (delta: number) => {
    setLightboxIndex((prev) => {
      if (prev === null || expandedFiles.length === 0) return prev;
      return (prev + delta + expandedFiles.length) % expandedFiles.length;
    });
  };

  // Radix Dialog 自带 Esc 关闭；这里补左右方向键翻页
  useEffect(() => {
    if (!lightboxOpen) return;
    const len = expandedFiles.length;
    const onKeyDown = (event: KeyboardEvent) => {
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (delta === 0 || len === 0) return;
      setLightboxIndex((prev) => (prev === null ? prev : (prev + delta + len) % len));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // expandedFiles 变化（如剔除 404 项）时以最新长度重挂
  }, [lightboxOpen, expandedFiles.length]);

  const hours = selectedDay ? (hoursByDay[selectedDay] ?? null) : null;

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <h2>{t['gallery.title']}</h2>

        {days !== null && days.length === 0 && (
          <p className="mt-4 text-neutral-500">{t['gallery.empty']}</p>
        )}

        {days !== null && days.length > 0 && (
          <>
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {days.map(({ day, count }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-pressed={day === selectedDay}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    day === selectedDay
                      ? 'border-brand bg-brand text-surface-dark-foreground'
                      : 'border-neutral-300 bg-surface-card text-neutral-700 hover:border-brand'
                  }`}
                >
                  {formatDay(day, locale)}
                  {' · '}
                  {fill(t['gallery.count'], { n: String(count) })}
                </button>
              ))}
            </div>

            <div className="mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-300 bg-surface-card">
              {(hours ?? []).map(({ hour, files }) => {
                const visible = files.filter((f) => !hidden.has(f));
                if (visible.length === 0) return null;
                const expanded = expandedHour === hour;
                const lead = visible[0];
                return (
                  <div key={hour}>
                    <button
                      type="button"
                      onClick={() => toggleHour(hour)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <img
                        src={`/live/archive/thumb/${lead}.webp`}
                        alt=""
                        loading="lazy"
                        onError={() => hideFile(lead)}
                        className="h-10 w-16 shrink-0 rounded object-cover"
                      />
                      <span className="font-medium">{hourRangeLabel(hour)}</span>
                      <span className="text-sm text-neutral-500">
                        {fill(t['gallery.count'], { n: String(visible.length) })}
                      </span>
                      <ChevronDownIcon
                        className={`ml-auto h-4 w-4 text-neutral-400 transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expanded && (
                      <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-3 md:grid-cols-4">
                        {visible.map((base, index) => (
                          <button
                            key={base}
                            type="button"
                            onClick={() => setLightboxIndex(index)}
                            className="group relative overflow-hidden rounded"
                          >
                            <img
                              src={`/live/archive/thumb/${base}.webp`}
                              alt={fill(t['gallery.imageAlt'], {
                                time: formatAbsolute(fileToIso(base), locale),
                              })}
                              loading="lazy"
                              onError={() => hideFile(base)}
                              className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80"
                            />
                            <span className="absolute bottom-1 right-1 rounded bg-surface-dark/70 px-1.5 py-0.5 text-xs text-surface-dark-foreground">
                              {fileToHHmm(base)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={lightboxOpen}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      >
        <DialogContent className="border-neutral-700 bg-surface-dark p-4 text-surface-dark-foreground sm:max-w-4xl">
          <DialogTitle className="sr-only">
            {currentBase ? fill(t['gallery.imageAlt'], { time: currentTime }) : t['gallery.title']}
          </DialogTitle>
          {currentBase && (
            <div className="flex flex-col gap-3">
              <img
                key={currentBase}
                src={`/live/archive/img/${currentBase}.jpg`}
                alt={fill(t['gallery.imageAlt'], { time: currentTime })}
                onError={() => {
                  hideFile(currentBase);
                  setLightboxIndex(null);
                }}
                className="max-h-[70vh] w-full rounded object-contain"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t['gallery.prev']}
                  className="rounded-full border border-neutral-600 p-2 transition-colors hover:border-brand"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t['gallery.next']}
                  className="rounded-full border border-neutral-600 p-2 transition-colors hover:border-brand"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <span className="text-sm text-neutral-400">{currentTime}</span>
                <a
                  href={`/live/archive/img/${currentBase}.jpg?download=1`}
                  download
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-neutral-600 px-3 py-1.5 text-sm transition-colors hover:border-brand"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {t['gallery.download']}
                </a>
                <DialogClose
                  aria-label={t['gallery.close']}
                  className="rounded-md border border-neutral-600 px-3 py-1.5 text-sm transition-colors hover:border-brand"
                >
                  {t['gallery.close']}
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
