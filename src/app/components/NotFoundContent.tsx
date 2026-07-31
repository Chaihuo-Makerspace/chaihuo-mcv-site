import { ArrowLeft, MapPin, Route } from 'lucide-react';
import type { Locale } from '@/i18n/index';
import { localePath } from '@/i18n/index';

interface NotFoundContentProps {
  locale: Locale;
  t: Record<string, string>;
}

export default function NotFoundContent({ locale, t }: NotFoundContentProps) {
  return (
    <div className="bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-24 md:py-32 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-brand-dark uppercase">
          {t['code.label']}
        </p>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold text-neutral-900">{t.heading}</h1>
        <p className="mt-4 text-base text-neutral-700 leading-relaxed">{t.body}</p>

        {/* Route motif: the travelled leg ends, the dashed planned leg breaks at a pin. */}
        <div className="mt-12 flex items-start justify-center" aria-hidden="true">
          <span className="mt-[7px] w-2.5 h-2.5 rounded-full bg-neutral-900" />
          <span className="mt-3 w-16 md:w-24 h-0.5 bg-neutral-900" />
          <span className="mt-[7px] w-2.5 h-2.5 rounded-full bg-neutral-900" />
          <span className="mt-3 w-16 md:w-24 border-t-2 border-dashed border-neutral-300" />
          <MapPin className="w-6 h-6 text-brand-dark" />
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={localePath('/', locale)}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-sm hover:bg-brand hover:text-brand-foreground transition-colors duration-200 cursor-pointer text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t['cta.home']}
          </a>
          <a
            href={localePath('/route', locale)}
            className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-900 px-6 py-3 rounded-sm hover:border-neutral-900 transition-colors duration-200 cursor-pointer text-sm font-medium"
          >
            <Route className="w-4 h-4" />
            {t['cta.route']}
          </a>
        </div>
      </div>
    </div>
  );
}
