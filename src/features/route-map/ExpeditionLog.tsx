import { Flame, Globe, Zap } from 'lucide-react';
import type { Locale } from '@/i18n/index';

export interface Expedition {
  world: string;
  world_en?: string;
  fire: string;
  fire_en?: string;
  frontier: string;
  frontier_en?: string;
}

export default function ExpeditionLog({
  expedition,
  locale,
}: {
  expedition?: Expedition;
  locale: Locale;
}) {
  if (!expedition) return null;
  const entries = [
    {
      key: 'frontier',
      icon: Zap,
      label: locale === 'zh' ? '越界' : 'FRONTIER',
      text: expedition.frontier,
      highlight: true,
    },
    {
      key: 'world',
      icon: Globe,
      label: locale === 'zh' ? '新世界' : 'NEW WORLD',
      text: expedition.world,
      highlight: false,
    },
    {
      key: 'fire',
      icon: Flame,
      label: locale === 'zh' ? '火种' : 'THE FIRE',
      text: expedition.fire,
      highlight: false,
    },
  ].filter((e) => e.text);
  if (entries.length === 0) return null;

  return (
    <div data-expedition-log="true" className="flex flex-col gap-3">
      {entries.map(({ key, icon: Icon, label, text, highlight }) =>
        highlight ? (
          <div
            key={key}
            className="flex items-start gap-2 rounded-r-lg border-l-2 border-brand bg-brand/10 px-3 py-2"
          >
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-dark" />
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {label}
              </h5>
              <p className="text-[15px] font-bold leading-snug text-neutral-900">{text}</p>
            </div>
          </div>
        ) : (
          <div key={key} className="flex items-start gap-2">
            <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-dark" />
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {label}
              </h5>
              <p className="text-[12.5px] leading-snug text-neutral-700">{text}</p>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
