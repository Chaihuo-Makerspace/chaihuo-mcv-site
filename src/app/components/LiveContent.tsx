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
  /** 抓拍间隔（分钟），来自 latest.json 的 intervalMinutes */
  intervalMinutes: number;
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

export default function LiveContent({
  locale = 'zh',
  t,
  initialMeta,
  intervalMinutes,
}: LiveContentProps) {
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
      <div className="page-rail py-16">
        <h1>{t['hero.title']}</h1>
        <p className="mt-4 max-w-2xl text-neutral-700">{t['hero.body']}</p>

        {/* 深色「监视器」容器：相机画面在深色包围里读作"车的眼睛" */}
        <div className="mt-10 rounded-xl bg-surface-dark p-4 sm:p-6">
          {/* 状态行：静态圆点（全页循环动画额度让给轮播），mono 呼应 OSD 时间戳 */}
          <div
            className="flex items-center gap-2 font-mono text-xs text-surface-dark-foreground"
            suppressHydrationWarning
          >
            <span
              className={`inline-flex h-2 w-2 rounded-full ${
                isOnline ? 'bg-brand' : 'bg-neutral-400'
              }`}
            />
            {isOnline ? t['status.online'] : t['status.offline']}
          </div>

          <div className="mt-3 overflow-hidden rounded-lg">
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
                {!isOnline && (
                  <div className="absolute inset-x-0 bottom-0 bg-surface-dark/70 px-4 py-3 text-sm text-surface-dark-foreground">
                    {t['offline.note']}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center">
                <p className="text-neutral-400">{t['empty.note']}</p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 font-mono text-sm text-neutral-500" suppressHydrationWarning>
          {meta && (
            <>
              {fill(t['captured.at'], { time: formatAbsolute(meta.capturedAt, locale) })}
              {' · '}
              {formatRelative(meta.capturedAt, now, t)}
              {' · '}
            </>
          )}
          {fill(t['interval.note'], { n: String(intervalMinutes) })}
        </p>
      </div>
    </section>
  );
}
