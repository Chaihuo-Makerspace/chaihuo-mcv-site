import type { Locale } from '@/i18n/index';
import type { LocalizedJournal } from '@/lib/journals';

const ORG_ID = 'https://www.chaihuo.org';

/** 日记详情页的 BlogPosting + BreadcrumbList（GEO：让搜索/生成式引擎识别作者、时间、地点）。 */
export function journalJsonLd(
  journal: LocalizedJournal,
  pageUrl: string,
  locale: Locale,
): Record<string, unknown>[] {
  const origin = new URL(pageUrl).origin;
  const prefix = locale === 'en' ? '/en' : '';
  const image = journal.coverImage ? new URL(journal.coverImage, origin).href : undefined;
  const isZh = locale === 'zh';
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${pageUrl}#article`,
      mainEntityOfPage: pageUrl,
      headline: journal.title,
      description: journal.excerpt,
      datePublished: journal.date,
      inLanguage: isZh ? 'zh-CN' : 'en',
      ...(image ? { image } : {}),
      ...(journal.cityLabel
        ? { contentLocation: { '@type': 'Place', name: journal.cityLabel } }
        : {}),
      ...(journal.tags.length ? { keywords: journal.tags.join(', ') } : {}),
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      ...(journal.yuqueUrl ? { sameAs: journal.yuqueUrl } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: isZh ? '首页' : 'Home',
          item: `${origin}${prefix}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isZh ? '旅途日记' : 'Journals',
          item: `${origin}${prefix}/journals/`,
        },
        { '@type': 'ListItem', position: 3, name: journal.title, item: pageUrl },
      ],
    },
  ];
}
