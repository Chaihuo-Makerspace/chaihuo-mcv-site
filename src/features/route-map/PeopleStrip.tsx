import type { Locale } from '@/i18n/index';

export interface RoutePerson {
  name: string;
  name_en?: string;
  role?: string;
  role_en?: string;
  image?: string;
  bio?: string;
  bio_en?: string;
}

export default function PeopleStrip({
  people,
  locale = 'zh',
}: {
  people?: RoutePerson[];
  locale?: Locale;
}) {
  if (!people || people.length === 0) return null;

  return (
    <div data-people-strip="true" className="flex flex-col gap-2.5">
      {people.map((p) => {
        const name = locale === 'en' ? (p.name_en ?? p.name) : p.name;
        const role = locale === 'en' ? (p.role_en ?? p.role) : p.role;
        const bio = locale === 'en' ? (p.bio_en ?? p.bio) : p.bio;
        return (
          <div
            key={p.name}
            data-people-card="true"
            className="flex items-start gap-3 rounded-xl border border-surface-warm-border/50 bg-surface-warm/60 p-2.5"
          >
            {p.image && (
              <img
                src={p.image}
                alt={name}
                loading="lazy"
                className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold text-neutral-800">{name}</span>
                {role && <span className="text-[10px] font-medium text-neutral-500">{role}</span>}
              </div>
              {bio && <p className="mt-0.5 text-[11px] leading-snug text-neutral-600">{bio}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
