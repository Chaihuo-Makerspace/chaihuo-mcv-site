import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/index';

export interface LiveMeta {
  capturedAt: string;
  bytes: number;
  width: number;
  height: number;
}

interface LiveContentProps {
  locale?: Locale;
  t: Record<string, string>;
  initialMeta: LiveMeta | null;
}

const POLL_INTERVAL_MS = 60_000;
// 超过 2 小时没有新图视为离线（车辆开工间隔不固定，3 分钟一抓，留足余量）
const OFFLINE_AFTER_MS = 2 * 60 * 60 * 1000;

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

function formatRelative(iso: string, now: number, t: Record<string, string>): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return t['time.just'];
  if (minutes < 60) return fill(t['time.minutes'], { n: String(minutes) });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return fill(t['time.hours'], { n: String(hours) });
  return fill(t['time.days'], { n: String(Math.floor(hours / 24)) });
}

export default function LiveContent({ locale = 'zh', t, initialMeta }: LiveContentProps) {
  const [meta, setMeta] = useState<LiveMeta | null>(initialMeta);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      setNow(Date.now());
      try {
        const response = await fetch('/live/status.json', { cache: 'no-store' });
        if (!response.ok) return;
        const data: { meta?: LiveMeta | null } = await response.json();
        if (!cancelled && data.meta?.capturedAt && data.meta.capturedAt !== meta?.capturedAt) {
          setMeta(data.meta);
        }
      } catch {
        // 网络抖动，下一轮再试
      }
    };
    const timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // meta 变化时重建定时器即可（几分钟才变一次，代价为零）
  }, [meta?.capturedAt]);

  const isOnline = meta !== null && now - new Date(meta.capturedAt).getTime() < OFFLINE_AFTER_MS;

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1>{t['hero.title']}</h1>
        <p className="mt-4 max-w-2xl text-neutral-700">{t['hero.body']}</p>

        <div className="mt-10 overflow-hidden rounded-lg border border-neutral-300 bg-surface-card shadow-sm">
          {meta ? (
            <div className="relative">
              <img
                src={`/live/latest.jpg?t=${encodeURIComponent(meta.capturedAt)}`}
                width={meta.width}
                height={meta.height}
                alt={t['image.alt']}
                className={`block aspect-video w-full object-cover transition-opacity ${
                  isOnline ? '' : 'opacity-60'
                }`}
              />
              {/* 状态徽章：黄点是全页唯一循环动画（motion-safe，reduced-motion 时静止） */}
              <div
                className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-surface-dark/80 px-3 py-1.5 text-xs font-medium text-surface-dark-foreground"
                suppressHydrationWarning
              >
                <span className="relative flex h-2 w-2">
                  {isOnline && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-brand motion-safe:animate-ping" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isOnline ? 'bg-brand' : 'bg-neutral-400'
                    }`}
                  />
                </span>
                {isOnline ? t['status.online'] : t['status.offline']}
              </div>
              {!isOnline && (
                <div className="absolute inset-x-0 bottom-0 bg-surface-dark/70 px-4 py-3 text-sm text-surface-dark-foreground">
                  {t['offline.note']}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center px-6 text-center">
              <p className="text-neutral-500">{t['empty.note']}</p>
            </div>
          )}
        </div>

        {meta && (
          <p className="mt-4 text-sm text-neutral-500" suppressHydrationWarning>
            {fill(t['captured.at'], { time: formatAbsolute(meta.capturedAt, locale) })}
            {' · '}
            {formatRelative(meta.capturedAt, now, t)}
          </p>
        )}
      </div>
    </section>
  );
}
